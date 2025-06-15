import { Image } from 'expo-image';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { IconSymbol } from '@/components/ui/IconSymbol';

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, View, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { FontAwesome } from '@expo/vector-icons'; // For the plus icon
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors'; // For placeholder text color

const API_BASE_URL = "https://parmaexpo-app.vercel.app";


interface ReportListItem {
  report_id: string;
  patients_name: string;
  test_date: string;
  status: string | null;
  tests: string; // Comma-separated list of test names
}

// Define ReportCard as a functional component
const ReportCard = ({
  item,
  cardBackgroundColor,
  cardBorderColor,
  onPress
}: {
  item: ReportListItem;
  cardBackgroundColor: string;
  cardBorderColor: string;
  onPress: () => void;
}) => (
  <TouchableOpacity onPress={onPress}>
    <ThemedView style={[styles.reportItemCard, { backgroundColor: cardBackgroundColor, borderColor: cardBorderColor }]}>
      <ThemedView style={styles.reportItemHeader}>
        <ThemedText type="defaultSemiBold">Report ID: {item.report_id}</ThemedText>
        <ThemedText style={styles.statusText(item.status)}>{item.status || 'N/A'}</ThemedText>
      </ThemedView>
      <ThemedText>Patient: {item.patients_name}</ThemedText>
      <ThemedText>Tests: {item.tests}</ThemedText>
      <ThemedText>Date: {new Date(item.test_date).toLocaleDateString()}</ThemedText>
    </ThemedView>
  </TouchableOpacity>
);

export default function TabTwoScreen() {

  const router = useRouter();
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [filteredReports, setFilteredReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  const fabBackgroundColor = useThemeColor({ light: Colors.light.tint, dark: Colors.dark.tint }, 'tint');
  const cardBackgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#2C2C2E' }, 'background');
  const cardBorderColor = useThemeColor({ light: '#E0E0E0', dark: '#3A3A3C' }, 'background');
  const placeholderTextColor = useThemeColor({ light: Colors.light.gray, dark: Colors.dark.gray }, 'gray');


  const fetchReports = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/reports`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setReports(data.reports);
        setFilteredReports(data.reports);
      } else {
        throw new Error(data.message || 'Failed to fetch reports');
      }
    } catch (e: any) {
      console.error("Failed to fetch reports:", e);
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Refetch reports when the screen comes into focus after a potential add/edit operation
  useFocusEffect(
    useCallback(() => {
      // Don't refetch if it's the initial load handled by useEffect
      if (!loading) {
        fetchReports();
      }
    }, [loading]) // Add dependencies if fetchReports relies on other state/props
  );

  // useEffect(() => {
  //   if (searchTerm === '') {
  //     setFilteredReports(reports);
  //   } else {
  //     setFilteredReports(
  //       reports.filter(report =>
  //         report.report_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //         report.patients_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //         report.tests.toLowerCase().includes(searchTerm.toLowerCase())
  //       )
  //     );
  //   }
  // }, [searchTerm, reports]);


  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReports();
  }, []);

  if (loading && reports.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemedText>Loading Reports...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="defaultSemiBold" style={styles.errorText}>Error loading reports:</ThemedText>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity onPress={fetchReports} style={styles.retryButton}>
          <ThemedText style={{ color: '#fff' }}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }


  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: 'rgb(255, 180, 207)', dark: 'rgb(71, 0, 31)' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#D50099"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Reports</ThemedText>
      </ThemedView>
      {/* <TextInput
        style={[styles.searchInput, { backgroundColor: cardBackgroundColor, color: useThemeColor({}, 'text'), borderColor: cardBorderColor }]}
        placeholder="Search Reports by ID, Patient, Tests..."
        placeholderTextColor={placeholderTextColor}
        value={searchTerm}
        onChangeText={setSearchTerm}
      /> */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: fabBackgroundColor }]}
        onPress={() => router.push('/(screens)/add_report')}
      >
        <FontAwesome name="plus" size={24} color="white" />
      </TouchableOpacity>
      <ScrollView style={styles.listContentContainer}>
        {reports.length > 0 ? (
          reports.map((report) => (
            <ReportCard
              key={report.report_id}
              item={report}
              cardBackgroundColor={cardBackgroundColor}
              cardBorderColor={cardBorderColor}
              onPress={() => router.push(`/(screens)/report/${report.report_id}`)}
            />
          ))
        ) : (
          // Display this when reports array is empty (and not initial loading/error)
          <ThemedView style={[styles.centered, { minHeight: 150, paddingTop: 20 }]}>
            <ThemedText>No reports found.</ThemedText>
          </ThemedView>
        )}
      </ScrollView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    height: 45,
    borderWidth: 1,
    paddingHorizontal: 15,
    marginHorizontal: 16, // Match ParallaxScrollView padding
    marginTop: 10,
    borderRadius: 8,
    fontSize: 16,
  },

  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%', // Ensure centered view takes full width of its container
    padding: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  listContentContainer: {
    padding: 8,
  },
  reportItemCard: {
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 0,
    borderRadius: 8,
    borderWidth: 1,
    // elevation: 2, // Android shadow
    // shadowColor: '#000', // iOS shadow
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.2,
    // shadowRadius: 2,
  },
  reportItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    backgroundColor: "transparent",
  },
  statusText: (status: string | null) => ({
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden', // for borderRadius to work on Text on Android
    color: status === 'Completed' ? 'green' : status === 'Pending' ? 'orange' : 'grey',
    // backgroundColor: status === 'Completed' ? '#D4EDDA' : status === 'Pending' ? '#FFF3CD' : '#E2E3E5',
  }),
  fab: {
    position: 'absolute',
    margin: 16,
    right: 16,
    top: 1,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

import React, { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, ActivityIndicator, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons'; // Changed to FontAwesome

// import { HelloWave } from '@/components/HelloWave'; // No longer used
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// Define the API base URL - REPLACE <YOUR_LOCAL_IP> with your actual local IP address
// Example: const API_BASE_URL = 'http://192.168.1.5:3000/api';
const API_BASE_URL = "https://parmaexpo-app.vercel.app";

interface ReportStatus {
  status: string | null; // Status can be null if not set in DB
  count: number;
}

interface DashboardSummary {
  totalReports: number;
  totalPatients: number;
  totalDoctors: number;
  totalTests: number;
  reportsByStatus: ReportStatus[];
  recentReports: number;
}

export default function HomeScreen() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/dashboard-summary`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setSummary(data.summary);
      } else {
        throw new Error(data.message || 'Failed to fetch summary data');
      }
    } catch (e: any) {
      console.error("Failed to fetch dashboard data:", e);
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemedText>Loading Dashboard...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="defaultSemiBold" style={styles.errorText}>Error loading dashboard:</ThemedText>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </ThemedView>
    );
  }

  if (!summary) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>No dashboard data available.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#E9ADD0', dark: '#33001E' }} // Adjusted color for a dashboard feel
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Pathology Lab Dashboard</ThemedText>
        {/* <HelloWave /> */}
        <TouchableOpacity onPress={fetchDashboardData} style={styles.refreshButton}>
          <FontAwesome
            name="refresh"
            size={28} 
            color={styles.refreshButtonIcon.color} />
        </TouchableOpacity>
      </ThemedView>

      <View style={styles.dashboardGrid}>
        <DashboardCard
          title="Total Reports"
          value={summary.totalReports.toString()} // Assuming this is count of unique report_id groups
          onPress={() => router.push('/(screens)/reports')} // Or '/explore' if that's the main list
        />
        <DashboardCard
          title="Today's Reports"
          value={summary.recentReports.toString()}
          onPress={() => router.push('/(screens)/reports_today')}
        />
        <DashboardCard
          title="Total Patients"
          value={summary.totalPatients.toString()}
          onPress={() => router.push('/(screens)/patients')}
        />
        <DashboardCard
          title="Total Doctors"
          value={summary.totalDoctors.toString()}
          onPress={() => router.push('/(screens)/doctors')}
        />
        <DashboardCard
          title="Total Tests"
          value={summary.totalTests.toString()}
          onPress={() => router.push('/(screens)/tests')}
        />
      </View>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Report Statuses</ThemedText>
        {summary.reportsByStatus.length > 0 ? (
          summary.reportsByStatus.map((statusItem, index) => (
            <ThemedView key={`${statusItem.status}-${index}`} style={styles.statusItem}>
              <ThemedText type="defaultSemiBold">{statusItem.status || 'N/A'}:</ThemedText>
              <ThemedText>{statusItem.count}</ThemedText>
            </ThemedView>
          ))
        ) : (
          <ThemedText>No report status data available.</ThemedText>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

// A new component for dashboard cards
const DashboardCard = ({ title, value, onPress }: { title: string; value: string; onPress?: () => void }) => {
  const cardContent = (
    <ThemedView style={styles.card}>
      <ThemedText type="subtitle" style={styles.cardTitle}>{title}</ThemedText>
      <ThemedText type="title" style={styles.cardValue}>{value}</ThemedText>
    </ThemedView>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress}>{cardContent}</TouchableOpacity>;
  }
  return cardContent;
};


const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 50, // Adjusted padding
    marginTop: 16,
  },
  // stepContainer: { // Commented out as it's no longer used here
  //   gap: 8,
  //   marginBottom: 8,
  // },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
    tintColor: '#D50099',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 4,
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 0,
    marginTop: 20,
    paddingRight: 0,
  },
  card: {
    paddingVertical: 20,
    paddingHorizontal: 0,
    borderRadius: 12,
    margin: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '44%', // Adjust for 2 cards per row with some spacing
    maxWidth: '100%',
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    boxShadow: '0 1px 3px rgba(50, 8, 39, 0.12), 0 1px 2px rgba(0,0,0,0.24)',
    backgroundColor: 'rgba(251, 101, 178, 0.36)',
  },
  cardTitle: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardValue: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
    gap: 10,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    // backgroundColor will be handled by ThemedView based on light/dark mode
    marginBottom: 6,
  },
  refreshButton: {
    padding: 8, // Add some padding to make it easier to press
  },
  refreshButtonIcon: { // You can use ThemedContext here if you want dynamic colors
    color: '#D50099', // Example color, adjust as needed
  }
});

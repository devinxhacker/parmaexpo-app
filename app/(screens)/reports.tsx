import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome } from '@expo/vector-icons'; // For the plus icon
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors'; // For placeholder text color

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_SERVER;

interface ReportListItem {
    report_id: string;
    patients_name: string;
    test_date: string;
    status: string | null;
    tests: string; // Comma-separated list of test names
}

export default function ReportsScreen() {
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
    const textColor = useThemeColor({}, 'text');


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

    useEffect(() => {
        if (searchTerm === '') {
            setFilteredReports(reports);
        } else {
            setFilteredReports(
                reports.filter(report =>
                    report.report_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    report.patients_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    report.tests.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }
    }, [searchTerm, reports]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchReports();
    }, []);

    const renderReportItem = ({ item }: { item: ReportListItem }) => (
        <TouchableOpacity onPress={() => router.push(`/report/${item.report_id}`)}>
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
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: "All Reports" }} />
            <TextInput
                style={[styles.searchInput, { backgroundColor: cardBackgroundColor, color: textColor, borderColor: cardBorderColor }]}
                placeholder="Search Reports by ID, Patient, Tests..."
                placeholderTextColor={placeholderTextColor}
                value={searchTerm}
                onChangeText={setSearchTerm}
            />
            <FlatList
                data={filteredReports}
                renderItem={renderReportItem}
                keyExtractor={(item) => item.report_id.toString()}
                ListEmptyComponent={() => (
                    <ThemedView style={styles.centered}>
                        <ThemedText>No reports found.</ThemedText>
                    </ThemedView>
                )}
                contentContainerStyle={styles.listContentContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: fabBackgroundColor }]}
                onPress={() => router.push('/add_report')}
            >
                <FontAwesome name="plus" size={24} color="white" />
            </TouchableOpacity>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        marginBottom: 10,
    },
    retryButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginTop: 10,
    },
    searchInput: {
        height: 45,
        borderWidth: 1,
        paddingHorizontal: 15,
        marginHorizontal: 8,
        marginTop: 8,
        borderRadius: 8,
    },
    listContentContainer: {
        padding: 8,
    },
    reportItemCard: {
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 8,
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
        right: 0,
        bottom: 0,
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

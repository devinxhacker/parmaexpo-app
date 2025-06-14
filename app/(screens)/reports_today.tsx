import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_SERVER;

interface ReportListItem {
    report_id: string;
    patients_name: string;
    test_date: string;
    status: string | null;
    tests: string; // Comma-separated list of test names
}

export default function ReportsTodayScreen() {
    const router = useRouter();
    const [reports, setReports] = useState<ReportListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const cardBackgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#2C2C2E' }, 'background');
    const cardBorderColor = useThemeColor({ light: '#E0E0E0', dark: '#3A3A3C' }, 'background');

    const fetchTodaysReports = async () => {
        try {
            setError(null);
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/reports/today`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.success) {
                setReports(data.reports);
            } else {
                throw new Error(data.message || 'Failed to fetch today\'s reports');
            }
        } catch (e: any) {
            console.error("Failed to fetch today's reports:", e);
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTodaysReports();
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (!loading) {
                fetchTodaysReports();
            }
        }, [loading])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchTodaysReports();
    }, []);

    const renderReportItem = ({ item }: { item: ReportListItem }) => (
        <TouchableOpacity onPress={() => router.push(`/(screens)/report/${item.report_id}`)}>
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
        return <ThemedView style={styles.centered}><ActivityIndicator size="large" /><ThemedText>Loading Today's Reports...</ThemedText></ThemedView>;
    }

    if (error) {
        return (
            <ThemedView style={styles.centered}>
                <ThemedText type="defaultSemiBold" style={styles.errorText}>Error:</ThemedText>
                <ThemedText style={styles.errorText}>{error}</ThemedText>
                <TouchableOpacity onPress={fetchTodaysReports} style={styles.retryButton}><ThemedText style={{ color: '#fff' }}>Retry</ThemedText></TouchableOpacity>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: "Today's Reports" }} />
            <FlatList
                data={reports}
                renderItem={renderReportItem}
                keyExtractor={(item) => item.report_id.toString()}
                ListEmptyComponent={() => <ThemedView style={styles.centered}><ThemedText>No reports found for today.</ThemedText></ThemedView>}
                contentContainerStyle={styles.listContentContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
    errorText: { color: 'red', textAlign: 'center', marginBottom: 10 },
    retryButton: { backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5, marginTop: 10 },
    listContentContainer: { padding: 8 },
    reportItemCard: { padding: 16, marginVertical: 8, marginHorizontal: 8, borderRadius: 8, borderWidth: 1 },
    reportItemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, backgroundColor: "transparent" },
    statusText: (status: string | null) => ({
        fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden',
        color: status === 'Completed' ? 'green' : status === 'Pending' ? 'orange' : 'grey',
    }),
});
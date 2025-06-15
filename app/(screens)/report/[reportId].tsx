import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome } from '@expo/vector-icons';
// For PDF and Print, you'd import libraries like:
// import RNPrint from 'react-native-print';
// import RNHTMLtoPDF from 'react-native-html-to-pdf';

const API_BASE_URL = "https://parmaexpo-app.vercel.app";

interface ReportDetailItem {
    report_table_id: number; // PK of the report table row
    report_id: string;
    patients_name: string;
    gender: string;
    age_years: number | null;
    age_months: number | null;
    age_days: number | null;
    test_name: string;
    test_rate: number | null;
    component_name: string | null;
    specimen: string | null;
    test_unit: string | null;
    reference_range: string | null;
    result: string | null;
    method: string | null;
    report_item_comments: string | null;
    status: string | null; // Status of this specific test/component
    doctor_name: string;
    test_date: string;
    // overall_report_comments: string | null; // If you fetch these separately
    // overall_report_status: string | null;
}

export default function ReportDetailScreen() {
    const router = useRouter();
    const { reportId } = useLocalSearchParams<{ reportId: string }>();
    const [reportDetails, setReportDetails] = useState<ReportDetailItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReportDetails = async () => {
        if (!reportId) return;
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${API_BASE_URL}/api/reports/detail/${reportId}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.success) {
                setReportDetails(data.reportItems);
            } else {
                throw new Error(data.message || 'Failed to fetch report details');
            }
        } catch (e: any) {
            console.error("Failed to fetch report details:", e);
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportDetails();
    }, [reportId]);

    // Optional: Refetch if screen comes into focus and data might have changed
    useFocusEffect(
        useCallback(() => {
            if (!loading && reportId) { // Avoid refetch on initial load if already handled
                // fetchReportDetails(); // Uncomment if you need to refresh on focus
            }
        }, [loading, reportId])
    );


    const handleDeleteReport = async () => {
        if (!reportId) return;
        Alert.alert(
            "Delete Report",
            `Are you sure you want to delete report ${reportId}? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}`, {
                                method: 'DELETE',
                            });
                            const data = await response.json();
                            if (response.ok && data.success) {
                                Alert.alert("Success", "Report deleted successfully.");
                                router.back(); // Go back to the reports list
                            } else {
                                throw new Error(data.message || 'Failed to delete report');
                            }
                        } catch (e: any) {
                            Alert.alert("Error", e.message || "Could not delete report.");
                        }
                    },
                },
            ]
        );
    };

    const handleSharePdf = async () => {
        Alert.alert("Share PDF", "PDF sharing functionality to be implemented.");
        // Example:
        // const options = { html: '<h1>PDF Content</h1>', fileName: `report_${reportId}`, directory: 'Documents' };
        // const file = await RNHTMLtoPDF.convert(options);
        // Share.open({ url: `file://${file.filePath}` });
    };

    const handlePrintReport = async () => {
        Alert.alert("Print Report", "Printing functionality to be implemented.");
        // Example:
        // await RNPrint.print({ html: '<h1>Print Content</h1>' });
    };

    const handleUpdateReport = () => {
        if (!reportId) return;
        router.push(`/(screens)/update_report/${reportId}`);
    };


    if (loading) {
        return (
            <ThemedView style={styles.centered}>
                <ActivityIndicator size="large" />
                <ThemedText>Loading Report Details...</ThemedText>
            </ThemedView>
        );
    }

    if (error) {
        return (
            <ThemedView style={styles.centered}>
                <ThemedText type="defaultSemiBold" style={styles.errorText}>Error loading report:</ThemedText>
                <ThemedText style={styles.errorText}>{error}</ThemedText>
                <TouchableOpacity onPress={fetchReportDetails} style={styles.retryButton}>
                    <ThemedText style={{ color: '#fff' }}>Retry</ThemedText>
                </TouchableOpacity>
            </ThemedView>
        );
    }

    if (!reportDetails || reportDetails.length === 0) {
        return (
            <ThemedView style={styles.centered}>
                <ThemedText>No details found for report ID: {reportId}</ThemedText>
            </ThemedView>
        );
    }

    // Assuming common details are the same across all items for a report_id
    const common = reportDetails[0];

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen options={{ title: `Report: ${common.report_id}` }} />
            <ThemedView style={styles.content}>
                <ThemedText type="title" style={styles.title}>Report: {common.report_id}</ThemedText>
                <ThemedView style={styles.section}>
                    <ThemedText type="subtitle">Patient Information</ThemedText>
                    <ThemedText>Name: {common.patients_name}</ThemedText>
                    <ThemedText>Gender: {common.gender}</ThemedText>
                    <ThemedText>Age: {`${common.age_years || 0}Y ${common.age_months || 0}M ${common.age_days || 0}D`}</ThemedText>
                    <ThemedText>Referred by: Dr. {common.doctor_name}</ThemedText>
                    <ThemedText>Report Date: {new Date(common.test_date).toLocaleDateString()}</ThemedText>
                </ThemedView>

                <ThemedView style={styles.section}>
                    <ThemedText type="subtitle">Test Results</ThemedText>
                    {reportDetails.map((item, index) => (
                        <ThemedView key={item.report_table_id || index} style={styles.testItem}>
                            <ThemedText type="defaultSemiBold">{item.test_name}{item.component_name ? ` - ${item.component_name}` : ''}</ThemedText>
                            <ThemedText>Result: {item.result || 'N/A'}</ThemedText>
                            {item.reference_range && <ThemedText>Reference: {item.reference_range}</ThemedText>}
                            {item.test_unit && <ThemedText>Unit: {item.test_unit}</ThemedText>}
                            {item.method && <ThemedText>Method: {item.method}</ThemedText>}
                            {item.report_item_comments && <ThemedText>Comments: {item.report_item_comments}</ThemedText>}
                            {item.status && <ThemedText>Status: {item.status}</ThemedText>}
                            {/* rate */}
                            {item.test_rate && <ThemedText>Rate: {item.test_rate}</ThemedText>}

                        </ThemedView>
                    ))}
                </ThemedView>

                <View style={styles.buttonContainer}>
                    {/* <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDeleteReport}>
                        <ThemedText style={styles.buttonText}>Delete Report</ThemedText>
                    </TouchableOpacity> */}
                    <TouchableOpacity style={[styles.button, styles.actionButton]} onPress={handleSharePdf}>
                        <ThemedText style={styles.buttonText}>Share PDF</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.actionButton]} onPress={handlePrintReport}>
                        <ThemedText style={styles.buttonText}>Print Report</ThemedText>
                    </TouchableOpacity>
                </View>
                <View style={styles.iconButtonContainer}>
                    <TouchableOpacity style={[styles.iconButtonBase, styles.updateButton]} onPress={handleUpdateReport}>
                        <FontAwesome name="pencil" size={22} color="white" />
                        <ThemedText style={styles.iconButtonText}>Update</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconButtonBase, styles.deleteButton]} onPress={handleDeleteReport}>
                        <FontAwesome name="trash" size={22} color="white" />
                        <ThemedText style={styles.iconButtonText}>Delete</ThemedText>

                    </TouchableOpacity>
                </View>
            </ThemedView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
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
        backgroundColor: 'rgb(249, 71, 208)',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginTop: 10,
    },
    title: {
        marginBottom: 16,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 16,
        padding: 12,
        borderRadius: 8,
        // backgroundColor handled by ThemedView
    },
    testItem: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee', // Use theme color if needed
        marginBottom: 8,
    },
    buttonContainer: {
        marginTop: 24,
        flexDirection: 'column',
        // justifyContent: 'space-around',
        gap: 10,
        marginBottom: 16,
    },
    iconButtonContainer: {
        marginTop: 16,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        gap: 10,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1, // Make buttons take equal space if in a row
    },
    iconButtonBase: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        minWidth: 120, // Ensure buttons have some minimum width
        gap: 8,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    deleteButton: {
        backgroundColor: 'rgb(249, 71, 121)', // Red
    },
    actionButton: {
        backgroundColor: 'rgb(249, 71, 208)', // Blue
    },
    updateButton: {
        backgroundColor: 'rgba(0, 139, 208, 0.51)', // Green
    },
    iconButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

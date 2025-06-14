import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform, Text } from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams, Stack } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme'; // Import useColorScheme
import { Colors } from '@/constants/Colors'; // Import Colors

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_SERVER;



interface Patient { id: string; name: string; }
interface Doctor { id: string; name: string; }
interface Test { id: number; name: string; rate: number; component_id?: number; }
interface SelectedTest extends Test { result?: string; comments?: string; }

// This interface matches the structure from ReportDetailScreen
interface ReportDetailItem {
    report_table_id: number;
    report_id: string; // This is the common report_id for all items
    patient_id: string; // Need to fetch this for pre-selection
    doctor_id: string; // Need to fetch this for pre-selection
    test_id: number; // For matching with availableTests
    component_id?: number;
    test_date: string;
    result: string | null;
    method: string | null;
    report_item_comments: string | null;
    status: string | null; // Overall status, assuming it's consistent
    // other fields like patients_name, doctor_name are not directly needed for form state
    // but are good for display or verification if needed.
}



export default function UpdateReportScreen() {
    const router = useRouter();
    const { reportId: currentReportId } = useLocalSearchParams<{ reportId: string }>();
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';

    const [patientId, setPatientId] = useState<string | undefined>();
    const [doctorId, setDoctorId] = useState<string | undefined>();
    const [testDate, setTestDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([]);
    const [costofSelectedTests, setCostOfSelectedTests] = useState<number>(0);
    const [overallComments, setOverallComments] = useState(''); // Assuming this is part of the report
    const [status, setStatus] = useState('Pending');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [availableTests, setAvailableTests] = useState<Test[]>([]);

    const [loading, setLoading] = useState(false); // For form submission
    const [formLoading, setFormLoading] = useState(true); // For fetching initial data

    const loadDropdownData = async () => {
        try {
            const [patientsRes, doctorsRes, testsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/patients`),
                fetch(`${API_BASE_URL}/api/doctors`),
                fetch(`${API_BASE_URL}/api/tests`),
            ]);
            const patientsData = await patientsRes.json();
            const doctorsData = await doctorsRes.json();
            const testsData = await testsRes.json();

            if (patientsData.success) setPatients(patientsData.patients.map((p: any) => ({ id: p.patient_id, name: `${p.patients_name} (${p.patient_id})` })));
            if (doctorsData.success) setDoctors(doctorsData.doctors.map((d: any) => ({ id: d.doctor_id, name: `${d.doctor_name} (${d.doctor_id})` })));
            if (testsData.success) setAvailableTests(testsData.tests.map((t: any) => ({ id: t.test_id, name: t.test_name, rate: t.test_rate, component_id: t.default_component_id })));

            return testsData.success ? testsData.tests.map((t: any) => ({ id: t.test_id, name: t.test_name, rate: t.test_rate, component_id: t.default_component_id })) : [];
        } catch (error) {
            Alert.alert("Error", "Failed to load dropdown form data.");
            console.error("Dropdown data load error:", error);
            return [];
        }
    };

    const loadReportDetails = async (testsForMapping: Test[]) => {
        if (!currentReportId) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/reports/detail/${currentReportId}`);
            const data = await response.json();
            if (data.success && data.reportItems.length > 0) {
                const reportItems: ReportDetailItem[] = data.reportItems;
                const firstItem = reportItems[0];

                setPatientId(firstItem.patient_id);
                setDoctorId(firstItem.doctor_id);
                setTestDate(new Date(firstItem.test_date));
                setStatus(firstItem.status || 'Pending');
                setOverallComments(firstItem.report_item_comments || ''); // Uses first item's comment as overall

                const preSelectedTests: SelectedTest[] = reportItems.map(item => {
                    const matchedTest = testsForMapping.find(at => at.id === item.test_id && at.component_id === item.component_id);
                    return {
                        id: item.test_id,
                        name: matchedTest?.name || 'Unknown Test',
                        rate: matchedTest?.rate || 0,
                        component_id: item.component_id,
                        result: item.result || '',
                        comments: item.report_item_comments || '',
                    };
                });
                setSelectedTests(preSelectedTests);

            } else {
                Alert.alert("Error", data.message || "Failed to load report details for update.");
                router.back(); // Go back if report can't be loaded
            }
        } catch (error) {
            Alert.alert("Error", "Could not load report details.");
            console.error("Report detail load error:", error);
            router.back();
        }
    };


    useEffect(() => {
        const initializeForm = async () => {
            setFormLoading(true);
            const fetchedAvailableTests = await loadDropdownData();
            await loadReportDetails(fetchedAvailableTests);
            setFormLoading(false);
        };
        initializeForm();
    }, [currentReportId]);

    // useFocusEffect to refresh dropdowns if user adds new patient/doctor/test and comes back
    useFocusEffect(
        useCallback(() => {
            if (!formLoading) { // Don't run on initial load if formLoading is true
                loadDropdownData();
            }
        }, [formLoading])
    );

    useEffect(() => {
        const newCost = selectedTests.reduce((acc, currentTest) => {
            // Explicitly convert rate to a number.
            // (currentTest.rate || 0) handles null/undefined, then Number() converts.
            // E.g., Number("150.50") -> 150.50, Number(0) -> 0.
            return acc + Number(currentTest.rate || 0);
        }, 0);
        setCostOfSelectedTests(newCost);
    }, [selectedTests]);


    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        const currentDate = selectedDate || testDate;
        setShowDatePicker(Platform.OS === 'ios');
        if (event.type === "set" || Platform.OS === 'ios') {
            setTestDate(currentDate);
        }
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
    };

    const handleTestSelection = (test: Test) => {
        setSelectedTests(prev => {
            const isSelected = prev.find(t => t.id === test.id && t.component_id === test.component_id);
            if (isSelected) {
                return prev.filter(t => !(t.id === test.id && t.component_id === test.component_id));
            } else {
                return [...prev, { ...test, result: '', comments: '' }];
            }
        });
    };



    const styles = StyleSheet.create({
        container: { flex: 1 },
        content: { padding: 20, gap: 15 },
        centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
        title: { textAlign: 'center', marginBottom: 20, fontSize: 24, fontWeight: 'bold' },
        label: { fontSize: 16, marginBottom: 5, fontWeight: 'bold' },
        input: {
            borderWidth: 1,
            borderColor: '#ccc',
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 5,
            color: Colors[colorScheme].text,
            fontSize: 16,
        },
        textArea: { height: 100, textAlignVertical: 'top' },
        textAreaShort: { height: 60, textAlignVertical: 'top' },
        dateDisplay: {
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 12,
            borderRadius: 5,
            justifyContent: 'center',
            minHeight: 40,
        },
        dropdownContainerWithAdd: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 8,
        },
        addButton: {
            backgroundColor: 'rgb(249, 71, 208)',
            padding: 10,
            height: 42,
            borderRadius: 5,
            justifyContent: 'center',
            alignItems: 'center',
        },
        addTestButton: {
            paddingHorizontal: 10,
            paddingVertical: 8,
            height: 'auto',
            flexDirection: 'row',
        },
        addTestButtonText: {
            color: 'white',
            fontSize: 14,
            fontWeight: 'bold',
        },
        checkboxListContainer: {
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 5,
            padding: 10,
        },
        checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingVertical: 5 },
        checkbox: { width: 22, height: 22, borderWidth: 1.5, borderColor: 'rgb(249, 71, 208)', marginRight: 12, borderRadius: 100, backgroundColor: '#fff' },
        checkboxSelected: { backgroundColor: 'rgb(249, 71, 208)' },
        checkboxLabel: { fontSize: 16, flexShrink: 1 },
        selectedTestsSection: {
            marginTop: 10,
            padding: 10,
            borderWidth: 1,
            borderColor: '#e0e0e0',
            borderRadius: 5,
            gap: 10,
        },
        selectedTestItem: {
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#f0f0f0',
            gap: 5,
        },
        totalCostContainer: {
            alignItems: 'flex-end', // Aligns children (the text) to the right
            marginTop: 8, // Spacing from the checkbox list
        },
        totalCostText: {
            fontSize: 16,
            fontWeight: 'bold',
        },
        button: { backgroundColor: 'rgb(249, 71, 208)', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
        buttonDisabled: { backgroundColor: '#A9A9A9' },
        buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    });

    const pickerSelectStyles = StyleSheet.create({
        inputIOS: {
            ...styles.input,
            paddingVertical: 0,
        },
        inputAndroid: {
            ...styles.input,
            paddingVertical: 0,
        },
        placeholder: {
            color: Colors[colorScheme].gray,
        },
        iconContainer: {
            top: 10,
            right: 12,
        },
    });
    

    const handleUpdateReport = async () => {
        if (!currentReportId || !patientId || !doctorId || selectedTests.length === 0) {
            Alert.alert("Validation Error", "Patient, Doctor, and at least one Test are required.");
            return;
        }
        setLoading(true);
        try {
            const reportData = {
                patient_id: patientId,
                doctor_id: doctorId,
                test_date: testDate.toISOString().split('T')[0],
                overall_comments: overallComments,
                status: status,
                tests_conducted: selectedTests.map(st => ({
                    test_id: st.id,
                    component_id: st.component_id,
                    result: st.result,
                    method: "Default Method", // Or fetch/store this
                    comments: st.comments,
                    status: status, // Or individual status per test
                })),
            };

            const response = await fetch(`${API_BASE_URL}/api/reports/${currentReportId}`, {
                method: 'PUT', // Important: Use PUT for updates
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reportData),
            });
            const responseData = await response.json();

            if (response.ok && responseData.success) {
                Alert.alert("Success", "Report updated successfully!");
                router.back(); // Go back to report detail or list
            } else {
                throw new Error(responseData.message || "Failed to update report");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "An unexpected error occurred.");
            console.error("Update report error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (formLoading) {
        return <ThemedView style={styles.centered}><ActivityIndicator size="large" /><ThemedText>Loading report for update...</ThemedText></ThemedView>;
    }

    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <Stack.Screen options={{ title: `Update Report: ${currentReportId}` }} />
            <ThemedView style={styles.content}>
                <ThemedText type="title" style={styles.title}>Update Report: {currentReportId}</ThemedText>

                {/* Patient Dropdown */}
                <View style={styles.dropdownContainerWithAdd}>
                    <View style={{ flex: 1 }}>
                        <ThemedText style={styles.label}>Patient*</ThemedText>
                        <RNPickerSelect
                            onValueChange={(value) => setPatientId(value)}
                            items={patients.map(p => ({ label: p.name, value: p.id }))}
                            style={pickerSelectStyles}
                            value={patientId}
                            placeholder={{ label: "Select a patient...", value: null }}
                        />
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(screens)/add_patient')}>
                        <FontAwesome name="plus" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Doctor Dropdown */}
                <View style={styles.dropdownContainerWithAdd}>
                    <View style={{ flex: 1 }}>
                        <ThemedText style={styles.label}>Referring Doctor*</ThemedText>
                        <RNPickerSelect
                            onValueChange={(value) => setDoctorId(value)}
                            items={doctors.map(d => ({ label: d.name, value: d.id }))}
                            style={pickerSelectStyles}
                            value={doctorId}
                            placeholder={{ label: "Select a doctor...", value: null }}
                        />
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(screens)/add_doctor')}>
                        <FontAwesome name="plus" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Test Date */}
                <ThemedText style={styles.label}>Test Date*</ThemedText>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateDisplay}>
                    <ThemedText>{testDate.toLocaleDateString()}</ThemedText>
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={testDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? "spinner" : "default"}
                        onChange={onDateChange}
                    />
                )}

                {/* Test Selection */}
                <View style={styles.dropdownContainerWithAdd}>
                    <ThemedText style={[styles.label, { flex: 1 }]}>Tests* (Select multiple)</ThemedText>
                    <TouchableOpacity style={[styles.addButton, styles.addTestButton]} onPress={() => router.push('/(screens)/add_test')}>
                        <FontAwesome name="plus" size={16} color="white" />
                        <Text style={styles.addTestButtonText}> Test</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.checkboxListContainer}>
                    {availableTests.length > 0 ? availableTests.map(test => (
                        <TouchableOpacity
                            key={`${test.id}-${test.component_id || 'comp_none'}`}
                            onPress={() => handleTestSelection(test)}
                            style={styles.checkboxContainer}
                        >
                            <ThemedView style={[
                                styles.checkbox,
                                selectedTests.find(st => st.id === test.id && st.component_id === test.component_id) && styles.checkboxSelected
                            ]} />
                            <ThemedText style={styles.checkboxLabel}>{test.name} (₹{test.rate})</ThemedText>
                        </TouchableOpacity>
                    )) : <ThemedText>No tests available. Add tests first.</ThemedText>}
                </View>
                {selectedTests.length > 0 && (
                    <View style={styles.totalCostContainer}>
                        <ThemedText style={styles.totalCostText}>
                            Total Estimated Cost: ₹{costofSelectedTests}
                        </ThemedText>
                    </View>
                )}


                {/* Inputs for selected tests' results and comments */}
                {selectedTests.length > 0 && (
                    <ThemedView style={styles.selectedTestsSection}>
                        <ThemedText type='subtitle'>Enter Results/Comments for Selected Tests:</ThemedText>
                        {selectedTests.map((st, index) => (
                            <View key={`selected-${st.id}-${st.component_id || index}`} style={styles.selectedTestItem}>
                                <ThemedText type='defaultSemiBold'>{st.name}</ThemedText>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Result"
                                    placeholderTextColor={Colors[colorScheme].gray}
                                    value={st.result}
                                    onChangeText={(text) => {
                                        const newSelectedTests = [...selectedTests];
                                        newSelectedTests[index].result = text;
                                        setSelectedTests(newSelectedTests);
                                    }}
                                />
                                <TextInput
                                    style={[styles.input, styles.textAreaShort]}
                                    placeholder="Comments (optional)"
                                    placeholderTextColor={Colors[colorScheme].gray}
                                    value={st.comments}
                                    onChangeText={(text) => {
                                        const newSelectedTests = [...selectedTests];
                                        newSelectedTests[index].comments = text;
                                        setSelectedTests(newSelectedTests);
                                    }}
                                    multiline
                                />
                            </View>
                        ))}
                    </ThemedView>
                )}

                {/* Overall Comments */}
                <ThemedText style={styles.label}>Overall Comments</ThemedText>
                <TextInput style={[styles.input, styles.textArea]} value={overallComments} onChangeText={setOverallComments} multiline placeholder="Any overall comments for the report" placeholderTextColor={Colors[colorScheme].gray} />

                {/* Status Picker */}
                <ThemedText style={styles.label}>Status*</ThemedText>
                <RNPickerSelect
                    onValueChange={(value) => setStatus(value)}
                    items={[
                        { label: 'Pending', value: 'Pending' },
                        { label: 'Completed', value: 'Completed' },
                        { label: 'Partial', value: 'Partial' },
                    ]}
                    style={pickerSelectStyles}
                    value={status}
                    placeholder={{ label: "Select status...", value: "Pending" }}
                />

                <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleUpdateReport} disabled={loading || formLoading}>
                    {loading || formLoading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Update Report</ThemedText>}
                </TouchableOpacity>
            </ThemedView>
        </ScrollView>
    );
}

import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, View } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_SERVER;

interface PatientData {
    patient_salutation: string;
    patients_name: string;
    guardian_name: string;
    phone_number: string;
    gender: string;
    age_years: string;
    age_months: string;
    age_days: string;
    alternate_phone_number?: string;
    email: string;
    address: string;
    city?: string;
    state?: string;
    zip_code?: string;
}

export default function UpdatePatientScreen() {
    const router = useRouter();
    const { patientId } = useLocalSearchParams<{ patientId: string }>();
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';

    const [patientData, setPatientData] = useState<Partial<PatientData>>({});
    const [loading, setLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(true);

    useEffect(() => {
        if (!patientId) return;
        const fetchPatientDetails = async () => {
            setFormLoading(true);
            try {
                // Fetch all patients and find the one with patientId
                // Ideally, you'd have a GET /api/patients/:patientId endpoint
                const response = await fetch(`${API_BASE_URL}/api/patients`);
                const allPatientsData = await response.json();
                if (allPatientsData.success) {
                    const currentPatient = allPatientsData.patients.find((pat: any) => pat.patient_id === patientId);
                    if (currentPatient) {
                        setPatientData({
                            patient_salutation: currentPatient.patient_salutation || '',
                            patients_name: currentPatient.patients_name || '',
                            guardian_name: currentPatient.guardian_name || '',
                            phone_number: currentPatient.phone_number?.toString() || '',
                            gender: currentPatient.gender || '',
                            age_years: currentPatient.age_years?.toString() || '',
                            age_months: currentPatient.age_months?.toString() || '',
                            age_days: currentPatient.age_days?.toString() || '',
                            alternate_phone_number: currentPatient.alternate_phone_number?.toString() || '',
                            email: currentPatient.email || '',
                            address: currentPatient.address || '',
                            city: currentPatient.city || '',
                            state: currentPatient.state || '',
                            zip_code: currentPatient.zip_code || '',
                        });
                    } else {
                        Alert.alert("Error", "Patient details not found.");
                        router.back();
                    }
                } else {
                    throw new Error(allPatientsData.message || "Failed to fetch patient details");
                }
            } catch (error: any) {
                Alert.alert("Error", error.message || "Could not load patient details.");
                router.back();
            } finally {
                setFormLoading(false);
            }
        };
        fetchPatientDetails();
    }, [patientId]);

    const handleUpdatePatient = async () => {
        if (!patientId || !patientData.patients_name || !patientData.gender) {
            Alert.alert("Validation Error", "Patient Name and Gender are required.");
            return;
        }
        setLoading(true);
        try {
            const payload = {
                ...patientData,
                phone_number: patientData.phone_number ? parseInt(patientData.phone_number) : null,
                age_years: patientData.age_years ? parseInt(patientData.age_years) : null,
                age_months: patientData.age_months ? parseInt(patientData.age_months) : null,
                age_days: patientData.age_days ? parseInt(patientData.age_days) : null,
                alternate_phone_number: patientData.alternate_phone_number ? parseInt(patientData.alternate_phone_number) : null,
            };
            const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const responseData = await response.json();
            if (response.ok && responseData.success) {
                Alert.alert("Success", "Patient updated successfully!");
                router.back();
            } else {
                throw new Error(responseData.message || "Failed to update patient");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (name: keyof PatientData, value: string) => {
        setPatientData(prev => ({ ...prev, [name]: value }));
    };

    const styles = StyleSheet.create({ /* ... (copy styles from add_patient.tsx and adjust) ... */
        container: { flex: 1 }, content: { padding: 20, gap: 10 }, title: { textAlign: 'center', marginBottom: 20 },
        label: { fontSize: 16, marginBottom: 5, fontWeight: 'bold' },
        input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginBottom: 10, color: Colors[colorScheme].text, },
        placeholderText: { color: Colors[colorScheme].gray, }, textArea: { height: 100, textAlignVertical: 'top' },
        ageRow: { flexDirection: 'row', justifyContent: 'space-between', }, ageInput: { flex: 1, marginHorizontal: 2, },
        button: { backgroundColor: Colors[colorScheme].tint, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
        buttonDisabled: { backgroundColor: '#A9A9A9' }, buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    });

    if (formLoading) return <ThemedView style={styles.container}><ActivityIndicator size="large" /></ThemedView>;

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen options={{ title: `Update ${patientData.patients_name || patientId}` }} />
            <ThemedView style={styles.content}>
                <ThemedText type="title" style={styles.title}>Update Patient Details</ThemedText>
                <ThemedText style={styles.label}>Salutation</ThemedText><TextInput style={styles.input} value={patientData.patient_salutation} onChangeText={v => handleChange('patient_salutation', v)} placeholderTextColor={styles.placeholderText.color} />
                <ThemedText style={styles.label}>Patient Name*</ThemedText><TextInput style={styles.input} value={patientData.patients_name} onChangeText={v => handleChange('patients_name', v)} placeholderTextColor={styles.placeholderText.color} />
                <ThemedText style={styles.label}>Guardian Name</ThemedText><TextInput style={styles.input} value={patientData.guardian_name} onChangeText={v => handleChange('guardian_name', v)} placeholderTextColor={styles.placeholderText.color} />
                <ThemedText style={styles.label}>Phone Number</ThemedText><TextInput style={styles.input} value={patientData.phone_number} onChangeText={v => handleChange('phone_number', v)} keyboardType="phone-pad" placeholderTextColor={styles.placeholderText.color} />
                <ThemedText style={styles.label}>Gender*</ThemedText><TextInput style={styles.input} value={patientData.gender} onChangeText={v => handleChange('gender', v)} placeholderTextColor={styles.placeholderText.color} />
                <ThemedText style={styles.label}>Age</ThemedText>
                <View style={styles.ageRow}>
                    <TextInput style={[styles.input, styles.ageInput]} value={patientData.age_years} onChangeText={v => handleChange('age_years', v)} placeholder="Years" keyboardType="number-pad" placeholderTextColor={styles.placeholderText.color} />
                    <TextInput style={[styles.input, styles.ageInput]} value={patientData.age_months} onChangeText={v => handleChange('age_months', v)} placeholder="Months" keyboardType="number-pad" placeholderTextColor={styles.placeholderText.color} />
                    <TextInput style={[styles.input, styles.ageInput]} value={patientData.age_days} onChangeText={v => handleChange('age_days', v)} placeholder="Days" keyboardType="number-pad" placeholderTextColor={styles.placeholderText.color} />
                </View>
                <ThemedText style={styles.label}>Email</ThemedText><TextInput style={styles.input} value={patientData.email} onChangeText={v => handleChange('email', v)} keyboardType="email-address" placeholderTextColor={styles.placeholderText.color} />
                <ThemedText style={styles.label}>Address</ThemedText><TextInput style={[styles.input, styles.textArea]} value={patientData.address} onChangeText={v => handleChange('address', v)} multiline placeholderTextColor={styles.placeholderText.color} />
                {/* Add City, State, Zip if needed */}
                <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleUpdatePatient} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Update Patient</ThemedText>}
                </TouchableOpacity>
            </ThemedView>
        </ScrollView>
    );
}

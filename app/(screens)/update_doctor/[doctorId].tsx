import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

const API_BASE_URL = "https://parmaexpo-app.vercel.app";

interface DoctorData {
    doctor_name: string;
    clinic_name: string;
    email: string;
    phone_number: string; // Keep as string for input
    commission: string;   // Keep as string for input
    address: string;
    paid_commission?: string; // Optional, keep as string
}

export default function UpdateDoctorScreen() {
    const router = useRouter();
    const { doctorId } = useLocalSearchParams<{ doctorId: string }>();
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';

    const [doctorData, setDoctorData] = useState<Partial<DoctorData>>({});
    const [loading, setLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(true);

    useEffect(() => {
        if (!doctorId) return;
        const fetchDoctorDetails = async () => {
            setFormLoading(true);
            try {
                // Assuming you have a GET /api/doctors/:doctorId endpoint or can filter from all doctors
                // For simplicity, let's assume a direct fetch. If not, you'd fetch all and find.
                const response = await fetch(`${API_BASE_URL}/api/doctors`); // Fetch all then filter, or use a specific endpoint
                const allDoctorsData = await response.json();
                if (allDoctorsData.success) {
                    const currentDoctor = allDoctorsData.doctors.find((doc: any) => doc.doctor_id === doctorId);
                    if (currentDoctor) {
                        setDoctorData({
                            doctor_name: currentDoctor.doctor_name,
                            clinic_name: currentDoctor.clinic_name,
                            email: currentDoctor.email,
                            phone_number: currentDoctor.phone_number?.toString() || '',
                            commission: currentDoctor.commission?.toString() || '',
                            address: currentDoctor.address || '',
                            paid_commission: currentDoctor.paid_commission?.toString() || '0',
                        });
                    } else {
                        Alert.alert("Error", "Doctor details not found.");
                        router.back();
                    }
                } else {
                    throw new Error(allDoctorsData.message || "Failed to fetch doctor details");
                }
            } catch (error: any) {
                Alert.alert("Error", error.message || "Could not load doctor details.");
                router.back();
            } finally {
                setFormLoading(false);
            }
        };
        fetchDoctorDetails();
    }, [doctorId]);

    const handleUpdateDoctor = async () => {
        if (!doctorId || !doctorData.doctor_name || !doctorData.clinic_name) {
            Alert.alert("Validation Error", "Doctor Name and Clinic Name are required.");
            return;
        }
        setLoading(true);
        try {
            const payload = {
                ...doctorData,
                phone_number: doctorData.phone_number ? parseInt(doctorData.phone_number) : null,
                commission: doctorData.commission ? parseFloat(doctorData.commission) : null,
                paid_commission: doctorData.paid_commission ? parseFloat(doctorData.paid_commission) : 0,
            };
            const response = await fetch(`${API_BASE_URL}/api/doctors/${doctorId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const responseData = await response.json();
            if (response.ok && responseData.success) {
                Alert.alert("Success", "Doctor updated successfully!");
                router.back();
            } else {
                throw new Error(responseData.message || "Failed to update doctor");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (name: keyof DoctorData, value: string) => {
        setDoctorData(prev => ({ ...prev, [name]: value }));
    };

    const styles = StyleSheet.create({ /* ... (copy styles from add_doctor.tsx and adjust) ... */
        container: { flex: 1 }, content: { padding: 20, gap: 10 }, title: { textAlign: 'center', marginBottom: 20 },
        label: { fontSize: 16, marginBottom: 5, fontWeight: 'bold' },
        input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginBottom: 10, color: Colors[colorScheme].text, },
        placeholderText: { color: Colors[colorScheme].gray, }, textArea: { height: 100, textAlignVertical: 'top' },
        button: { backgroundColor: Colors[colorScheme].tint, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
        buttonDisabled: { backgroundColor: '#A9A9A9' }, buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    });

    if (formLoading) return <ThemedView style={styles.container}><ActivityIndicator size="large" /></ThemedView>;

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen options={{ title: `Update Dr. ${doctorData.doctor_name || doctorId}` }} />
            <ThemedView style={styles.content}>
                <ThemedText type="title" style={styles.title}>Update Doctor Details</ThemedText>
                <ThemedText style={styles.label}>Doctor Name*</ThemedText><TextInput style={styles.input} value={doctorData.doctor_name} onChangeText={v => handleChange('doctor_name', v)} placeholderTextColor={styles.placeholderText.color} />
                <ThemedText style={styles.label}>Clinic Name*</ThemedText><TextInput style={styles.input} value={doctorData.clinic_name} onChangeText={v => handleChange('clinic_name', v)} placeholderTextColor={styles.placeholderText.color} />
                <ThemedText style={styles.label}>Email*</ThemedText><TextInput style={styles.input} value={doctorData.email} onChangeText={v => handleChange('email', v)} keyboardType="email-address" placeholderTextColor={styles.placeholderText.color} />
                <ThemedText style={styles.label}>Phone Number</ThemedText><TextInput style={styles.input} value={doctorData.phone_number} onChangeText={v => handleChange('phone_number', v)} keyboardType="phone-pad" placeholderTextColor={styles.placeholderText.color} />
                <ThemedText style={styles.label}>Commission (%)</ThemedText><TextInput style={styles.input} value={doctorData.commission} onChangeText={v => handleChange('commission', v)} keyboardType="numeric" placeholderTextColor={styles.placeholderText.color} />
                <ThemedText style={styles.label}>Address</ThemedText><TextInput style={[styles.input, styles.textArea]} value={doctorData.address} onChangeText={v => handleChange('address', v)} multiline placeholderTextColor={styles.placeholderText.color} />
                <ThemedText style={styles.label}>Paid Commission</ThemedText><TextInput style={styles.input} value={doctorData.paid_commission} onChangeText={v => handleChange('paid_commission', v)} keyboardType="numeric" placeholderTextColor={styles.placeholderText.color} />
                <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleUpdateDoctor} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Update Doctor</ThemedText>}
                </TouchableOpacity>
            </ThemedView>
        </ScrollView>
    );
}
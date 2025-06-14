import React, { useState } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme'; // Import useColorScheme
import { Colors } from '@/constants/Colors'; // Import Colors

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_SERVER;

export default function AddDoctorScreen() {
    const router = useRouter();
    // const [doctorId, setDoctorId] = useState(''); // ID will be auto-generated
    const [doctorName, setDoctorName] = useState('');
    const [clinicName, setClinicName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [commission, setCommission] = useState('');
    const [address, setAddress] = useState('');
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';

    const [loading, setLoading] = useState(false);

    const handleAddDoctor = async () => {
        if (!doctorName || !clinicName || !email) { // doctorId removed from validation
            Alert.alert("Validation Error", "Doctor Name and Clinic Name are required.");
            return;
        }
        setLoading(true);
        try {
            const doctorData = {
                // doctor_id: doctorId, // Removed
                doctor_name: doctorName,
                clinic_name: clinicName,
                email: email,
                phone_number: phoneNumber ? parseInt(phoneNumber) : null,
                commission: commission ? parseFloat(commission) : null,
                address: address,
            };

            const response = await fetch(`${API_BASE_URL}/api/doctors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(doctorData),
            });
            const responseData = await response.json();

            if (response.ok && responseData.success) {
                Alert.alert("Success", "Doctor added successfully!");
                router.back();
            } else {
                throw new Error(responseData.message || "Failed to add doctor");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "An unexpected error occurred.");
            console.error("Add doctor error:", error);
        } finally {
            setLoading(false);
        }
    };


    const styles = StyleSheet.create({
        container: { flex: 1 },
        content: { padding: 20, gap: 10 },
        title: { textAlign: 'center', marginBottom: 20 },
        label: { fontSize: 16, marginBottom: 5, fontWeight: 'bold' },
        input: {
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 10,
            borderRadius: 5,
            marginBottom: 10,
            color: Colors[colorScheme].text,
        },
        placeholderText: {
            color: Colors[colorScheme].gray,
        },
        textArea: { height: 100, textAlignVertical: 'top' },
        button: { backgroundColor: 'rgb(249, 71, 208)', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
        buttonDisabled: { backgroundColor: '#A9A9A9' },
        buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    });

    return (
        <ScrollView style={styles.container}>
            <ThemedView style={styles.content}>
                <ThemedText type="title" style={styles.title}>Add New Doctor</ThemedText>

                <ThemedText style={styles.label}>Doctor Name*</ThemedText>
                <TextInput style={styles.input} value={doctorName} onChangeText={setDoctorName} placeholder="Dr. Full Name" placeholderTextColor={styles.placeholderText.color} />

                <ThemedText style={styles.label}>Clinic Name*</ThemedText>
                <TextInput style={styles.input} value={clinicName} onChangeText={setClinicName} placeholder="Clinic/Hospital Name" placeholderTextColor={styles.placeholderText.color} />

                <ThemedText style={styles.label}>Email*</ThemedText>
                <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="doctor@example.com" keyboardType="email-address" placeholderTextColor={styles.placeholderText.color} />

                <ThemedText style={styles.label}>Phone Number</ThemedText>
                <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Contact Number" keyboardType="phone-pad" placeholderTextColor={styles.placeholderText.color} />

                <ThemedText style={styles.label}>Commission (%)</ThemedText>
                <TextInput style={styles.input} value={commission} onChangeText={setCommission} placeholder="e.g., 10.5" keyboardType="numeric" placeholderTextColor={styles.placeholderText.color} />

                <ThemedText style={styles.label}>Address</ThemedText>
                <TextInput style={[styles.input, styles.textArea]} value={address} onChangeText={setAddress} multiline placeholder="Clinic Address" placeholderTextColor={styles.placeholderText.color} />

                <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleAddDoctor} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Add Doctor</ThemedText>}
                </TouchableOpacity>
            </ThemedView>
        </ScrollView>
    );
}


import React, { useState } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
// import RNPickerSelect from 'react-native-picker-select'; // If you want a picker for salutation/gender
import { useColorScheme } from '@/hooks/useColorScheme'; // Import useColorScheme
import { Colors } from '@/constants/Colors'; // Import Colors

const API_BASE_URL = "https://parmaexpo-app.vercel.app";

export default function AddPatientScreen() {
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
    const router = useRouter();
    // const [patientId, setPatientId] = useState(''); // ID will be auto-generated
    const [patientSalutation, setPatientSalutation] = useState('');
    const [patientsName, setPatientsName] = useState('');
    const [guardianName, setGuardianName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [gender, setGender] = useState(''); // Consider a picker: Male, Female, Other
    const [ageYears, setAgeYears] = useState('');
    const [ageMonths, setAgeMonths] = useState('');
    const [ageDays, setAgeDays] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');

    const [loading, setLoading] = useState(false);

    const handleAddPatient = async () => {
        if (!patientsName || !gender) { // patientId removed from validation
            Alert.alert("Validation Error", "Patient Name and Gender are required.");
            return;
        }
        setLoading(true);
        try {
            const patientData = {
                // patient_id: patientId, // Removed
                patient_salutation: patientSalutation,
                patients_name: patientsName,
                guardian_name: guardianName,
                phone_number: phoneNumber ? parseInt(phoneNumber) : null,
                gender: gender,
                age_years: ageYears ? parseInt(ageYears) : null,
                age_months: ageMonths ? parseInt(ageMonths) : null,
                age_days: ageDays ? parseInt(ageDays) : null,
                email: email,
                address: address,
                // Add other fields like city, state, zip_code if needed
            };

            const response = await fetch(`${API_BASE_URL}/api/patients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patientData),
            });
            const responseData = await response.json();

            if (response.ok && responseData.success) {
                Alert.alert("Success", "Patient added successfully!");
                router.back(); // Go back to the previous screen (e.g., AddReportScreen)
            } else {
                throw new Error(responseData.message || "Failed to add patient");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "An unexpected error occurred.");
            console.error("Add patient error:", error);
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
            borderColor: '#ccc', // Consider using theme colors
            padding: 10,
            borderRadius: 5,
            marginBottom: 10,
            color: Colors[colorScheme].text,
        },
        //placeholders
        placeholderText: {
            color: Colors[colorScheme].gray,
        },
        textArea: {
            height: 100,
            textAlignVertical: 'top',
        },
        ageRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        ageInput: {
            flex: 1,
            marginHorizontal: 2,
        },
        button: {
            backgroundColor: 'rgb(249, 71, 208)', // Consider using theme colors
            padding: 15,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 20,
        },
        buttonDisabled: {
            backgroundColor: '#A9A9A9',
        },
        buttonText: {
            color: 'white',
            fontWeight: 'bold',
            fontSize: 16,
        },
    // Add pickerSelectStyles if using RNPickerSelect
    });

    return (
        <ScrollView style={styles.container}>
            <ThemedView style={styles.content}>
                <ThemedText type="title" style={styles.title}>Add New Patient</ThemedText>

                <ThemedText style={styles.label}>Salutation</ThemedText>
                <TextInput style={styles.input} value={patientSalutation} onChangeText={setPatientSalutation} placeholder="Mr./Ms./Mrs." placeholderTextColor={styles.placeholderText.color} />

                <ThemedText style={styles.label}>Patient Name*</ThemedText>
                <TextInput style={styles.input} value={patientsName} onChangeText={setPatientsName} placeholder="Full Name" placeholderTextColor={styles.placeholderText.color} />

                <ThemedText style={styles.label}>Guardian Name</ThemedText>
                <TextInput style={styles.input} value={guardianName} onChangeText={setGuardianName} placeholder="Guardian's Name (if applicable)" placeholderTextColor={styles.placeholderText.color} />

                <ThemedText style={styles.label}>Phone Number</ThemedText>
                <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Contact Number" keyboardType="phone-pad" placeholderTextColor={styles.placeholderText.color} />

                <ThemedText style={styles.label}>Gender*</ThemedText>
                <TextInput style={styles.input} value={gender} onChangeText={setGender} placeholder="Male / Female / Other" placeholderTextColor={styles.placeholderText.color} />
                {/* Consider using RNPickerSelect for Gender */}

                <ThemedText style={styles.label}>Age</ThemedText>
                <View style={styles.ageRow}>
                    <TextInput style={[styles.input, styles.ageInput]} value={ageYears} onChangeText={setAgeYears} placeholder="Years" keyboardType="number-pad" placeholderTextColor={styles.placeholderText.color} />
                    <TextInput style={[styles.input, styles.ageInput]} value={ageMonths} onChangeText={setAgeMonths} placeholder="Months" keyboardType="number-pad" placeholderTextColor={styles.placeholderText.color} />
                    <TextInput style={[styles.input, styles.ageInput]} value={ageDays} onChangeText={setAgeDays} placeholder="Days" keyboardType="number-pad" placeholderTextColor={styles.placeholderText.color} />
                </View>

                <ThemedText style={styles.label}>Email</ThemedText>
                <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="patient@example.com" keyboardType="email-address" placeholderTextColor={styles.placeholderText.color} />

                <ThemedText style={styles.label}>Address</ThemedText>
                <TextInput style={[styles.input, styles.textArea]} value={address} onChangeText={setAddress} multiline placeholder="Full Address" placeholderTextColor={styles.placeholderText.color} />


                <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleAddPatient} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Add Patient</ThemedText>}
                </TouchableOpacity>
            </ThemedView>
        </ScrollView>
    );
}



// const pickerSelectStyles = StyleSheet.create({
//   inputIOS: { ...styles.input, marginBottom: 15 },
//   inputAndroid: { ...styles.input, marginBottom: 15 },
// });
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, TextInput } from 'react-native';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const API_BASE_URL = "https://parmaexpo-app.vercel.app";

interface Patient {
    patient_id: string;
    patient_salutation: string;
    patients_name: string;
    phone_number: number | null;
    gender: string;
    age_years: number | null;
    // Add other relevant fields for display if needed
}

export default function PatientsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const [patients, setPatients] = useState<Patient[]>([]);
    const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fabBackgroundColor = useThemeColor({ light: Colors.light.tint, dark: Colors.dark.tint }, 'tint');
    const cardBackgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#2C2C2E' }, 'background');
    const cardBorderColor = useThemeColor({ light: '#E0E0E0', dark: '#3A3A3C' }, 'background');

    const fetchPatients = async () => {
        try {
            setError(null);
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/patients`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data.success) {
                setPatients(data.patients);
                setFilteredPatients(data.patients);
            } else {
                throw new Error(data.message || 'Failed to fetch patients');
            }
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchPatients(); }, []);
    useFocusEffect(useCallback(() => { if (!loading) fetchPatients(); }, [loading]));

    useEffect(() => {
        if (searchTerm === '') {
            setFilteredPatients(patients);
        } else {
            setFilteredPatients(
                patients.filter(pat =>
                    pat.patients_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (pat.phone_number && pat.phone_number.toString().includes(searchTerm)) ||
                    (pat.patient_id && pat.patient_id.toLowerCase().includes(searchTerm.toLowerCase()))
                )
            );
        }
    }, [searchTerm, patients]);

    const onRefresh = useCallback(() => { setRefreshing(true); fetchPatients(); }, []);

    const handleDeletePatient = (patientId: string, patientName: string) => {
        Alert.alert("Delete Patient", `Are you sure you want to delete ${patientName}?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive",
                onPress: async () => {
                    try {
                        const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}`, { method: 'DELETE' });
                        const data = await response.json();
                        if (response.ok && data.success) {
                            Alert.alert("Success", "Patient deleted successfully.");
                            fetchPatients();
                        } else {
                            throw new Error(data.message || "Failed to delete patient.");
                        }
                    } catch (e: any) { Alert.alert("Error", e.message); }
                }
            }
        ]);
    };

    const renderPatientItem = ({ item }: { item: Patient }) => (
        <ThemedView style={[styles.card, { backgroundColor: cardBackgroundColor, borderColor: cardBorderColor }]}>
            <ThemedText type="subtitle">{item.patient_salutation} {item.patients_name}</ThemedText>
            <ThemedText>ID: {item.patient_id}</ThemedText>
            <ThemedText>Gender: {item.gender}</ThemedText>
            {item.age_years !== null && <ThemedText>Age: {item.age_years} Yrs</ThemedText>}
            {item.phone_number && <ThemedText>Phone: {item.phone_number}</ThemedText>}
            <View style={styles.actionsContainer}>
                <TouchableOpacity onPress={() => router.push(`/(screens)/update_patient/${item.patient_id}`)} style={styles.actionButton}>
                    <FontAwesome name="pencil" size={20} color={Colors[colorScheme].tint} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeletePatient(item.patient_id, item.patients_name)} style={styles.actionButton}>
                    <FontAwesome name="trash" size={20} color={Colors.light.danger} />
                </TouchableOpacity>
            </View>
        </ThemedView>
    );

    if (loading && patients.length === 0) return <ThemedView style={styles.centered}><ActivityIndicator size="large" /><ThemedText>Loading Patients...</ThemedText></ThemedView>;
    if (error) return <ThemedView style={styles.centered}><ThemedText style={styles.errorText}>Error: {error}</ThemedText><TouchableOpacity onPress={fetchPatients} style={styles.retryButton}><ThemedText style={{ color: '#fff' }}>Retry</ThemedText></TouchableOpacity></ThemedView>;

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: "Manage Patients" }} />
            <TextInput
                style={[styles.searchInput, { backgroundColor: cardBackgroundColor, color: Colors[colorScheme].text, borderColor: cardBorderColor }]}
                placeholder="Search by Name, Phone, or ID..."
                placeholderTextColor={Colors[colorScheme].gray}
                value={searchTerm}
                onChangeText={setSearchTerm}
            />
            <FlatList
                data={filteredPatients}
                renderItem={renderPatientItem}
                keyExtractor={(item) => item.patient_id}
                ListEmptyComponent={() => <ThemedView style={styles.centered}><ThemedText>No patients found.</ThemedText></ThemedView>}
                contentContainerStyle={styles.listContentContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
            <TouchableOpacity style={[styles.fab, { backgroundColor: fabBackgroundColor }]} onPress={() => router.push('/(screens)/add_patient')}>
                <FontAwesome name="plus" size={24} color="white" />
            </TouchableOpacity>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
    errorText: { color: 'red', textAlign: 'center', marginBottom: 10 },
    retryButton: { backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5, marginTop: 10 },
    searchInput: {
        height: 45,
        borderWidth: 1,
        paddingHorizontal: 15,
        margin: 10,
        borderRadius: 8,
        fontSize: 16,
    },
    listContentContainer: { paddingBottom: 80 },
    card: {
        padding: 16, marginVertical: 8, marginHorizontal: 12,
        borderRadius: 8, borderWidth: 1,
        elevation: 1, shadowOpacity: 0.1, shadowRadius: 3,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
        backgroundColor: 'transparent',
    },
    actionButton: {
        marginLeft: 15,
        padding: 5,
    },
    fab: {
        position: 'absolute', margin: 20, right: 10, bottom: 10,
        width: 60, height: 60, borderRadius: 30,
        justifyContent: 'center', alignItems: 'center',
        elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
    },
});
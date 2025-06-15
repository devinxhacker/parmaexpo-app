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

interface Doctor {
    doctor_id: string;
    doctor_name: string;
    clinic_name: string;
    email: string;
    phone_number: number | null;
    commission: number | null;
    address: string | null;
}

export default function DoctorsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fabBackgroundColor = useThemeColor({ light: Colors.light.tint, dark: Colors.dark.tint }, 'tint');
    const cardBackgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#2C2C2E' }, 'background');
    const cardBorderColor = useThemeColor({ light: '#E0E0E0', dark: '#3A3A3C' }, 'background');

    const fetchDoctors = async () => {
        try {
            setError(null);
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/doctors`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data.success) {
                setDoctors(data.doctors);
                setFilteredDoctors(data.doctors);
            } else {
                throw new Error(data.message || 'Failed to fetch doctors');
            }
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

    useFocusEffect(useCallback(() => { if (!loading) fetchDoctors(); }, [loading]));

    useEffect(() => {
        if (searchTerm === '') {
            setFilteredDoctors(doctors);
        } else {
            setFilteredDoctors(
                doctors.filter(doc =>
                    doc.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    doc.clinic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (doc.doctor_id && doc.doctor_id.toLowerCase().includes(searchTerm.toLowerCase()))
                )
            );
        }
    }, [searchTerm, doctors]);

    const onRefresh = useCallback(() => { setRefreshing(true); fetchDoctors(); }, []);

    const handleDeleteDoctor = (doctorId: string, doctorName: string) => {
        Alert.alert("Delete Doctor", `Are you sure you want to delete Dr. ${doctorName}?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive",
                onPress: async () => {
                    try {
                        const response = await fetch(`${API_BASE_URL}/api/doctors/${doctorId}`, { method: 'DELETE' });
                        const data = await response.json();
                        if (response.ok && data.success) {
                            Alert.alert("Success", "Doctor deleted successfully.");
                            fetchDoctors(); // Refresh list
                        } else {
                            throw new Error(data.message || "Failed to delete doctor.");
                        }
                    } catch (e: any) {
                        Alert.alert("Error", e.message);
                    }
                }
            }
        ]);
    };

    const renderDoctorItem = ({ item }: { item: Doctor }) => (
        <ThemedView style={[styles.card, { backgroundColor: cardBackgroundColor, borderColor: cardBorderColor }]}>
            <ThemedText type="subtitle">{item.doctor_name}</ThemedText>
            <ThemedText>ID: {item.doctor_id}</ThemedText>
            <ThemedText>Clinic: {item.clinic_name}</ThemedText>
            <ThemedText>Email: {item.email}</ThemedText>
            {item.phone_number && <ThemedText>Phone: {item.phone_number}</ThemedText>}
            {item.commission !== null && <ThemedText>Commission: {item.commission}%</ThemedText>}
            <View style={styles.actionsContainer}>
                <TouchableOpacity onPress={() => router.push(`/(screens)/update_doctor/${item.doctor_id}`)} style={styles.actionButton}>
                    <FontAwesome name="pencil" size={20} color={Colors[colorScheme].tint} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteDoctor(item.doctor_id, item.doctor_name)} style={styles.actionButton}>
                    <FontAwesome name="trash" size={20} color={Colors.light.danger} />
                </TouchableOpacity>
            </View>
        </ThemedView>
    );

    if (loading && doctors.length === 0) return <ThemedView style={styles.centered}><ActivityIndicator size="large" /><ThemedText>Loading Doctors...</ThemedText></ThemedView>;
    if (error) return <ThemedView style={styles.centered}><ThemedText style={styles.errorText}>Error: {error}</ThemedText><TouchableOpacity onPress={fetchDoctors} style={styles.retryButton}><ThemedText style={{ color: '#fff' }}>Retry</ThemedText></TouchableOpacity></ThemedView>;

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: "Manage Doctors" }} />
            <TextInput
                style={[styles.searchInput, { backgroundColor: cardBackgroundColor, color: Colors[colorScheme].text, borderColor: cardBorderColor }]}
                placeholder="Search by Name, Clinic, or ID..."
                placeholderTextColor={Colors[colorScheme].gray}
                value={searchTerm}
                onChangeText={setSearchTerm}
            />
            <FlatList
                data={filteredDoctors}
                renderItem={renderDoctorItem}
                keyExtractor={(item) => item.doctor_id}
                ListEmptyComponent={() => <ThemedView style={styles.centered}><ThemedText>No doctors found.</ThemedText></ThemedView>}
                contentContainerStyle={styles.listContentContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
            <TouchableOpacity style={[styles.fab, { backgroundColor: fabBackgroundColor }]} onPress={() => router.push('/(screens)/add_doctor')}>
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
    listContentContainer: { paddingBottom: 80 }, // Space for FAB
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

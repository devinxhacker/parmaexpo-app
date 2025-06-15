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

interface Test {
    test_id: number;
    test_name: string;
    test_rate: number | null;
    test_code: string | null;
    method: string | null;
    // category_name: string; // If you join with category table in backend
}

export default function TestsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const [tests, setTests] = useState<Test[]>([]);
    const [filteredTests, setFilteredTests] = useState<Test[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fabBackgroundColor = useThemeColor({ light: Colors.light.tint, dark: Colors.dark.tint }, 'tint');
    const cardBackgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#2C2C2E' }, 'background');
    const cardBorderColor = useThemeColor({ light: '#E0E0E0', dark: '#3A3A3C' }, 'background');

    const fetchTests = async () => {
        try {
            setError(null);
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/tests`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data.success) {
                setTests(data.tests);
                setFilteredTests(data.tests);
            } else {
                throw new Error(data.message || 'Failed to fetch tests');
            }
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchTests(); }, []);
    useFocusEffect(useCallback(() => { if (!loading) fetchTests(); }, [loading]));

    useEffect(() => {
        if (searchTerm === '') {
            setFilteredTests(tests);
        } else {
            setFilteredTests(
                tests.filter(test =>
                    test.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (test.test_code && test.test_code.toLowerCase().includes(searchTerm.toLowerCase()))
                )
            );
        }
    }, [searchTerm, tests]);

    const onRefresh = useCallback(() => { setRefreshing(true); fetchTests(); }, []);

    const handleDeleteTest = (testId: number, testName: string) => {
        Alert.alert("Delete Test", `Are you sure you want to delete "${testName}"?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive",
                onPress: async () => {
                    try {
                        const response = await fetch(`${API_BASE_URL}/api/tests/${testId}`, { method: 'DELETE' });
                        const data = await response.json();
                        if (response.ok && data.success) {
                            Alert.alert("Success", "Test deleted successfully.");
                            fetchTests();
                        } else {
                            throw new Error(data.message || "Failed to delete test.");
                        }
                    } catch (e: any) { Alert.alert("Error", e.message); }
                }
            }
        ]);
    };

    const renderTestItem = ({ item }: { item: Test }) => (
        <ThemedView style={[styles.card, { backgroundColor: cardBackgroundColor, borderColor: cardBorderColor }]}>
            <ThemedText type="subtitle">{item.test_name}</ThemedText>
            <ThemedText>ID: {item.test_id}</ThemedText>
            {item.test_code && <ThemedText>Code: {item.test_code}</ThemedText>}
            {item.test_rate !== null && <ThemedText>Rate: ₹{item.test_rate}</ThemedText>}
            {item.method && <ThemedText>Method: {item.method}</ThemedText>}
            <View style={styles.actionsContainer}>
                <TouchableOpacity onPress={() => router.push(`/(screens)/update_test/${item.test_id}`)} style={styles.actionButton}>
                    <FontAwesome name="pencil" size={20} color={Colors[colorScheme].tint} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteTest(item.test_id, item.test_name)} style={styles.actionButton}>
                    <FontAwesome name="trash" size={20} color={Colors.light.danger} />
                </TouchableOpacity>
            </View>
        </ThemedView>
    );

    if (loading && tests.length === 0) return <ThemedView style={styles.centered}><ActivityIndicator size="large" /><ThemedText>Loading Tests...</ThemedText></ThemedView>;
    if (error) return <ThemedView style={styles.centered}><ThemedText style={styles.errorText}>Error: {error}</ThemedText><TouchableOpacity onPress={fetchTests} style={styles.retryButton}><ThemedText style={{ color: '#fff' }}>Retry</ThemedText></TouchableOpacity></ThemedView>;

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: "Manage Tests" }} />
            <TextInput
                style={[styles.searchInput, { backgroundColor: cardBackgroundColor, color: Colors[colorScheme].text, borderColor: cardBorderColor }]}
                placeholder="Search by Name or Code..."
                placeholderTextColor={Colors[colorScheme].gray}
                value={searchTerm}
                onChangeText={setSearchTerm}
            />
            <FlatList
                data={filteredTests}
                renderItem={renderTestItem}
                keyExtractor={(item) => item.test_id.toString()}
                ListEmptyComponent={() => <ThemedView style={styles.centered}><ThemedText>No tests found.</ThemedText></ThemedView>}
                contentContainerStyle={styles.listContentContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
            <TouchableOpacity style={[styles.fab, { backgroundColor: fabBackgroundColor }]} onPress={() => router.push('/(screens)/add_test')}>
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
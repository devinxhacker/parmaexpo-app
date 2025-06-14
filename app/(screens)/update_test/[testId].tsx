import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import RNPickerSelect from 'react-native-picker-select';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_SERVER;

interface TestData {
    test_name: string;
    test_rate: string;
    report_heading?: string;
    test_code?: string;
    method?: string;
    comments?: string;
    category_id: number | undefined;
}
interface Category { label: string; value: number; }

export default function UpdateTestScreen() {
    const router = useRouter();
    const { testId } = useLocalSearchParams<{ testId: string }>(); // testId is string from params
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';

    const [testData, setTestData] = useState<Partial<TestData>>({ category_id: undefined });
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(true);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!testId) return;
            setFormLoading(true);
            try {
                const [categoriesRes, testsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/categories`),
                    fetch(`${API_BASE_URL}/api/tests`) // Fetch all tests to find the current one
                ]);

                const categoriesData = await categoriesRes.json();
                if (categoriesData.success) setCategories(categoriesData.categories);
                else console.warn("Failed to load categories for update screen");

                const allTestsData = await testsRes.json();
                if (allTestsData.success) {
                    const currentTest = allTestsData.tests.find((t: any) => t.test_id.toString() === testId);
                    if (currentTest) {
                        setTestData({
                            test_name: currentTest.test_name,
                            test_rate: currentTest.test_rate?.toString() || '',
                            report_heading: currentTest.report_heading || '',
                            test_code: currentTest.test_code || '',
                            method: currentTest.method || '',
                            comments: currentTest.comments || '',
                            category_id: currentTest.category_id,
                        });
                    } else {
                        Alert.alert("Error", "Test details not found.");
                        router.back();
                    }
                } else {
                    throw new Error(allTestsData.message || "Failed to fetch test details");
                }
            } catch (error: any) {
                Alert.alert("Error", error.message || "Could not load test data.");
                router.back();
            } finally {
                setFormLoading(false);
            }
        };
        fetchInitialData();
    }, [testId]);

    const handleUpdateTest = async () => {
        if (!testId || !testData.test_name || !testData.test_rate || testData.category_id === undefined) {
            Alert.alert("Validation Error", "Test Name, Rate, and Category are required.");
            return;
        }
        setLoading(true);
        try {
            const payload = {
                ...testData,
                test_rate: parseFloat(testData.test_rate),
            };
            const response = await fetch(`${API_BASE_URL}/api/tests/${testId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const responseData = await response.json();
            if (response.ok && responseData.success) {
                Alert.alert("Success", "Test updated successfully!");
                router.back();
            } else {
                throw new Error(responseData.message || "Failed to update test");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (name: keyof TestData, value: string | number | undefined) => {
        setTestData(prev => ({ ...prev, [name]: value }));
    };

    const styles = StyleSheet.create({ /* ... (copy styles from add_test.tsx and adjust) ... */
        container: { flex: 1 }, content: { padding: 20, gap: 10 }, title: { textAlign: 'center', marginBottom: 20 },
        label: { fontSize: 16, marginBottom: 5, fontWeight: 'bold' },
        input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginBottom: 10, color: Colors[colorScheme].text, },
        placeholderText: { color: Colors[colorScheme].gray, }, textArea: { height: 100, textAlignVertical: 'top' },
        button: { backgroundColor: Colors[colorScheme].tint, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
        buttonDisabled: { backgroundColor: '#A9A9A9' }, buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    });
    const pickerSelectStyles = StyleSheet.create({ inputIOS: { ...styles.input, marginBottom: 15, justifyContent: 'center' }, inputAndroid: { ...styles.input, marginBottom: 15, justifyContent: 'center' }, placeholder: { color: Colors[colorScheme].gray, }, });

    if (formLoading) return <ThemedView style={styles.container}><ActivityIndicator size="large" /></ThemedView>;

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen options={{ title: `Update Test: ${testData.test_name || testId}` }} />
            <ThemedView style={styles.content}>
                <ThemedText type="title" style={styles.title}>Update Test Details</ThemedText>
                <ThemedText style={styles.label}>Test Name*</ThemedText><TextInput style={styles.input} value={testData.test_name} onChangeText={v => handleChange('test_name', v)} placeholderTextColor={styles.placeholderText.color} />
                <ThemedText style={styles.label}>Test Rate (₹)*</ThemedText><TextInput style={styles.input} value={testData.test_rate} onChangeText={v => handleChange('test_rate', v)} keyboardType="numeric" placeholderTextColor={styles.placeholderText.color} />
                <ThemedText style={styles.label}>Category*</ThemedText>
                <RNPickerSelect onValueChange={(value) => handleChange('category_id', value)} items={categories} style={pickerSelectStyles} value={testData.category_id} placeholder={{ label: "Select a category...", value: undefined }} />
                <ThemedText style={styles.label}>Report Heading</ThemedText><TextInput style={styles.input} value={testData.report_heading} onChangeText={v => handleChange('report_heading', v)} placeholderTextColor={styles.placeholderText.color} />
                <ThemedText style={styles.label}>Test Code</ThemedText><TextInput style={styles.input} value={testData.test_code} onChangeText={v => handleChange('test_code', v)} placeholderTextColor={styles.placeholderText.color} />
                <ThemedText style={styles.label}>Method</ThemedText><TextInput style={[styles.input, styles.textArea]} value={testData.method} onChangeText={v => handleChange('method', v)} multiline placeholderTextColor={styles.placeholderText.color} />
                <ThemedText style={styles.label}>Default Comments</ThemedText><TextInput style={[styles.input, styles.textArea]} value={testData.comments} onChangeText={v => handleChange('comments', v)} multiline placeholderTextColor={styles.placeholderText.color} />
                <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleUpdateTest} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Update Test</ThemedText>}
                </TouchableOpacity>
            </ThemedView>
        </ScrollView>
    );
}
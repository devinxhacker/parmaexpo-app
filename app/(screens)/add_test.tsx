import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme'; // Import useColorScheme
import { Colors } from '@/constants/Colors'; // Import Colors
import { CustomPicker } from '@/components/CustomPicker';


const API_BASE_URL = "https://parmaexpo-app.vercel.app";

interface Category { label: string; value: number; }

export default function AddTestScreen() {
    const router = useRouter();
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';

    const [testName, setTestName] = useState('');
    const [testRate, setTestRate] = useState('');
    const [reportHeading, setReportHeading] = useState('');
    const [testCode, setTestCode] = useState('');
    const [method, setMethod] = useState('');
    const [comments, setComments] = useState('');
    const [categoryId, setCategoryId] = useState<number | undefined>();

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            setFormLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/categories`);
                const data = await response.json();
                if (data.success) {
                    // Assuming backend now sends categories in {label, value} format
                    setCategories(data.categories);
                } else {
                    Alert.alert("Error", data.message || "Failed to load categories.");
                    console.warn("Failed to load categories:", data.message);
                }

            } catch (error) {
                Alert.alert("Error", "Could not load categories.");
                console.error("Fetch categories error:", error);
            } finally {
                setFormLoading(false);
            }
        };
        fetchCategories();
    }, []);


    const styles = StyleSheet.create({
        container: { flex: 1 },
        content: { padding: 20, gap: 10 },
        centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
        title: { textAlign: 'center', marginBottom: 20 },
        label: { fontSize: 16, marginBottom: 5, fontWeight: 'bold' },
        input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginBottom: 10, color: Colors[colorScheme].text },
        placeholderText: { color: Colors[colorScheme].gray },
        textArea: { height: 100, textAlignVertical: 'top' },
        button: { backgroundColor: 'rgb(249, 71, 208)', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
        buttonDisabled: { backgroundColor: '#A9A9A9' },
        buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    });

    const handleAddTest = async () => {
        if (!testName || !testRate || !categoryId) {
            Alert.alert("Validation Error", "Test Name, Rate, and Category are required.");
            return;
        }
        setLoading(true);
        try {
            const testData = {
                test_name: testName,
                test_rate: parseFloat(testRate),
                report_heading: reportHeading,
                test_code: testCode,
                method: method,
                comments: comments,
                category_id: categoryId,
            };

            const response = await fetch(`${API_BASE_URL}/api/tests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData),
            });
            const responseData = await response.json();

            if (response.ok && responseData.success) {
                Alert.alert("Success", "Test added successfully!");
                router.back();
            } else {
                throw new Error(responseData.message || "Failed to add test");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "An unexpected error occurred.");
            console.error("Add test error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (formLoading) {
        return <ThemedView style={styles.centered}><ActivityIndicator size="large" /><ThemedText>Loading categories...</ThemedText></ThemedView>;
    }

    return (
        <ScrollView style={styles.container}>
            <ThemedView style={styles.content}>
                <ThemedText type="title" style={styles.title}>Add New Test</ThemedText>

                <ThemedText style={styles.label}>Test Name*</ThemedText>
                <TextInput style={styles.input} value={testName} onChangeText={setTestName} placeholder="e.g., Complete Blood Count" placeholderTextColor={styles.placeholderText.color} />

                <ThemedText style={styles.label}>Test Rate (₹)*</ThemedText>
                <TextInput style={styles.input} value={testRate} onChangeText={setTestRate} placeholder="e.g., 150.00" keyboardType="numeric" placeholderTextColor={styles.placeholderText.color} />

                <ThemedText style={styles.label}>Category*</ThemedText>
                <CustomPicker
                    onValueChange={(value) => setCategoryId(value)}
                    items={categories}
                    value={categoryId}
                    style={[styles.input, { marginBottom: 15 }]} // Apply input style, ensure text color is handled by CustomPicker or override here
                    placeholder={{ label: "Select a category...", value: null }}
                    modalTitle="Select Category"
                />

                <ThemedText style={styles.label}>Report Heading</ThemedText>
                <TextInput style={styles.input} value={reportHeading} onChangeText={setReportHeading} placeholder="e.g., CBC Report" placeholderTextColor={styles.placeholderText.color} />

                <ThemedText style={styles.label}>Test Code</ThemedText>
                <TextInput style={styles.input} value={testCode} onChangeText={setTestCode} placeholder="e.g., CBC" placeholderTextColor={styles.placeholderText.color} />

                <ThemedText style={styles.label}>Method</ThemedText>
                <TextInput style={[styles.input, styles.textArea]} value={method} onChangeText={setMethod} multiline placeholder="Methodology details" placeholderTextColor={styles.placeholderText.color} />

                <ThemedText style={styles.label}>Default Comments</ThemedText>
                <TextInput style={[styles.input, styles.textArea]} value={comments} onChangeText={setComments} multiline placeholder="Default comments for this test" placeholderTextColor={styles.placeholderText.color} />

                <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleAddTest} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Add Test</ThemedText>}
                </TouchableOpacity>
            </ThemedView>
        </ScrollView>
    );


    

}

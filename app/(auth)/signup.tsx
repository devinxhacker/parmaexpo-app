import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Button, StyleSheet, TextInput, View, Alert, Platform } from 'react-native';

export default function SignUpScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { signUp } = useAuth();

    const handleSignUp = async () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }
        try {
            // In a real app, call your backend API to register the user
            // and get a token.
            await signUp('mock-new-user-token');
            // Navigation to '(app)' is handled by RootLayout's useEffect
        } catch (error) {
            Alert.alert('Sign Up Failed', 'An error occurred during sign up.');
            console.error('Sign up error:', error);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title">Create Account</ThemedText>
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#888"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#888"
            />
            <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholderTextColor="#888"
            />
            <Button title="Sign Up" onPress={handleSignUp} />
            <View style={styles.linkContainer}>
                <ThemedText>Already have an account? </ThemedText>
                <Link href="/(auth)/login" style={styles.link}>
                    <ThemedText type="link">Login</ThemedText>
                </Link>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
    input: { width: '100%', marginVertical: 10, padding: 15, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, backgroundColor: Platform.OS === 'ios' ? '#f0f0f0' : 'white' },
    linkContainer: { flexDirection: 'row', marginTop: 20, alignItems: 'center' },
    link: { marginLeft: 5 },
});
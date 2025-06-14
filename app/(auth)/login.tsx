import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Button, StyleSheet, TextInput, View, Alert, Platform } from 'react-native';

const backendUrl = process.env.EXPO_PUBLIC_BACKEND_SERVER;

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { signIn } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email (username) and password.');
            return;
        }

        if (!backendUrl) {
            Alert.alert('Configuration Error', 'Backend server URL is not configured.');
            console.error('EXPO_PUBLIC_BACKEND_SERVER is not set in .env');
            return;
        }

        try {
            const response = await fetch(`${backendUrl}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: email, // 'email' state variable is used as username
                    password: password,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success && data.user) {
                // Login successful, use user_id as a mock token
                // In a real app, your backend should return a JWT.
                await signIn(data.user.user_id.toString());
                // Navigation to '(app)' will be handled by RootLayout's useEffect
            } else {
                Alert.alert('Login Failed', data.message || 'Invalid username or password.');
            }
        } catch (error) {
            console.error('Login error:', error);
            Alert.alert('Login Failed', 'An error occurred during login. Please check your network connection or server status.');
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title">Login to Parma</ThemedText>
            <TextInput
                style={styles.input}
                placeholder="Email (as Username)"
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
            <View style={styles.button}>
                <Button title="Login" onPress={handleLogin} color="#D50099" />
            </View>
            {/* <View style={styles.linkContainer}>
                <ThemedText>Don't have an account? </ThemedText>
                <Link href="/(auth)/signup" style={styles.link}>
                    <ThemedText type="link">Sign Up</ThemedText>
                </Link>
            </View> */}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
    input: {
        width: '100%', marginVertical: 10, padding: 15, borderWidth: 1,
        borderColor: '#ccc', borderRadius: 5,
        // backgroundColor: Platform.OS === 'ios' ? '#f0f0f0' : 'white', // Basic styling
    },
    linkContainer: { flexDirection: 'row', marginTop: 20, alignItems: 'center' },
    link: { marginLeft: 5 },
    button: {
        backgroundColor: '#D50099',
        padding: 10,
        borderRadius: 5,
        marginTop: 20,
        width: '70%',
    
    },
});
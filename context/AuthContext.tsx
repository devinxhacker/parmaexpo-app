import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';


const TOKEN_KEY = 'user-auth-token';

interface AuthContextType {
    token: string | null;
    isLoading: boolean;
    signIn: (newToken: string) => Promise<void>;
    signOut: () => Promise<void>;
    signUp: (newToken: string) => Promise<void>; // Simplified: same as signIn for this example
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadToken() {
            try {
                let storedToken: string | null = null;
                if (Platform.OS === 'web') {
                    storedToken = localStorage.getItem(TOKEN_KEY);
                } else {
                    storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
                }

                if (storedToken) {
                    setToken(storedToken);
                }
            } catch (e) {
                console.error('Failed to load token:', e);
            } finally {
                setIsLoading(false);
            }
        }
        loadToken();
    }, []);

    const signIn = async (newToken: string) => {
        setIsLoading(true);
        try {
            if (Platform.OS === 'web') {
                localStorage.setItem(TOKEN_KEY, newToken);
            } else {
                await SecureStore.setItemAsync(TOKEN_KEY, newToken);
            }
            setToken(newToken);
        } catch (e) {
            console.error('Failed to save token:', e);
            // Optionally, you could set an error state here to show in the UI
        } finally {
            setIsLoading(false);
        }
    };

    const signUp = async (newToken: string) => {
        await signIn(newToken); // For this example, signUp is the same as signIn
    };

    const signOut = async () => {
        setIsLoading(true);
        try {
            if (Platform.OS === 'web') {
                localStorage.removeItem(TOKEN_KEY);
            } else {
                await SecureStore.deleteItemAsync(TOKEN_KEY);
            }
            setToken(null);
        } catch (e) {
            console.error('Failed to delete token:', e);
            // Optionally, you could set an error state here
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ token, isLoading, signIn, signOut, signUp }}>
            {children}
        </AuthContext.Provider>
    );
}
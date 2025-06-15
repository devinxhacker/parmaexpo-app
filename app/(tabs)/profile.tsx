import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors'; // For button color
import { useColorScheme } from '@/hooks/useColorScheme'; // For button color
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, Alert, View, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { IconSymbol } from '@/components/ui/IconSymbol';

const backendUrl = "https://parmaexpo-app.vercel.app";

interface UserDetails {
    user_id: number;
    username: string;
    full_name: string;
    role: string;
    contact_number: string;
}


export default function ProfileScreen() {
    const { token, signOut } = useAuth(); // token is the user_id
    const colorScheme = useColorScheme() ?? 'light';
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchUserDetails = async () => {
            if (token && backendUrl) {
                setIsLoading(true);
                try {
                    const response = await fetch(`${backendUrl}/api/users/${token}`); // token is user_id
                    const data = await response.json();
                    if (response.ok && data.success && data.user) {
                        setUserDetails(data.user);
                    } else {
                        Alert.alert('Error', data.message || 'Failed to fetch user details.');
                        console.error("Fetch user details error:", data.message);
                    }
                } catch (error) {
                    Alert.alert('Error', 'An error occurred while fetching user details.');
                    console.error("Fetch user details network/server error:", error);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchUserDetails();
    }, [token]);

    const handleSignOut = async () => {
        try {
            await signOut();
            // Navigation to (auth)/login is handled by RootLayout's useEffect
        } catch (error) {
            Alert.alert('Error', 'Failed to sign out.');
            console.error('Sign out error:', error);
        }
    };

    if (isLoading) {
        return (
            <ThemedView style={styles.container}>
                <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
            </ThemedView>
        );
    }

    return (
        
        <ParallaxScrollView
            headerBackgroundColor={{ light: 'rgb(255, 180, 207)', dark: 'rgb(71, 0, 31)' }}
            headerImage={
                <IconSymbol
                    size={310}
                    color="#D50099"
                    name="person.fill"
                    style={styles.headerImage}
                />
            }>
            <ThemedView style={styles.titleContainer}>
                <ThemedText type="title">Profile</ThemedText>
            </ThemedView>

            <ThemedView style={styles.container}>
                 {userDetails ? (
                    <View style={styles.detailsContainer}>
                        <ThemedText style={styles.detailItem}>Welcome, <ThemedText type="defaultSemiBold">{userDetails.full_name}</ThemedText>!</ThemedText>
                        <ThemedText style={styles.detailItem}>Username: {userDetails.username}</ThemedText>
                        <ThemedText style={styles.detailItem}>Role: {userDetails.role}</ThemedText>
                        <ThemedText style={styles.detailItem}>Contact: {userDetails.contact_number}</ThemedText>
                    </View>
                ) : (
                    <ThemedText style={styles.userInfo}>Could not load user details.</ThemedText>
                )}
                <Button title="Sign Out" onPress={handleSignOut} color={Colors[colorScheme].tint} />
            </ThemedView>

            {/* <ThemedText>This app includes example code to help you get started.</ThemedText> */}
            {/* <Collapsible title="File-based routing">
                <ThemedText>
                    This app has two screens:{' '}
                    <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> and{' '}
                    <ThemedText type="defaultSemiBold">app/(tabs)/explore.tsx</ThemedText>
                </ThemedText>
                <ThemedText>
                    The layout file in <ThemedText type="defaultSemiBold">app/(tabs)/_layout.tsx</ThemedText>{' '}
                    sets up the tab navigator.
                </ThemedText>
                <ExternalLink href="https://docs.expo.dev/router/introduction">
                    <ThemedText type="link">Learn more</ThemedText>
                </ExternalLink>
            </Collapsible>
            <Collapsible title="Android, iOS, and web support">
                <ThemedText>
                    You can open this project on Android, iOS, and the web. To open the web version, press{' '}
                    <ThemedText type="defaultSemiBold">w</ThemedText> in the terminal running this project.
                </ThemedText>
            </Collapsible>
            <Collapsible title="Images">
                <ThemedText>
                    For static images, you can use the <ThemedText type="defaultSemiBold">@2x</ThemedText> and{' '}
                    <ThemedText type="defaultSemiBold">@3x</ThemedText> suffixes to provide files for
                    different screen densities
                </ThemedText>
                <Image source={require('@/assets/images/react-logo.png')} style={{ alignSelf: 'center' }} />
                <ExternalLink href="https://reactnative.dev/docs/images">
                    <ThemedText type="link">Learn more</ThemedText>
                </ExternalLink>
            </Collapsible>
            <Collapsible title="Custom fonts">
                <ThemedText>
                    Open <ThemedText type="defaultSemiBold">app/_layout.tsx</ThemedText> to see how to load{' '}
                    <ThemedText style={{ fontFamily: 'SpaceMono' }}>
                        custom fonts such as this one.
                    </ThemedText>
                </ThemedText>
                <ExternalLink href="https://docs.expo.dev/versions/latest/sdk/font">
                    <ThemedText type="link">Learn more</ThemedText>
                </ExternalLink>
            </Collapsible>
            <Collapsible title="Light and dark mode components">
                <ThemedText>
                    This template has light and dark mode support. The{' '}
                    <ThemedText type="defaultSemiBold">useColorScheme()</ThemedText> hook lets you inspect
                    what the user&apos;s current color scheme is, and so you can adjust UI colors accordingly.
                </ThemedText>
                <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
                    <ThemedText type="link">Learn more</ThemedText>
                </ExternalLink>
            </Collapsible>
            <Collapsible title="Animations">
                <ThemedText>
                    This template includes an example of an animated component. The{' '}
                    <ThemedText type="defaultSemiBold">components/HelloWave.tsx</ThemedText> component uses
                    the powerful <ThemedText type="defaultSemiBold">react-native-reanimated</ThemedText>{' '}
                    library to create a waving hand animation.
                </ThemedText>
                {Platform.select({
                    ios: (
                        <ThemedText>
                            The <ThemedText type="defaultSemiBold">components/ParallaxScrollView.tsx</ThemedText>{' '}
                            component provides a parallax effect for the header image.
                        </ThemedText>
                    ),
                })}
            </Collapsible> */}
        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
    title: { marginBottom: 20 },
    detailsContainer: {
        alignItems: 'flex-start',
        marginBottom: 30,
        padding: 15,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        backgroundColor: 'rgba(164, 113, 170, 0.17)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        width: '100%',
    },
    headerImage: {
        bottom: -90,
        left: -35,
        position: 'absolute',
        
        
    },
    titleContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    detailItem: { fontSize: 16, marginBottom: 8 },
    userInfo: { fontSize: 18, marginBottom: 30, textAlign: 'center' },
});
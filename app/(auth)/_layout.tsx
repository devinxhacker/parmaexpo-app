import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

export default function TabLayout() {
    const colorScheme = useColorScheme();
    
    return (
        <Stack screenOptions={{
            headerShown: false
        }}>
            <Stack.Screen name="login" options={{ title: 'Login' }} />
            <Stack.Screen name="signup" options={{ title: 'Sign Up' }} />
        </Stack>
    )
}
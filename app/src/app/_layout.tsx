import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { useColorScheme } from '@/hooks/use-color-scheme';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const colorScheme = useColorScheme();

    useEffect(() => {
        SplashScreen.hideAsync();
    }, []);

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            {/* Esconde o cabeçalho automático, na página de login, para usar um cabeçalho próprio. */}
            <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
    );
}
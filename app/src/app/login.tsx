import { useState } from 'react';
import { Link, router } from 'expo-router';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BeeIcon from '../../assets/images/bee.svg';
import HiddenIcon from '../../assets/images/hidden.svg';
import VisibleIcon from '../../assets/images/visible.svg';

interface LoginResponse {
    user: {
        id: number;
        email: string;
    };
}

function isLoginResponse(value: unknown): value is LoginResponse {
    if (typeof value !== 'object' || value === null || !('user' in value)) {
        return false;
    }

    const user = value.user;
    return typeof user === 'object'
        && user !== null
        && 'id' in user
        && typeof user.id === 'number'
        && 'email' in user
        && typeof user.email === 'string';
}

function getApiError(value: unknown): string | null {
    if (typeof value !== 'object' || value === null || !('error' in value)) {
        return null;
    }

    return typeof value.error === 'string' ? value.error : null;
}

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    async function handleLogin() {
        const normalizedEmail = email.trim();
        if (!normalizedEmail.includes('@') || password.length < 6) {
            setError('Email inválido ou password com menos de 6 caracteres.');
            return;
        }

        const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
        if (!apiUrl) {
            console.log('O URL da API não está configurada.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            let response: Response;
            try {
                response = await fetch(`${apiUrl}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: normalizedEmail, password }),
                });
            } catch {
                console.log('Não foi possível contactar o servidor. Verifica a ligação e tenta novamente.');
                return;
            }

            const responseText = await response.text();
            let responseBody: unknown = null;
            if (responseText) {
                try {
                    responseBody = JSON.parse(responseText) as unknown;
                } catch {
                    throw new Error('O servidor devolveu uma resposta inválida.');
                }
            }

            if (!response.ok) {
                setError(response.status === 401
                    ? 'Email ou palavra-passe incorretos.'
                    : getApiError(responseBody) ?? 'Não foi possível iniciar sessão. Tenta novamente.');
                return;
            }

            if (!isLoginResponse(responseBody)) {
                throw new Error('A resposta de login do servidor é inválida.');
            }

            router.replace('/tabs');
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Não foi possível entrar. Tenta novamente.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-[#faf9f6] px-4">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="mx-auto flex-1 w-full max-w-[430px] justify-center">
                <View className="mb-12 flex-row items-center px-1">
                    <BeeIcon width={48} height={48} style={{ marginRight: 12 }} />
                    <Text className="text-[28px] font-bold text-[#050505]">Beetector</Text>
                </View>

                <Text className="mb-4 text-[28px] font-bold text-[#050505]">Login</Text>

                <View className="rounded-2xl border border-[#dedede] bg-white p-5 pb-6">
                    <Text className="mb-2 mt-2 text-[15px] font-semibold text-[#111]">Email</Text>
                    <TextInput
                        className="mb-3 h-[52px] rounded-[10px] border border-[#dedede] px-3.5 text-[15px] text-[#171717]"
                        placeholder="Escreva o seu email..."
                        placeholderTextColor="#b2b2b2"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        autoComplete="email"
                        keyboardType="email-address"
                    />

                    <Text className="mb-2 mt-2 text-[15px] font-semibold text-[#111]">Palavra-passe</Text>
                    <View className="mb-4 h-[52px] flex-row items-center rounded-[10px] border border-[#dedede] pr-3.5">
                        <TextInput
                            className="h-full flex-1 px-3.5 text-[15px] text-[#171717]"
                            placeholder="Escreva a sua palavra-passe..."
                            placeholderTextColor="#b2b2b2"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            onSubmitEditing={handleLogin}
                        />
                        <Pressable
                            accessibilityLabel={showPassword ? 'Esconder palavra-passe' : 'Mostrar palavra-passe'}
                            onPress={() => setShowPassword((visible) => !visible)}
                            hitSlop={8}>
                            {showPassword ? <VisibleIcon width={22} height={22} /> : <HiddenIcon width={22} height={22} />}
                        </Pressable>
                    </View>

                    <View className="mb-7 flex-row items-center justify-between">
                        <Pressable
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: rememberMe }}
                            onPress={() => setRememberMe((checked) => !checked)}
                            className="flex-row items-center">
                            <View className={`mr-2 h-5 w-5 rounded border ${rememberMe ? 'items-center justify-center border-[#f99d08] bg-[#f99d08]' : 'border-[#d9d9d9]'}`}>
                                {rememberMe && <Text className="text-sm font-bold leading-4 text-white">✓</Text>}
                            </View>
                            <Text className="text-xs text-[#555]">Lembrar-me</Text>
                        </Pressable>
                        <Pressable onPress={() => alert('Recuperar password')}>
                            <Text className="text-xs text-[#806c0b] underline">Esqueceste-te da palavra-passe?</Text>
                        </Pressable>
                    </View>

                    {error !== '' && <Text className="mb-2.5 text-xs text-[#c43d2f]">{error}</Text>}

                    <Pressable
                        onPress={handleLogin}
                        disabled={loading}
                        className="mb-3.5 h-[52px] items-center justify-center rounded-xl bg-[#f99d08] active:opacity-70">
                        {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-base font-bold text-white">Entrar</Text>}
                    </Pressable>

                    <Pressable
                        onPress={() => alert('Criar conta')}
                        className="h-[52px] items-center justify-center rounded-xl border border-[#aaa] active:opacity-70">
                        <Text className="text-base font-semibold text-[#806c0b]">Criar conta</Text>
                    </Pressable>

                    <Link href="/tabs" asChild>
                        <Pressable className="mt-3 h-[52px] items-center justify-center rounded-xl border border-[#dedede] active:opacity-70">
                            <Text className="text-sm font-medium text-[#555]">Ir para a página inicial (teste)</Text>
                        </Pressable>
                    </Link>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
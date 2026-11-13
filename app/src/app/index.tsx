import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!email.includes('@') || password.length < 6) {
      setError('Email inválido ou password com menos de 6 caracteres.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // Base de dados (ainda não implementado)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert('Login com sucesso!');
    } catch {
      setError('Não foi possível entrar. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}>
          <View style={styles.brand}>
            <Image source={require('../../assets/images/bee.png')} style={styles.logo} />
            <Text style={styles.brandName}>Beetector</Text>
          </View>

          <Text style={styles.title}>Login</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Escreva o seu email..."
              placeholderTextColor="#b2b2b2"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
            />

            <Text style={styles.label}>Palavra-passe</Text>
            <View style={styles.passwordInput}>
              <TextInput
                style={styles.passwordTextInput}
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
                <Image
                  source={
                    showPassword
                      ? require('../../assets/images/visible.png')
                      : require('../../assets/images/hidden.png')
                  }
                  style={styles.passwordIcon}
                />
              </Pressable>
            </View>

            <View style={styles.options}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: rememberMe }}
                onPress={() => setRememberMe((checked) => !checked)}
                style={styles.remember}>
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.optionText}>Lembrar-me</Text>
              </Pressable>
              <Pressable onPress={() => alert('Recuperar password')}>
                <Text style={styles.forgot}>Esqueceste-te da palavra-passe?</Text>
              </Pressable>
            </View>

            {error !== '' && <Text style={styles.error}>{error}</Text>}

            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => alert('Criar conta')}
              style={({ pressed }) => [styles.createButton, pressed && styles.buttonPressed]}>
              <Text style={styles.createButtonText}>Criar conta</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf9f6',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 15,
  },
  keyboard: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 430,
    width: '100%',
    alignSelf: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 52,
    paddingHorizontal: 4,
  },
  logo: {
    width: 48,
    height: 48,
    marginRight: 10,
  },
  brandName: {
    color: '#050505',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -1,
  },
  title: {
    color: '#050505',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 17,
  },
  form: {
    backgroundColor: '#fff',
    borderColor: '#dedede',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 24,
  },
  label: {
    color: '#111',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    color: '#171717',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#dedede',
    borderRadius: 10,
    height: 52,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  passwordInput: {
    alignItems: 'center',
    borderColor: '#dedede',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    height: 52,
    marginBottom: 16,
    paddingRight: 14,
  },
  passwordTextInput: {
    color: '#171717',
    flex: 1,
    fontSize: 15,
    height: '100%',
    paddingHorizontal: 14,
  },
  passwordIcon: {
    height: 22,
    width: 22,
  },
  options: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  remember: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  checkbox: {
    borderColor: '#d9d9d9',
    borderRadius: 4,
    borderWidth: 1,
    height: 20,
    marginRight: 8,
    width: 20,
  },
  checkboxChecked: {
    alignItems: 'center',
    backgroundColor: '#f99d08',
    borderColor: '#f99d08',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  optionText: {
    color: '#555',
    fontSize: 12,
  },
  forgot: {
    color: '#806c0b',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  error: {
    color: '#c43d2f',
    fontSize: 12,
    marginBottom: 10,
  },
  button: {
  alignItems: 'center',
  backgroundColor: '#f99d08',
  borderRadius: 12,
  height: 52,           // era 29
  justifyContent: 'center',
  marginBottom: 14,
},
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  createButton: {
    alignItems: 'center',
    borderColor: '#aaa',
    borderRadius: 12,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#806c0b',
    fontSize: 16,
    fontWeight: '600',
  },
});

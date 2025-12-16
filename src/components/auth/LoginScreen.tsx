import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { THEME } from '../../styles/theme';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
  onNavigateToGame: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateToRegister,
  onNavigateToGame,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { signIn, isLoading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    setError(null);
    const result = await signIn(email, password);
    
    if (result.success) {
      onNavigateToGame();
    } else {
      setError(result.error || 'Ошибка входа');
    }
  };

  const handleGuestMode = () => {
    onNavigateToGame();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Добро пожаловать в Tetris!</Text>
          <Text style={styles.subtitle}>Войдите в свой аккаунт</Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Пароль"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity 
              style={[styles.button, styles.loginButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Вход...' : 'Войти'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.guestButton]}
              onPress={handleGuestMode}
            >
              <Text style={[styles.buttonText, styles.guestButtonText]}>
                Играть как гость
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkButton}
              onPress={onNavigateToRegister}
            >
              <Text style={styles.linkText}>
                Нет аккаунта? Зарегистрироваться
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: THEME.spacing.xl,
    paddingVertical: THEME.spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: THEME.colors.text,
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
  },
  subtitle: {
    fontSize: 16,
    color: THEME.colors.textLight,
    textAlign: 'center',
    marginBottom: THEME.spacing.xl,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    fontSize: 16,
    color: THEME.colors.text,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.2)',
  },
  button: {
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  loginButton: {
    backgroundColor: THEME.colors.success,
  },
  guestButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: THEME.colors.success,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  guestButtonText: {
    color: THEME.colors.success,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: THEME.spacing.lg,
  },
  linkText: {
    color: THEME.colors.success,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  errorContainer: {
    backgroundColor: THEME.colors.error,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  errorText: {
    color: THEME.colors.text,
    textAlign: 'center',
    fontSize: 14,
  },
});
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
import VideoBackground from '../VideoBackground';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
  onNavigateToGame: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onNavigateToLogin,
  onNavigateToGame,
}) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { signUp, isLoading } = useAuth();

  const handleRegister = async () => {
    if (!email || !username || !password || !confirmPassword) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    if (username.length < 3) {
      setError('Имя пользователя должно содержать минимум 3 символа');
      return;
    }

    setError(null);
    const result = await signUp(email, password, username);
    
    if (result.success) {
      Alert.alert(
        'Регистрация успешна!', 
        'Проверьте почту для подтверждения, затем войдите в аккаунт',
        [{ text: 'OK', onPress: onNavigateToLogin }]
      );
    } else {
      setError(result.error || 'Ошибка регистрации');
    }
  };

  const handleGuestMode = () => {
    onNavigateToGame();
  };

  return (
    <VideoBackground>
      <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Создать аккаунт</Text>
          <Text style={styles.subtitle}>Присоединяйтесь к Tetris сообществу!</Text>

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
              placeholder="Имя пользователя"
              placeholderTextColor="#888"
              value={username}
              onChangeText={setUsername}
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
            
            <TextInput
              style={styles.input}
              placeholder="Подтвердите пароль"
              placeholderTextColor="#888"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity 
              style={[styles.button, styles.registerButton, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
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
              onPress={onNavigateToLogin}
            >
              <Text style={styles.linkText}>
                Уже есть аккаунт? Войти
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </VideoBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  registerButton: {
    backgroundColor: THEME.colors.info,
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
    color: THEME.colors.info,
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
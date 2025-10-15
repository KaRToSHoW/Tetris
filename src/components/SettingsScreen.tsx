import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Switch, ScrollView, Alert, ActivityIndicator } from 'react-native';
import Icon, { ICON_COLORS } from './Icon';
import { useAuth } from '../contexts/AuthContext';
import { getGameSettings, saveGameSettings, Game_Settings } from '../lib/supabase';
import type { GameSettings, Screen } from '../types/app';

interface SettingsScreenProps {
  settings: GameSettings;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onNavigate: (screen: Screen) => void;
}

export default function SettingsScreen({ settings, onUpdateSettings, onNavigate }: SettingsScreenProps) {
  const { session, user, refreshUserSession } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (session?.user) {
      loadUserSettings();
    }
  }, [session]);

  const loadUserSettings = async () => {
    if (!session?.user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await getGameSettings(session.user.id);
      if (error) {
        console.log('No saved settings found, using defaults');
        return;
      }
      
      if (data) {
        // Convert database settings to app settings format
        const gameSettings: Partial<GameSettings> = {
          difficulty: data.difficulty as GameSettings['difficulty'],
          showGrid: data.show_grid,
          showGhost: true, // This field doesn't exist in database, using default
          soundEnabled: data.sound_enabled,
          musicEnabled: true, // This field doesn't exist in database, using default
          controlMode: data.control_mode as GameSettings['controlMode'],
        };
        
        onUpdateSettings(gameSettings);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserSettings = async (newSettings: Partial<GameSettings>, isRetry: boolean = false) => {
    if (!session?.user) {
      // If user is not logged in, just update local settings
      onUpdateSettings(newSettings);
      return;
    }

    setIsSaving(true);
    try {
      // Prepare settings for database
      const dbSettings: Omit<Game_Settings, 'id' | 'created_at' | 'updated_at'> = {
        user_id: session.user.id,
        player_name: user?.display_name || user?.username || session.user.email || 'Player',
        control_mode: newSettings.controlMode || settings.controlMode,
        show_grid: newSettings.showGrid !== undefined ? newSettings.showGrid : settings.showGrid,
        sound_enabled: newSettings.soundEnabled !== undefined ? newSettings.soundEnabled : settings.soundEnabled,
        difficulty: newSettings.difficulty || settings.difficulty,
      };

      const { error } = await saveGameSettings(dbSettings);
      if (error) {
        // Check if it's an auth error
        if (error.includes('JWT') || error.includes('expired') || error.includes('401')) {
          if (!isRetry && retryCount < 2) {
            setRetryCount(prev => prev + 1);
            console.log('Auth error detected, refreshing session and retrying...');
            await refreshUserSession();
            // Wait a bit and retry
            setTimeout(() => saveUserSettings(newSettings, true), 1000);
            return;
          } else {
            Alert.alert(
              'Ошибка аутентификации',
              'Сессия истекла. Пожалуйста, войдите в систему заново.',
              [{ text: 'OK', onPress: () => onNavigate('menu') }]
            );
            return;
          }
        }
        
        Alert.alert('Ошибка', 'Не удалось сохранить настройки: ' + error);
        return;
      }

      // Success - reset retry count and update local settings
      setRetryCount(0);
      onUpdateSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить настройки');
    } finally {
      setIsSaving(false);
    }
  };

  const difficultyOptions = [
    { key: 'easy', label: 'Легкий', description: 'Медленное падение' },
    { key: 'normal', label: 'Обычный', description: 'Стандартная скорость' },
    { key: 'hard', label: 'Сложный', description: 'Быстрое падение' },
  ] as const;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => onNavigate('menu')}>
          <Icon name="back" size={16} color={ICON_COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.backButtonText}>Назад</Text>
        </Pressable>
        <Text style={styles.title}>Настройки</Text>
        {isSaving && (
          <ActivityIndicator size="small" color={ICON_COLORS.primary} />
        )}
      </View>

      {session?.user && (
        <View style={styles.userInfo}>
          <Text style={styles.userInfoText}>
            Настройки сохраняются в вашем профиле
          </Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ICON_COLORS.primary} />
          <Text style={styles.loadingText}>Загрузка настроек...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Difficulty Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Сложность</Text>
            {difficultyOptions.map((option) => (
              <Pressable
                key={option.key}
                style={[
                  styles.difficultyOption,
                  settings.difficulty === option.key && styles.difficultyOptionSelected
                ]}
                onPress={() => saveUserSettings({ difficulty: option.key })}
                disabled={isSaving}
              >
                <View style={styles.difficultyContent}>
                  <Text style={[
                    styles.difficultyLabel,
                    settings.difficulty === option.key && styles.difficultyLabelSelected
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.difficultyDescription}>{option.description}</Text>
                </View>
                {settings.difficulty === option.key && (
                  <Icon name="check" size={18} color={ICON_COLORS.primary} />
                )}
              </Pressable>
            ))}
          </View>

          {/* Display Options Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Отображение</Text>
            
            <View style={styles.toggleOption}>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>Показать сетку</Text>
                <Text style={styles.toggleDescription}>Линии сетки на игровом поле</Text>
              </View>
              <Switch
                value={settings.showGrid}
                onValueChange={(value: boolean) => saveUserSettings({ showGrid: value })}
                trackColor={{ false: '#333', true: '#00ffff50' }}
                thumbColor={settings.showGrid ? '#00ffff' : '#666'}
                disabled={isSaving}
              />
            </View>

            <View style={styles.toggleOption}>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>Показать призрак</Text>
                <Text style={styles.toggleDescription}>Предварительный показ падения фигуры</Text>
              </View>
              <Switch
                value={settings.showGhost}
                onValueChange={(value: boolean) => saveUserSettings({ showGhost: value })}
                trackColor={{ false: '#333', true: '#00ffff50' }}
                thumbColor={settings.showGhost ? '#00ffff' : '#666'}
                disabled={isSaving}
              />
            </View>
          </View>

          {/* Controls Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Управление</Text>
            
            <View style={styles.toggleOption}>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>Режим управления</Text>
                <Text style={styles.toggleDescription}>
                  {settings.controlMode === 'buttons' ? 'Кнопки' : 'Свайпы и касания'}
                </Text>
              </View>
              <Switch
                value={settings.controlMode === 'swipes'}
                onValueChange={(value: boolean) => saveUserSettings({ controlMode: value ? 'swipes' : 'buttons' })}
                trackColor={{ false: '#333', true: '#00ffff50' }}
                thumbColor={settings.controlMode === 'swipes' ? '#00ffff' : '#666'}
                disabled={isSaving}
              />
            </View>
          </View>

          {/* Audio Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Звук</Text>
            
            <View style={styles.toggleOption}>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>Звуковые эффекты</Text>
                <Text style={styles.toggleDescription}>Звуки игры</Text>
              </View>
              <Switch
                value={settings.soundEnabled}
                onValueChange={(value: boolean) => saveUserSettings({ soundEnabled: value })}
                trackColor={{ false: '#333', true: '#00ffff50' }}
                thumbColor={settings.soundEnabled ? '#00ffff' : '#666'}
                disabled={isSaving}
              />
            </View>

            <View style={styles.toggleOption}>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>Музыка</Text>
                <Text style={styles.toggleDescription}>Фоновая музыка</Text>
              </View>
              <Switch
                value={settings.musicEnabled}
                onValueChange={(value: boolean) => saveUserSettings({ musicEnabled: value })}
                trackColor={{ false: '#333', true: '#00ffff50' }}
                thumbColor={settings.musicEnabled ? '#00ffff' : '#666'}
                disabled={isSaving}
              />
            </View>
          </View>

          {!session?.user && (
            <View style={styles.guestNote}>
              <Icon name="user" size={20} color={ICON_COLORS.accent} style={{ marginBottom: 10 }} />
              <Text style={styles.guestNoteTitle}>Войдите для сохранения настроек</Text>
              <Text style={styles.guestNoteText}>
                Ваши настройки будут сохранены только на этом устройстве. 
                Войдите в аккаунт, чтобы синхронизировать настройки между устройствами.
              </Text>
              <Pressable 
                style={styles.loginButton}
                onPress={() => onNavigate('login')}
              >
                <Text style={styles.loginButtonText}>Войти в аккаунт</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#00ffff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    flex: 2,
  },
  userInfo: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  userInfoText: {
    color: '#4CAF50',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 10,
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  difficultyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#333',
  },
  difficultyOptionSelected: {
    borderColor: '#00ffff',
    backgroundColor: '#001a1a',
  },
  difficultyContent: {
    flex: 1,
  },
  difficultyLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  difficultyLabelSelected: {
    color: '#00ffff',
  },
  difficultyDescription: {
    fontSize: 14,
    color: '#888',
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  toggleContent: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#888',
  },
  guestNote: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginTop: 30,
    marginBottom: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  guestNoteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  guestNoteText: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
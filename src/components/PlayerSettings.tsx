import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { usePlayerSettings } from '../hooks/useGameData';
import { useDebounceCallback } from '../hooks/useResourceManager';

interface PlayerSettingsProps {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  onClose: () => void;
}

const PlayerSettings: React.FC<PlayerSettingsProps> = ({
  playerName,
  onPlayerNameChange,
  onClose,
}) => {
  const [tempPlayerName, setTempPlayerName] = useState(playerName);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);

  // Использование кастомного хука для управления настройками
  const {
    settings,
    isLoading,
    error,
    hasChanges,
    updateSettings,
    saveSettings,
    createDefaultSettings,
  } = usePlayerSettings(playerName);

  // Дебаунсинг автосохранения настроек
  const debouncedSave = useDebounceCallback(async () => {
    if (hasChanges) {
      setShowSaveIndicator(true);
      const success = await saveSettings();
      if (success) {
        setShowSaveIndicator(false);
      }
    }
  }, 2000); // Автосохранение через 2 секунды после изменения

  // Эффект для автосохранения
  useEffect(() => {
    if (hasChanges) {
      debouncedSave();
    }
  }, [hasChanges, debouncedSave]);

  // Создание настроек по умолчанию для нового игрока
  useEffect(() => {
    if (!settings && !isLoading && playerName) {
      createDefaultSettings();
    }
  }, [settings, isLoading, playerName, createDefaultSettings]);

  // Обработчики изменения настроек
  const handleControlModeChange = useCallback((mode: 'buttons' | 'swipes') => {
    updateSettings({ control_mode: mode });
  }, [updateSettings]);

  const handleShowGridChange = useCallback((value: boolean) => {
    updateSettings({ show_grid: value });
  }, [updateSettings]);

  const handleSoundEnabledChange = useCallback((value: boolean) => {
    updateSettings({ sound_enabled: value });
  }, [updateSettings]);

  const handleDifficultyChange = useCallback((difficulty: 'easy' | 'medium' | 'hard') => {
    updateSettings({ difficulty });
  }, [updateSettings]);

  // Обработка изменения имени игрока
  const handlePlayerNameSubmit = useCallback(async () => {
    if (tempPlayerName.trim() && tempPlayerName !== playerName) {
      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Изменить имя игрока?',
          'При изменении имени будут загружены настройки для нового игрока.',
          [
            { text: 'Отмена', onPress: () => resolve(false) },
            { text: 'Изменить', onPress: () => resolve(true) },
          ]
        );
      });

      if (confirmed) {
        onPlayerNameChange(tempPlayerName.trim());
      } else {
        setTempPlayerName(playerName);
      }
    }
  }, [tempPlayerName, playerName, onPlayerNameChange]);

  // Принудительное сохранение
  const handleForceSave = useCallback(async () => {
    setShowSaveIndicator(true);
    const success = await saveSettings();
    setShowSaveIndicator(false);
    
    if (success) {
      Alert.alert('Успех', 'Настройки сохранены!');
    } else {
      Alert.alert('Ошибка', 'Не удалось сохранить настройки');
    }
  }, [saveSettings]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ffff" />
          <Text style={styles.loadingText}>Загрузка настроек...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Настройки игрока</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ошибка: {error}</Text>
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        {/* Имя игрока */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Профиль игрока</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Имя игрока:</Text>
            <TextInput
              style={styles.textInput}
              value={tempPlayerName}
              onChangeText={setTempPlayerName}
              onSubmitEditing={handlePlayerNameSubmit}
              onBlur={handlePlayerNameSubmit}
              placeholder="Введите имя"
              placeholderTextColor="#888"
              maxLength={20}
            />
          </View>
        </View>

        {/* Управление */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Управление</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Режим управления:</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  settings?.control_mode === 'buttons' && styles.modeButtonActive,
                ]}
                onPress={() => handleControlModeChange('buttons')}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    settings?.control_mode === 'buttons' && styles.modeButtonTextActive,
                  ]}
                >
                  Кнопки
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  settings?.control_mode === 'swipes' && styles.modeButtonActive,
                ]}
                onPress={() => handleControlModeChange('swipes')}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    settings?.control_mode === 'swipes' && styles.modeButtonTextActive,
                  ]}
                >
                  Свайпы
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Отображение */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Отображение</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Показывать сетку:</Text>
            <Switch
              value={settings?.show_grid || false}
              onValueChange={handleShowGridChange}
              trackColor={{ false: '#333', true: '#00aaff' }}
              thumbColor={settings?.show_grid ? '#00ffff' : '#666'}
            />
          </View>
        </View>

        {/* Звук */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Звук</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Звуковые эффекты:</Text>
            <Switch
              value={settings?.sound_enabled || false}
              onValueChange={handleSoundEnabledChange}
              trackColor={{ false: '#333', true: '#00aaff' }}
              thumbColor={settings?.sound_enabled ? '#00ffff' : '#666'}
            />
          </View>
        </View>

        {/* Сложность */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Сложность</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Уровень сложности:</Text>
            <View style={styles.buttonGroup}>
              {['easy', 'medium', 'hard'].map((difficulty) => (
                <TouchableOpacity
                  key={difficulty}
                  style={[
                    styles.difficultyButton,
                    settings?.difficulty === difficulty && styles.difficultyButtonActive,
                  ]}
                  onPress={() => handleDifficultyChange(difficulty as 'easy' | 'medium' | 'hard')}
                >
                  <Text
                    style={[
                      styles.difficultyButtonText,
                      settings?.difficulty === difficulty && styles.difficultyButtonTextActive,
                    ]}
                  >
                    {difficulty === 'easy' ? 'Легко' : difficulty === 'medium' ? 'Средне' : 'Сложно'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Информация о настройках */}
        {settings && (
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Информация</Text>
            <Text style={styles.infoText}>
              Настройки созданы: {new Date(settings.created_at || '').toLocaleDateString()}
            </Text>
            {settings.updated_at && (
              <Text style={styles.infoText}>
                Последнее обновление: {new Date(settings.updated_at).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Индикатор сохранения и кнопка */}
      <View style={styles.footer}>
        {showSaveIndicator && (
          <View style={styles.saveIndicator}>
            <ActivityIndicator size="small" color="#00ffff" />
            <Text style={styles.saveIndicatorText}>Сохранение...</Text>
          </View>
        )}
        
        {hasChanges && !showSaveIndicator && (
          <View style={styles.changeIndicator}>
            <Text style={styles.changeIndicatorText}>Есть несохраненные изменения</Text>
            <TouchableOpacity style={styles.saveButton} onPress={handleForceSave}>
              <Text style={styles.saveButtonText}>Сохранить сейчас</Text>
            </TouchableOpacity>
          </View>
        )}

        {!hasChanges && !showSaveIndicator && (
          <View style={styles.savedIndicator}>
            <Text style={styles.savedIndicatorText}>✓ Все изменения сохранены</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    backgroundColor: '#333',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#331111',
    padding: 10,
    margin: 20,
    borderRadius: 6,
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ffff',
    marginBottom: 15,
  },
  settingRow: {
    marginBottom: 15,
  },
  settingLabel: {
    color: '#cccccc',
    fontSize: 16,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#333',
    color: '#ffffff',
    padding: 12,
    borderRadius: 6,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#555',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  modeButton: {
    flex: 1,
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  modeButtonActive: {
    backgroundColor: '#00ffff',
    borderColor: '#00ffff',
  },
  modeButtonText: {
    color: '#cccccc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modeButtonTextActive: {
    color: '#000000',
  },
  difficultyButton: {
    flex: 1,
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  difficultyButtonActive: {
    backgroundColor: '#00ffff',
    borderColor: '#00ffff',
  },
  difficultyButtonText: {
    color: '#cccccc',
    fontSize: 12,
    fontWeight: 'bold',
  },
  difficultyButtonTextActive: {
    color: '#000000',
  },
  infoSection: {
    margin: 20,
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 8,
  },
  infoTitle: {
    color: '#00ffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    color: '#888',
    fontSize: 12,
    marginBottom: 5,
  },
  footer: {
    backgroundColor: '#222',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  saveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveIndicatorText: {
    color: '#00ffff',
    marginLeft: 10,
    fontSize: 14,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changeIndicatorText: {
    color: '#ffaa00',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#00ffff',
    padding: 8,
    borderRadius: 4,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  savedIndicator: {
    alignItems: 'center',
  },
  savedIndicatorText: {
    color: '#00ff00',
    fontSize: 14,
  },
});

export default PlayerSettings;
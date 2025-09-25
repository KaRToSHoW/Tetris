import React from 'react';
import { View, Text, Pressable, StyleSheet, Switch } from 'react-native';
import Icon, { ICON_COLORS } from './Icon';
import type { GameSettings, Screen } from '../types/app';

interface SettingsScreenProps {
  settings: GameSettings;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onNavigate: (screen: Screen) => void;
}

export default function SettingsScreen({ settings, onUpdateSettings, onNavigate }: SettingsScreenProps) {
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
      </View>

      <View style={styles.content}>
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
              onPress={() => onUpdateSettings({ difficulty: option.key })}
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
              onValueChange={(value: boolean) => onUpdateSettings({ showGrid: value })}
              trackColor={{ false: '#333', true: '#00ffff50' }}
              thumbColor={settings.showGrid ? '#00ffff' : '#666'}
            />
          </View>

          <View style={styles.toggleOption}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleLabel}>Показать призрак</Text>
              <Text style={styles.toggleDescription}>Предварительный показ падения фигуры</Text>
            </View>
            <Switch
              value={settings.showGhost}
              onValueChange={(value: boolean) => onUpdateSettings({ showGhost: value })}
              trackColor={{ false: '#333', true: '#00ffff50' }}
              thumbColor={settings.showGhost ? '#00ffff' : '#666'}
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
              onValueChange={(value: boolean) => onUpdateSettings({ soundEnabled: value })}
              trackColor={{ false: '#333', true: '#00ffff50' }}
              thumbColor={settings.soundEnabled ? '#00ffff' : '#666'}
            />
          </View>

          <View style={styles.toggleOption}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleLabel}>Музыка</Text>
              <Text style={styles.toggleDescription}>Фоновая музыка</Text>
            </View>
            <Switch
              value={settings.musicEnabled}
              onValueChange={(value: boolean) => onUpdateSettings({ musicEnabled: value })}
              trackColor={{ false: '#333', true: '#00ffff50' }}
              thumbColor={settings.musicEnabled ? '#00ffff' : '#666'}
            />
          </View>
        </View>
      </View>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 15,
  },
  difficultyOption: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#333',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  difficultyOptionSelected: {
    borderColor: '#00ffff',
    backgroundColor: '#00ffff10',
  },
  difficultyContent: {
    flex: 1,
    padding: 15,
  },
  difficultyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
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
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    padding: 15,
    marginBottom: 10,
  },
  toggleContent: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#888',
  },
});
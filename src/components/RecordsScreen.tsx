import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import Icon, { ICON_COLORS } from './Icon';
import type { HighScore, Screen } from '../types/app';

interface RecordsScreenProps {
  records: HighScore[];
  onNavigate: (screen: Screen) => void;
  onResetRecords: () => void;
}

export default function RecordsScreen({ records, onNavigate, onResetRecords }: RecordsScreenProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return { name: 'easy', color: ICON_COLORS.success };
      case 'normal': return { name: 'normal', color: ICON_COLORS.accent };
      case 'hard': return { name: 'hard', color: ICON_COLORS.danger };
      default: return { name: 'normal', color: ICON_COLORS.text };
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Легкий';
      case 'normal': return 'Обычный';
      case 'hard': return 'Сложный';
      default: return 'Неизвестно';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => onNavigate('menu')}>
          <Icon name="back" size={16} color={ICON_COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.backButtonText}>Назад</Text>
        </Pressable>
        <Text style={styles.title}>Рекорды</Text>
        {records.length > 0 && (
          <Pressable style={styles.resetButton} onPress={onResetRecords}>
            <Text style={styles.resetButtonText}>Очистить</Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {records.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="trophy" size={64} color={ICON_COLORS.accent} style={{ marginBottom: 20 }} />
            <Text style={styles.emptyTitle}>Нет рекордов</Text>
            <Text style={styles.emptyDescription}>
              Сыграйте в игру, чтобы установить свой первый рекорд!
            </Text>
            <Pressable 
              style={styles.playButton} 
              onPress={() => onNavigate('game')}
            >
              <Icon name="play" size={16} color={ICON_COLORS.text} style={{ marginRight: 8 }} />
              <Text style={styles.playButtonText}>Играть сейчас</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.recordsList}>
            <View style={styles.tableHeader}>
              <Text style={styles.headerRank}>#</Text>
              <Text style={styles.headerScore}>Очки</Text>
              <Text style={styles.headerLines}>Линии</Text>
              <Text style={styles.headerLevel}>Уровень</Text>
              <Text style={styles.headerDifficulty}>Сложность</Text>
              <Text style={styles.headerDate}>Дата</Text>
            </View>
            
            {records.map((record, index) => (
              <View key={record.id} style={[
                styles.recordItem,
                index === 0 && styles.firstPlace,
                index === 1 && styles.secondPlace,
                index === 2 && styles.thirdPlace,
              ]}>
                <View style={styles.rankContainer}>
                  {index === 0 ? (
                    <Icon name="star" size={16} color="#FFD700" />
                  ) : index === 1 ? (
                    <Icon name="star" size={16} color="#C0C0C0" />
                  ) : index === 2 ? (
                    <Icon name="star" size={16} color="#CD7F32" />
                  ) : (
                    <Text style={styles.recordRank}>{index + 1}</Text>
                  )}
                </View>
                <Text style={styles.recordScore}>{record.score.toLocaleString()}</Text>
                <Text style={styles.recordLines}>{record.lines}</Text>
                <Text style={styles.recordLevel}>{record.level}</Text>
                <View style={styles.difficultyContainer}>
                  <Icon 
                    name={getDifficultyIcon(record.difficulty).name} 
                    size={12} 
                    color={getDifficultyIcon(record.difficulty).color}
                    style={{ marginBottom: 2 }}
                  />
                  <Text style={styles.difficultyText}>{getDifficultyLabel(record.difficulty)}</Text>
                </View>
                <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
    flex: 1,
    textAlign: 'center',
  },
  resetButton: {
    flex: 1,
    alignItems: 'flex-end',
  },
  resetButtonText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },

  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00ffff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  playButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordsList: {
    paddingTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    marginBottom: 10,
  },
  headerRank: {
    flex: 0.5,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    textAlign: 'center',
  },
  headerScore: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    textAlign: 'center',
  },
  headerLines: {
    flex: 0.8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    textAlign: 'center',
  },
  headerLevel: {
    flex: 0.8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    textAlign: 'center',
  },
  headerDifficulty: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    textAlign: 'center',
  },
  headerDate: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    textAlign: 'center',
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  firstPlace: {
    borderColor: '#FFD700',
    backgroundColor: '#FFD70010',
  },
  secondPlace: {
    borderColor: '#C0C0C0',
    backgroundColor: '#C0C0C010',
  },
  thirdPlace: {
    borderColor: '#CD7F32',
    backgroundColor: '#CD7F3210',
  },
  rankContainer: {
    flex: 0.5,
    alignItems: 'center',
  },
  recordRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  recordScore: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00ffff',
    textAlign: 'center',
  },
  recordLines: {
    flex: 0.8,
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
  },
  recordLevel: {
    flex: 0.8,
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
  },
  difficultyContainer: {
    flex: 1,
    alignItems: 'center',
  },

  difficultyText: {
    fontSize: 10,
    color: '#888',
  },
  recordDate: {
    flex: 1,
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});
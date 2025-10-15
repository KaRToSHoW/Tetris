import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { usePlayerStats, useGameRecords } from '../hooks/useGameData';
import { useResourceLoader } from '../hooks/useResourceManager';
import { GameService } from '../services/gameService';

interface GameStatsProps {
  playerName: string;
  onClose: () => void;
}

const GameStats: React.FC<GameStatsProps> = ({ playerName, onClose }) => {
  const [selectedTab, setSelectedTab] = useState<'personal' | 'global'>('personal');
  
  // Использование кастомных хуков для управления данными
  const { 
    stats, 
    gameAnalytics, 
    playerRank, 
    isLoading: statsLoading,
    error: statsError,
    refresh: refreshStats 
  } = usePlayerStats(playerName);

  const { 
    records, 
    topScores, 
    isLoading: recordsLoading,
    error: recordsError,
    playerBestScore,
    playerAverageScore,
    refresh: refreshRecords 
  } = useGameRecords(playerName);

  // Демонстрация useResourceLoader для загрузки аналитики
  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
    refresh: refreshAnalytics,
    isStale
  } = useResourceLoader(
    () => GameService.getGameAnalytics(),
    {
      autoLoad: true,
      retryAttempts: 3,
      cacheTimeout: 2 * 60 * 1000, // 2 минуты кэш
    }
  );

  // Объединенное состояние загрузки
  const isLoading = statsLoading || recordsLoading || analyticsLoading;
  const hasError = statsError || recordsError || analyticsError;

  // Функция для обновления всех данных
  const refreshAll = () => {
    refreshStats();
    refreshRecords();
    refreshAnalytics();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Статистика игрока</Text>
        <Text style={styles.playerName}>{playerName}</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'personal' && styles.activeTab]}
          onPress={() => setSelectedTab('personal')}
        >
          <Text style={[styles.tabText, selectedTab === 'personal' && styles.activeTabText]}>
            Личная
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'global' && styles.activeTab]}
          onPress={() => setSelectedTab('global')}
        >
          <Text style={[styles.tabText, selectedTab === 'global' && styles.activeTabText]}>
            Общая
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ffff" />
          <Text style={styles.loadingText}>Загрузка статистики...</Text>
        </View>
      )}

      {/* Error state */}
      {hasError && !isLoading && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ошибка загрузки данных</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshAll}>
            <Text style={styles.retryButtonText}>Повторить</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {!isLoading && !hasError && (
        <ScrollView style={styles.scrollView}>
          {selectedTab === 'personal' && (
            <PersonalStatsView 
              stats={stats}
              records={records}
              playerBestScore={playerBestScore}
              playerAverageScore={playerAverageScore}
              playerRank={playerRank}
            />
          )}
          
          {selectedTab === 'global' && (
            <GlobalStatsView 
              gameAnalytics={gameAnalytics}
              analytics={analytics}
              topScores={topScores}
              isStale={isStale}
              onRefresh={refreshAnalytics}
            />
          )}
        </ScrollView>
      )}

      {/* Refresh button */}
      <TouchableOpacity style={styles.refreshButton} onPress={refreshAll}>
        <Text style={styles.refreshButtonText}>🔄 Обновить</Text>
      </TouchableOpacity>
    </View>
  );
};

// Компонент личной статистики
const PersonalStatsView: React.FC<{
  stats: any;
  records: any[];
  playerBestScore: number;
  playerAverageScore: number;
  playerRank: number | null;
}> = ({ stats, records, playerBestScore, playerAverageScore, playerRank }) => {
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.cardTitle}>Основная статистика</Text>
        {stats ? (
          <>
            <StatRow label="Всего игр" value={stats.total_games} />
            <StatRow label="Общий счет" value={stats.total_score.toLocaleString()} />
            <StatRow label="Лучший результат" value={stats.best_score.toLocaleString()} />
            <StatRow label="Линий очищено" value={stats.total_lines_cleared} />
            <StatRow label="Среднее время игры" value={`${stats.avg_time_per_game}с`} />
            {playerRank && <StatRow label="Ранг" value={`#${playerRank}`} />}
          </>
        ) : (
          <Text style={styles.noDataText}>Статистика отсутствует</Text>
        )}
      </View>

      <View style={styles.statCard}>
        <Text style={styles.cardTitle}>Достижения</Text>
        <StatRow label="Лучший счет" value={playerBestScore.toLocaleString()} />
        <StatRow label="Средний счет" value={playerAverageScore.toLocaleString()} />
        <StatRow label="Всего рекордов" value={records.length} />
      </View>

      {records.length > 0 && (
        <View style={styles.statCard}>
          <Text style={styles.cardTitle}>Последние игры</Text>
          {records.slice(0, 5).map((record, index) => (
            <View key={record.id || index} style={styles.recordRow}>
              <Text style={styles.recordScore}>{record.score.toLocaleString()}</Text>
              <Text style={styles.recordDetails}>
                Ур.{record.level} • {record.lines_cleared} линий
              </Text>
              <Text style={styles.recordDate}>
                {new Date(record.created_at || '').toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// Компонент глобальной статистики
const GlobalStatsView: React.FC<{
  gameAnalytics: any;
  analytics: any;
  topScores: any[];
  isStale: boolean;
  onRefresh: () => void;
}> = ({ gameAnalytics, analytics, topScores, isStale, onRefresh }) => {
  const displayAnalytics = analytics || gameAnalytics;

  return (
    <View style={styles.statsContainer}>
      {isStale && (
        <TouchableOpacity style={styles.staleWarning} onPress={onRefresh}>
          <Text style={styles.staleWarningText}>
            ⚠️ Данные устарели. Нажмите для обновления
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.statCard}>
        <Text style={styles.cardTitle}>Глобальная статистика</Text>
        {displayAnalytics ? (
          <>
            <StatRow label="Всего игроков" value={displayAnalytics.totalPlayers} />
            <StatRow label="Всего игр" value={displayAnalytics.totalGames} />
            <StatRow label="Средний счет" value={displayAnalytics.averageScore.toLocaleString()} />
            <StatRow label="Лучший счет" value={displayAnalytics.topScore.toLocaleString()} />
          </>
        ) : (
          <Text style={styles.noDataText}>Данные недоступны</Text>
        )}
      </View>

      {topScores.length > 0 && (
        <View style={styles.statCard}>
          <Text style={styles.cardTitle}>Топ результаты</Text>
          {topScores.map((record, index) => (
            <View key={record.id} style={styles.leaderboardRow}>
              <Text style={styles.rank}>#{index + 1}</Text>
              <View style={styles.playerInfo}>
                <Text style={styles.leaderboardPlayerName}>{record.player_name}</Text>
                <Text style={styles.playerScore}>{record.score.toLocaleString()}</Text>
              </View>
              <Text style={styles.playerLevel}>Ур.{record.level}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// Вспомогательный компонент для строки статистики
const StatRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <View style={styles.statRow}>
    <Text style={styles.statLabel}>{label}:</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

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
  playerName: {
    fontSize: 16,
    color: '#00ffff',
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#222',
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#333',
    borderBottomWidth: 2,
    borderBottomColor: '#00ffff',
  },
  tabText: {
    color: '#888',
    fontSize: 16,
  },
  activeTabText: {
    color: '#ffffff',
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#00ffff',
    padding: 12,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    padding: 20,
  },
  statCard: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ffff',
    marginBottom: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  statLabel: {
    color: '#cccccc',
    fontSize: 14,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noDataText: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  recordScore: {
    color: '#00ffff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  recordDetails: {
    color: '#cccccc',
    fontSize: 12,
    flex: 1,
    textAlign: 'center',
  },
  recordDate: {
    color: '#888',
    fontSize: 10,
    flex: 1,
    textAlign: 'right',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rank: {
    color: '#00ffff',
    fontSize: 16,
    fontWeight: 'bold',
    width: 30,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  leaderboardPlayerName: {
    color: '#ffffff',
    fontSize: 14,
  },
  playerScore: {
    color: '#cccccc',
    fontSize: 12,
  },
  playerLevel: {
    color: '#888',
    fontSize: 12,
  },
  refreshButton: {
    backgroundColor: '#333',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  staleWarning: {
    backgroundColor: '#444',
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
  },
  staleWarningText: {
    color: '#ffaa00',
    textAlign: 'center',
    fontSize: 14,
  },
});

export default GameStats;
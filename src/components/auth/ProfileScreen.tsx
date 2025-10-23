import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { getPlayerStats, getUserRecords, PlayerStats, GameRecord } from '../../lib/supabase';

interface ProfileScreenProps {
  onNavigateToGame: () => void;
  onNavigateToRecords: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigateToGame,
  onNavigateToRecords,
}) => {
  const { user, session, signOut, isLoading: authLoading, refreshUserSession } = useAuth();
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [userRecords, setUserRecords] = useState<GameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (session?.user) {
      loadProfileData();
    } else {
      setIsLoading(false);
    }
  }, [session]);

  const loadProfileData = async (isRetry: boolean = false) => {
    if (!session?.user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Load player stats and records in parallel
      const [statsResult, recordsResult] = await Promise.all([
        getPlayerStats(session.user.id),
        getUserRecords(session.user.id, 5), // Get top 5 user records
      ]);

      // Check for auth errors
      const hasAuthError = (result: any) => {
        return result.error && (result.error.includes('JWT') || result.error.includes('expired') || result.error.includes('401'));
      };

      if (hasAuthError(statsResult) || hasAuthError(recordsResult)) {
        if (!isRetry && retryCount < 2) {
          setRetryCount(prev => prev + 1);
          console.log('Auth error detected, refreshing session and retrying...');
          await refreshUserSession();
          setTimeout(() => loadProfileData(true), 1000);
          return;
        } else {
          setError('Сессия истекла. Пожалуйста, войдите заново.');
          return;
        }
      }

      if (statsResult.error && !statsResult.error.includes('PGRST116')) {
        console.log('Error loading stats:', statsResult.error);
        setError('Ошибка загрузки статистики');
      } else if (!statsResult.data) {
        console.log('No player stats found, user is new');
        setPlayerStats({
          total_games: 0,
          total_score: 0,
          best_score: 0,
          total_lines_cleared: 0,
          best_level_reached: 0,
          total_time_played: 0,
        });
      } else {
        setPlayerStats(statsResult.data);
      }

      if (recordsResult.error && !recordsResult.error.includes('PGRST116')) {
        console.log('Error loading records:', recordsResult.error);
      } else {
        setUserRecords(recordsResult.data || []);
      }
      
      // Success - reset retry count
      setRetryCount(0);
    } catch (error) {
      console.error('Error loading profile data:', error);
      setError('Не удалось загрузить данные профиля');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRetryCount(0); // Reset retry count on manual refresh
    await loadProfileData();
    setIsRefreshing(false);
  };

  // Note: signOut is intentionally kept in the AuthContext but the button
  // is removed from the UI to match the requirement "убрать кнопку выход".

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    }
    return `${minutes}м ${seconds % 60}с`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateAverageScore = () => {
    if (!playerStats || playerStats.total_games === 0) return 0;
    return Math.round(playerStats.total_score / playerStats.total_games);
  };

  const calculateAverageLines = () => {
    if (!playerStats || playerStats.total_games === 0) return 0;
    return Math.round(playerStats.total_lines_cleared / playerStats.total_games);
  };

  // Экран для гостя
  if (!session?.user) {
    return (
      <View style={styles.container}>
        <View style={styles.guestContainer}>
          <Text style={styles.title}>Профиль гостя</Text>
          <Text style={styles.guestText}>
            Войдите в аккаунт или зарегистрируйтесь, чтобы сохранять свои рекорды и статистику!
          </Text>
          
          <TouchableOpacity style={[styles.button, styles.playButton]} onPress={onNavigateToGame}>
            <Text style={styles.buttonText}>Играть</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={onNavigateToRecords}>
            <Text style={styles.buttonText}>Рекорды</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (authLoading || isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Загрузка профиля...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={[styles.button, styles.retryButton]} onPress={() => loadProfileData()}>
          <Text style={styles.buttonText}>Повторить</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={onNavigateToGame}>
          <Text style={styles.buttonText}>Назад к игре</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={['#4CAF50']}
          tintColor="#4CAF50"
        />
      }
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.display_name || user?.username || session.user.email || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.username}>
            {user?.display_name || user?.username || 'Игрок'}
          </Text>
          <Text style={styles.email}>{session.user.email}</Text>
          {playerStats && playerStats.total_games > 0 && (
            <Text style={styles.memberSince}>
              Игр сыграно: {playerStats.total_games}
            </Text>
          )}
        </View>

        {/* Quick Stats Cards */}
        {playerStats && (
          <View style={styles.quickStatsContainer}>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatValue}>{playerStats.best_score.toLocaleString()}</Text>
              <Text style={styles.quickStatLabel}>Лучший счет</Text>
            </View>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatValue}>{playerStats.best_level_reached}</Text>
              <Text style={styles.quickStatLabel}>Лучший уровень</Text>
            </View>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatValue}>{formatTime(playerStats.total_time_played)}</Text>
              <Text style={styles.quickStatLabel}>Время игры</Text>
            </View>
          </View>
        )}

        {/* Detailed Statistics */}
        {playerStats && (
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Детальная статистика</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{playerStats.total_games}</Text>
                <Text style={styles.statLabel}>Всего игр</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{playerStats.total_score.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Общий счет</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{calculateAverageScore().toLocaleString()}</Text>
                <Text style={styles.statLabel}>Средний счет</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{playerStats.total_lines_cleared}</Text>
                <Text style={styles.statLabel}>Линий очищено</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{calculateAverageLines()}</Text>
                <Text style={styles.statLabel}>Среднее линий за игру</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.round(playerStats.total_time_played / playerStats.total_games || 0)}м</Text>
                <Text style={styles.statLabel}>Среднее время игры</Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Records */}
        {userRecords.length > 0 && (
          <View style={styles.recordsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Мои последние рекорды</Text>
              <TouchableOpacity onPress={onNavigateToRecords}>
                <Text style={styles.viewAllText}>Все рекорды</Text>
              </TouchableOpacity>
            </View>
            
            {userRecords.map((record, index) => (
              <View key={record.id} style={styles.recordItem}>
                <View style={styles.recordRank}>
                  <Text style={styles.recordRankText}>#{index + 1}</Text>
                </View>
                <View style={styles.recordInfo}>
                  <Text style={styles.recordScore}>{record.score.toLocaleString()} очков</Text>
                  <Text style={styles.recordDetails}>
                    Уровень {record.level} • {record.lines_cleared} линий • {formatTime(record.time_played)}
                  </Text>
                  <Text style={styles.recordDate}>
                    {record.created_at ? formatDate(record.created_at) : 'Недавно'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={[styles.button, styles.playButton]} onPress={onNavigateToGame}>
            <Text style={styles.buttonText}>🎮 Играть</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={onNavigateToRecords}>
            <Text style={styles.buttonText}>🏆 Все рекорды</Text>
          </TouchableOpacity>
          
          {/* Sign-out action removed from UI per requirements. */}
        </View>
      </View>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D12', // Глубокий черный
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#0D0D12', // Фон для гостя
  },
  header: {
    alignItems: 'center',
    marginBottom: 40, // Больше отступ
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#00ffff', // Неоновый голубой фон
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    // Легкое свечение
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000000', // Черный текст на неоновом фоне
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ffff', // Неоновый голубой
    marginBottom: 10,
    textShadowColor: 'rgba(0, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  username: {
    fontSize: 26,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#aaaaaa', // Светло-серый
    marginBottom: 10,
  },
  memberSince: {
    fontSize: 14,
    color: '#00e676', // Неоновый зеленый
    fontWeight: '600',
  },
  guestText: {
    fontSize: 18,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#ff4174', // Неоновый красный/розовый
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#ff9800', // Оранжевый
    marginBottom: 15,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    marginHorizontal: -5,
  },
  // Элементы в стиле "Glassmorphism" с неоновыми рамками
  cardBase: {
    backgroundColor: 'rgba(10, 10, 20, 0.75)', // Темный полупрозрачный фон
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.3)', // Неоновая рамка
  },
  quickStatCard: {
    flex: 1,
    marginHorizontal: 5,
  },
  quickStatValue: {
    fontSize: 24, // Крупнее
    fontWeight: 'bold',
    color: '#00e676', // Неоновый зеленый
    marginBottom: 5,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#aaaaaa',
    textAlign: 'center',
    fontWeight: '600',
  },
  statsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00ffff',
    marginBottom: 15,
    borderLeftWidth: 4, // Неоновая линия слева
    borderLeftColor: '#00ffff',
    paddingLeft: 10,
    textShadowColor: 'rgba(0, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllText: {
    color: '#00e676', // Неоновый зеленый
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    marginBottom: 15,
  },
  statValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#00ffff', // Неоновый голубой
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#cccccc',
    textAlign: 'center',
    fontWeight: '600',
  },
  recordsContainer: {
    marginBottom: 30,
  },
  recordItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  recordRank: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  recordRankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00e676',
  },
  recordInfo: {
    flex: 1,
  },
  recordScore: {
    fontSize: 20, // Крупнее
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  recordDetails: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 2,
  },
  recordDate: {
    fontSize: 12,
    color: '#aaaaaa',
  },
  buttonsContainer: {
    gap: 15,
    marginTop: 10,
  },
  button: {
    backgroundColor: '#3a3a5a', // Темный фон для кнопок
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.4)',
  },
  playButton: {
    backgroundColor: '#00ffff', // Неоновый голубой
    borderColor: '#00ffff',
    // Неоновое свечение для кнопки
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000', // Черный текст на неоновом фоне
  },
});
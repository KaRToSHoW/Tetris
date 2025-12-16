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
  Pressable,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../Icon';
import { supabase } from '../../lib/supabase';
import { THEME } from '../../styles/theme';

interface PlayerStats {
  total_games: number;
  total_score: number;
  best_score: number;
  total_lines_cleared: number;
  best_level_reached: number;
  total_time_played: number;
}

interface GameRecord {
  id: string;
  user_id: string;
  player_name: string;
  score: number;
  level: number;
  lines_cleared: number;
  time_played: number;
  created_at: string;
}

interface ProfileScreenProps {
  onNavigateToGame: () => void;
  onNavigateToRecords: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigateToGame,
  onNavigateToRecords,
}) => {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [userRecords, setUserRecords] = useState<GameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadProfileData();
    }
  }, [user?.id]);

  const loadProfileData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Load player stats
      const { data: stats, error: statsError } = await supabase
        .from('player_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        console.error('Stats error:', statsError);
        setError('Ошибка загрузки статистики');
      } else if (stats) {
        setPlayerStats(stats);
      } else {
        // No stats yet (new user)
        setPlayerStats({
          total_games: 0,
          total_score: 0,
          best_score: 0,
          total_lines_cleared: 0,
          best_level_reached: 0,
          total_time_played: 0,
        });
      }

      // Load user records
      const { data: records, error: recordsError } = await supabase
        .from('records')
        .select('*')
        .eq('user_id', user.id)
        .order('score', { ascending: false })
        .limit(5);

      if (recordsError) {
        console.error('Records error:', recordsError);
      } else {
        setUserRecords(records || []);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Не удалось загрузить профиль');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProfileData();
    setIsRefreshing(false);
  };

  const handleSignOut = () => {
    Alert.alert('Выход', 'Выйти из аккаунта?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLoading(true);
            await signOut();
            // Navigate after signOut completes
            setTimeout(() => {
              onNavigateToGame();
            }, 500);
          } catch (e) {
            console.error('Sign out error:', e);
            setIsLoading(false);
            Alert.alert('Ошибка', 'Не удалось выйти из аккаунта');
          }
        },
      },
    ]);
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
  if (!user) {
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
        <ActivityIndicator size="large" color={THEME.colors.success} />
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
          colors={[THEME.colors.success]}
          tintColor={THEME.colors.success}
        />
      }
    >
      <View style={styles.content}>
        {/* Header with Back Button */}
        <View style={styles.headerContainer}>
          <Pressable 
            style={styles.backButton} 
            onPress={onNavigateToGame}
          >
            <Icon name="left" size={18} color={THEME.colors.primary} />
            <Text style={styles.backButtonText}>Назад</Text>
          </Pressable>
        </View>

        {/* User Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.display_name || user?.username || user?.email || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.username}>
            {user?.display_name || user?.username || 'Игрок'}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
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
          
          <TouchableOpacity style={[styles.button, styles.signOutButton]} onPress={handleSignOut}>
            <Text style={styles.buttonText}>🚪 Выйти</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: THEME.spacing.lg,
    paddingTop: 60,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: THEME.colors.background,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.sm,
  },
  username: {
    fontSize: 24,
    color: THEME.colors.primary,
    fontWeight: '600',
    marginBottom: THEME.spacing.xs,
  },
  email: {
    fontSize: 16,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.xs,
  },
  memberSince: {
    fontSize: 14,
    color: THEME.colors.accent,
  },
  guestText: {
    fontSize: 18,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.xl,
    lineHeight: 24,
  },
  loadingText: {
    color: THEME.colors.text,
    marginTop: THEME.spacing.md,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    color: THEME.colors.error,
    textAlign: 'center',
    marginBottom: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.lg,
  },
  retryButton: {
    backgroundColor: THEME.colors.warning,
    marginBottom: THEME.spacing.md,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.xl,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    alignItems: 'center',
    marginHorizontal: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.colors.primary,
    marginBottom: THEME.spacing.sm,
  },
  quickStatLabel: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },
  statsContainer: {
    marginBottom: THEME.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  viewAllText: {
    color: THEME.colors.primary,
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
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.colors.primary,
    marginBottom: THEME.spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },
  recordsContainer: {
    marginBottom: THEME.spacing.xl,
  },
  recordItem: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
  },
  recordRank: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: THEME.spacing.md,
  },
  recordRankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.primary,
  },
  recordInfo: {
    flex: 1,
  },
  recordScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  recordDetails: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.xs,
  },
  recordDate: {
    fontSize: 12,
    color: THEME.colors.disabled,
  },
  buttonsContainer: {
    gap: THEME.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: THEME.spacing.lg,
  },
  button: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.lg,
    alignItems: 'center',
    minWidth: 100,
  },
  playButton: {
    backgroundColor: THEME.colors.success,
  },
  signOutButton: {
    backgroundColor: THEME.colors.error,
  },
  viewRecordsButton: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.background,
  },

  /* Header / Back button */
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.xs,
    marginRight: THEME.spacing.md,
  },
  backButtonText: {
    color: THEME.colors.primary,
    marginLeft: THEME.spacing.xs,
    fontWeight: '600',
  },
});
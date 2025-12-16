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
import Icon, { ICON_COLORS } from './Icon';
import { useAuth } from '../contexts/AuthContext';
import { getTopRecords, getUserRecords, GameRecord } from '../lib/supabase';
import { THEME } from '../styles/theme';
import type { HighScore, Screen } from '../types/app';

interface RecordsScreenProps {
  records: HighScore[];
  onNavigate: (screen: Screen) => void;
  onResetRecords: () => void;
}

interface ExtendedGameRecord extends GameRecord {
  profiles?: {
    username?: string;
    display_name?: string;
  };
}

export default function RecordsScreen({ records, onNavigate, onResetRecords }: RecordsScreenProps) {
  const { user } = useAuth();
  const [globalRecords, setGlobalRecords] = useState<ExtendedGameRecord[]>([]);
  const [userRecords, setUserRecords] = useState<GameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showGlobal, setShowGlobal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadRecords();
    }
  }, [user?.id, showGlobal]);

  const loadRecords = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    try {
      let result;
      if (showGlobal) {
        result = await getTopRecords(50);
      } else {
        result = await getUserRecords(user.id, 20);
      }

      if (result.error) {
        console.log('Error loading records:', result.error);
        setError(showGlobal ? 'Ошибка загрузки глобальных рекордов' : 'Ошибка загрузки ваших рекордов');
        return;
      }

      if (showGlobal) {
        setGlobalRecords(result.data || []);
      } else {
        setUserRecords(result.data || []);
      }
    } catch (error) {
      console.error('Error loading records:', error);
      setError('Не удалось загрузить рекорды');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRecords();
    setIsRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Только что';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}м назад`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}ч назад`;
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPlayerName = (record: ExtendedGameRecord) => {
    if (record.profiles) {
      return record.profiles.display_name || record.profiles.username || record.player_name;
    }
    return record.player_name;
  };

  const renderLocalRecords = () => {
    if (records.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Icon name="trophy" size={64} color={ICON_COLORS.accent} style={{ marginBottom: 20 }} />
          <Text style={styles.emptyTitle}>Нет локальных рекордов</Text>
          <Text style={styles.emptyDescription}>
            Сыграйте в игру, чтобы установить свой первый рекорд!
          </Text>
          <TouchableOpacity 
            style={styles.playButton} 
            onPress={() => onNavigate('game')}
          >
            <Icon name="play" size={16} color={ICON_COLORS.text} style={{ marginRight: 8 }} />
            <Text style={styles.playButtonText}>Играть сейчас</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.recordsList}>
        <View style={styles.tableHeader}>
          <Text style={styles.headerRank}>#</Text>
          <Text style={styles.headerScore}>Очки</Text>
          <Text style={styles.headerLines}>Линии</Text>
          <Text style={styles.headerLevel}>Ур.</Text>
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
            <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderUserRecords = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ICON_COLORS.primary} />
          <Text style={styles.loadingText}>Загрузка ваших рекордов...</Text>
        </View>
      );
    }

    if (userRecords.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Icon name="trophy" size={64} color={ICON_COLORS.accent} style={{ marginBottom: 20 }} />
          <Text style={styles.emptyTitle}>Нет персональных рекордов</Text>
          <Text style={styles.emptyDescription}>
            Сыграйте в игру, чтобы установить свой первый рекорд в профиле!
          </Text>
          <TouchableOpacity 
            style={styles.playButton} 
            onPress={() => onNavigate('game')}
          >
            <Icon name="play" size={16} color={ICON_COLORS.text} style={{ marginRight: 8 }} />
            <Text style={styles.playButtonText}>Играть сейчас</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.recordsList}>
        <View style={styles.tableHeader}>
          <Text style={styles.headerRank}>#</Text>
          <Text style={styles.headerScore}>Очки</Text>
          <Text style={styles.headerLines}>Линии</Text>
          <Text style={styles.headerLevel}>Ур.</Text>
          <Text style={styles.headerTime}>Время</Text>
          <Text style={styles.headerDate}>Дата</Text>
        </View>
        
        {userRecords.map((record, index) => (
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
            <Text style={styles.recordLines}>{record.lines_cleared}</Text>
            <Text style={styles.recordLevel}>{record.level}</Text>
            <Text style={styles.recordTime}>{formatTime(record.time_played)}</Text>
            <Text style={styles.recordDate}>
              {record.created_at ? formatDate(record.created_at) : 'Недавно'}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderGlobalRecords = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ICON_COLORS.primary} />
          <Text style={styles.loadingText}>Загрузка глобальных рекордов...</Text>
        </View>
      );
    }

    if (globalRecords.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Icon name="trophy" size={64} color={ICON_COLORS.accent} style={{ marginBottom: 20 }} />
          <Text style={styles.emptyTitle}>Нет глобальных рекордов</Text>
          <Text style={styles.emptyDescription}>
            Будьте первым, кто установит рекорд!
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.recordsList}>
        <View style={styles.tableHeader}>
          <Text style={styles.headerRank}>#</Text>
          <Text style={styles.headerPlayer}>Игрок</Text>
          <Text style={styles.headerScore}>Очки</Text>
          <Text style={styles.headerLines}>Линии</Text>
          <Text style={styles.headerLevel}>Ур.</Text>
          <Text style={styles.headerDate}>Дата</Text>
        </View>
        
        {globalRecords.map((record, index) => (
          <View key={record.id} style={[
            styles.recordItem,
            index === 0 && styles.firstPlace,
            index === 1 && styles.secondPlace,
            index === 2 && styles.thirdPlace,
            record.user_id === user?.id && styles.userRecord,
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
            <View style={styles.playerContainer}>
              <Text style={styles.recordPlayer} numberOfLines={1}>
                {getPlayerName(record)}
              </Text>
              {record.user_id === user?.id && (
                <Text style={styles.youLabel}>ВЫ</Text>
              )}
            </View>
            <Text style={styles.recordScore}>{record.score.toLocaleString()}</Text>
            <Text style={styles.recordLines}>{record.lines_cleared}</Text>
            <Text style={styles.recordLevel}>{record.level}</Text>
            <Text style={styles.recordDate}>
              {record.created_at ? formatDate(record.created_at) : 'Недавно'}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('menu')}>
          <Icon name="back" size={16} color={ICON_COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.backButtonText}>Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Рекорды</Text>
        {records.length > 0 && !showGlobal && !user && (
          <TouchableOpacity style={styles.resetButton} onPress={onResetRecords}>
            <Text style={styles.resetButtonText}>Очистить</Text>
          </TouchableOpacity>
        )}
      </View>

      {user ? (
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, !showGlobal && styles.activeTab]}
            onPress={() => setShowGlobal(false)}
          >
            <Text style={[styles.tabText, !showGlobal && styles.activeTabText]}>
              Мои рекорды
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, showGlobal && styles.activeTab]}
            onPress={() => setShowGlobal(true)}
          >
            <Text style={[styles.tabText, showGlobal && styles.activeTabText]}>
              Глобальные
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.guestInfo}>
          <Text style={styles.guestInfoText}>
            Локальные рекорды этого устройства
          </Text>
        </View>
      )}

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          user ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#4CAF50']}
              tintColor="#4CAF50"
            />
          ) : undefined
        }
      >
        {!user ? (
          <>
            {renderLocalRecords()}
            <View style={styles.guestMessage}>
              <Text style={styles.guestTitle}>Войдите для глобальных рекордов</Text>
              <Text style={styles.guestDescription}>
                Зарегистрируйтесь или войдите в аккаунт, чтобы сохранять свои рекорды и соревноваться с другими игроками!
              </Text>
              <TouchableOpacity 
                style={styles.loginButton} 
                onPress={() => onNavigate('login')}
              >
                <Text style={styles.loginButtonText}>Войти</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadRecords()}>
              <Text style={styles.retryButtonText}>Повторить</Text>
            </TouchableOpacity>
          </View>
        ) : showGlobal ? (
          renderGlobalRecords()
        ) : (
          renderUserRecords()
        )}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: 60,
    paddingBottom: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 255, 0.2)', 
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: THEME.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    flex: 2,
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.colors.primary,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  resetButton: {
    flex: 1,
    alignItems: 'flex-end',
  },
  resetButtonText: {
    color: THEME.colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 10, 20, 0.9)',
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: THEME.spacing.md,
    alignItems: 'center',
    borderRadius: THEME.borderRadius.md,
  },
  activeTab: {
    backgroundColor: THEME.colors.primary,
  },
  tabText: {
    color: THEME.colors.disabled,
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: THEME.colors.background,
  },
  guestInfo: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.lg,
  },
  guestInfoText: {
    color: THEME.colors.disabled,
    fontSize: 14,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  guestMessage: {
    padding: THEME.spacing.xl,
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 20, 0.75)',
    margin: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.3)',
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.colors.text,
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
  },
  guestDescription: {
    fontSize: 16,
    color: THEME.colors.disabled,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: THEME.spacing.lg,
  },
  loginButton: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.xl,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
  },
  loginButtonText: {
    color: THEME.colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: THEME.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    color: THEME.colors.disabled,
    marginTop: THEME.spacing.md,
    fontSize: 16,
  },
  errorContainer: {
    padding: THEME.spacing.xl,
    alignItems: 'center',
    backgroundColor: 'rgba(20, 10, 10, 0.75)',
    margin: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.error,
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
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
  },
  retryButtonText: {
    color: THEME.colors.background,
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.xl,
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.colors.text,
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
  },
  emptyDescription: {
    fontSize: 16,
    color: THEME.colors.disabled,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: THEME.spacing.xl,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.xl,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
  },
  playButtonText: {
    color: THEME.colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordsList: {
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.lg,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    backgroundColor: 'rgba(10, 10, 20, 0.9)',
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.md,
  },
  headerRank: {
    width: 40,
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.colors.disabled,
    textAlign: 'center',
  },
  headerPlayer: {
    flex: 1.5,
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.colors.disabled,
    textAlign: 'left',
    marginRight: THEME.spacing.md,
  },
  headerScore: {
    width: 80,
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.colors.disabled,
    textAlign: 'center',
  },
  headerLines: {
    width: 50,
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.colors.disabled,
    textAlign: 'center',
  },
  headerLevel: {
    width: 40,
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.colors.disabled,
    textAlign: 'center',
  },
  headerTime: {
    width: 60,
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.colors.disabled,
    textAlign: 'center',
  },
  headerDate: {
    width: 80,
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.colors.disabled,
    textAlign: 'center',
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    backgroundColor: 'rgba(15, 15, 25, 0.7)',
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(0, 255, 255, 0.4)',
  },
  firstPlace: {
    borderLeftColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  secondPlace: {
    borderLeftColor: '#C0C0C0',
    backgroundColor: 'rgba(192, 192, 192, 0.1)',
  },
  thirdPlace: {
    borderLeftColor: '#CD7F32',
    backgroundColor: 'rgba(205, 127, 50, 0.1)',
  },
  userRecord: {
    borderLeftColor: THEME.colors.success,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  recordRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.disabled,
  },
  playerContainer: {
    flex: 1.5,
    marginRight: THEME.spacing.md,
  },
  recordPlayer: {
    fontSize: 14,
    color: THEME.colors.text,
    fontWeight: '600',
  },
  youLabel: {
    fontSize: 10,
    color: THEME.colors.success,
    fontWeight: 'bold',
    marginTop: THEME.spacing.xs,
  },
  recordScore: {
    width: 80,
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.primary,
    textAlign: 'center',
  },
  recordLines: {
    width: 50,
    fontSize: 14,
    color: THEME.colors.text,
    textAlign: 'center',
  },
  recordLevel: {
    width: 40,
    fontSize: 14,
    color: THEME.colors.text,
    textAlign: 'center',
  },
  recordTime: {
    width: 60,
    fontSize: 12,
    color: THEME.colors.disabled,
    textAlign: 'center',
  },
  recordDate: {
    width: 80,
    fontSize: 12,
    color: THEME.colors.disabled,
    textAlign: 'center',
  },
});
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
  const { session, refreshUserSession } = useAuth();
  const [globalRecords, setGlobalRecords] = useState<ExtendedGameRecord[]>([]);
  const [userRecords, setUserRecords] = useState<GameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showGlobal, setShowGlobal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (session?.user) {
      loadRecords();
    }
  }, [session, showGlobal]);

  const loadRecords = async (isRetry: boolean = false) => {
    if (!session?.user) return;
    
    setIsLoading(true);
    setError(null);
    try {
      let result;
      if (showGlobal) {
        result = await getTopRecords(50);
      } else {
        result = await getUserRecords(session.user.id, 20);
      }

      // Check for auth errors
      if (result.error && (result.error.includes('JWT') || result.error.includes('expired') || result.error.includes('401'))) {
        if (!isRetry && retryCount < 2) {
          setRetryCount(prev => prev + 1);
          console.log('Auth error detected, refreshing session and retrying...');
          await refreshUserSession();
          setTimeout(() => loadRecords(true), 1000);
          return;
        } else {
          setError('Сессия истекла. Пожалуйста, войдите заново.');
          return;
        }
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
      
      // Success - reset retry count
      setRetryCount(0);
    } catch (error) {
      console.error('Error loading records:', error);
      setError('Не удалось загрузить рекорды');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRetryCount(0); // Reset retry count on manual refresh
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
            record.user_id === session?.user?.id && styles.userRecord,
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
              {record.user_id === session?.user?.id && (
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
        {records.length > 0 && !showGlobal && !session?.user && (
          <TouchableOpacity style={styles.resetButton} onPress={onResetRecords}>
            <Text style={styles.resetButtonText}>Очистить</Text>
          </TouchableOpacity>
        )}
      </View>

      {session?.user ? (
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
          session?.user ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#4CAF50']}
              tintColor="#4CAF50"
            />
          ) : undefined
        }
      >
        {!session?.user ? (
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
    backgroundColor: '#0D0D12', // Более глубокий черный
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60, // Оставляем для SafeArea
    paddingBottom: 15, // Чуть меньше
    // Неоновая линия-разделитель
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 255, 0.2)', 
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#00ffff', // Неоновый голубой
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    flex: 2,
    fontSize: 28, // Крупнее
    fontWeight: 'bold',
    color: '#00ffff', // Неоновый голубой
    textAlign: 'center',
    // Свечение
    textShadowColor: 'rgba(0, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  resetButton: {
    flex: 1,
    alignItems: 'flex-end',
  },
  resetButtonText: {
    color: '#ff4174', // Неоновый красный/розовый
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 10, 20, 0.9)', // Темный полупрозрачный
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#00ffff', // Активный таб
  },
  tabText: {
    color: '#aaaaaa', // Светло-серый
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#000000', // Черный для контраста
  },
  guestInfo: {
    // Убрал фон, просто текст
    paddingHorizontal: 20,
    paddingBottom: 20, // Отступ снизу
  },
  guestInfoText: {
    color: '#aaaaaa',
    fontSize: 14,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  guestMessage: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 20, 0.75)', // Эффект стекла
    margin: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.3)', // Неоновая рамка
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  guestDescription: {
    fontSize: 16,
    color: '#aaaaaa', // Светлее
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#00ffff', // Основной акцентный цвет
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#000000', // Черный для контраста
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#aaaaaa',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(20, 10, 10, 0.75)', // Стекло с красным оттенком
    margin: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff4174', // Неоновая красная рамка
  },
  errorText: {
    fontSize: 16,
    color: '#ff4174', // Неоновый красный
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#ff9800', // Яркий "аркадный" оранжевый
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#aaaaaa', // Светлее
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00ffff', // Основной цвет
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  playButtonText: {
    color: '#000000', // Черный
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordsList: {
    paddingHorizontal: 15, // Чуть меньше
    paddingBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(10, 10, 20, 0.9)', // Темная "стеклянная" шапка
    borderRadius: 8,
    marginBottom: 10,
  },
  headerRank: {
    width: 40,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#aaaaaa', // Светлее
    textAlign: 'center',
  },
  headerPlayer: {
    flex: 1.5,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#aaaaaa',
    textAlign: 'left',
    marginRight: 10,
  },
  headerScore: {
    width: 80,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#aaaaaa',
    textAlign: 'center',
  },
  headerLines: {
    width: 50,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#aaaaaa',
    textAlign: 'center',
  },
  headerLevel: {
    width: 40,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#aaaaaa',
    textAlign: 'center',
  },
  headerTime: {
    width: 60,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#aaaaaa',
    textAlign: 'center',
  },
  headerDate: {
    width: 80,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#aaaaaa',
    textAlign: 'center',
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(15, 15, 25, 0.7)', // Стеклянный элемент
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(0, 255, 255, 0.4)', // Рамка по умолчанию
  },
  firstPlace: {
    borderLeftColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)', // Золотое свечение
  },
  secondPlace: {
    borderLeftColor: '#C0C0C0',
    backgroundColor: 'rgba(192, 192, 192, 0.1)', // Серебряное свечение
  },
  thirdPlace: {
    borderLeftColor: '#CD7F32',
    backgroundColor: 'rgba(205, 127, 50, 0.1)', // Бронзовое свечение
  },
  userRecord: {
    borderLeftColor: '#00e676', // Неоновый зеленый
    backgroundColor: 'rgba(0, 230, 118, 0.1)', // Зеленое свечение
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  recordRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#aaaaaa', // Светлее
  },
  playerContainer: {
    flex: 1.5,
    marginRight: 10,
  },
  recordPlayer: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  youLabel: {
    fontSize: 10,
    color: '#00e676', // Неоновый зеленый
    fontWeight: 'bold',
    marginTop: 2,
  },
  recordScore: {
    width: 80,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00ffff', // Акцент на очках
    textAlign: 'center',
  },
  recordLines: {
    width: 50,
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
  },
  recordLevel: {
    width: 40,
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
  },
  recordTime: {
    width: 60,
    fontSize: 12,
    color: '#aaaaaa', // Светлее
    textAlign: 'center',
  },
  recordDate: {
    width: 80,
    fontSize: 12,
    color: '#aaaaaa', // Светлее
    textAlign: 'center',
  },
});
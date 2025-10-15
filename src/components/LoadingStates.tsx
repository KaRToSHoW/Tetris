import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import Icon, { ICON_COLORS } from './Icon';

// Типы состояний загрузки
type LoadingState = 'idle' | 'loading' | 'success' | 'error' | 'timeout';

interface LoadingStateProps {
  state: LoadingState;
  message?: string;
  progress?: number; // 0-100
  onRetry?: () => void;
  showProgress?: boolean;
  timeout?: number; // в секундах
}

/**
 * Компонент для отображения различных состояний загрузки
 * Поддерживает индикаторы прогресса, таймауты и повторные попытки
 */
const LoadingStateIndicator: React.FC<LoadingStateProps> = ({
  state,
  message,
  progress = 0,
  onRetry,
  showProgress = false,
  timeout = 30,
}) => {
  const [timeLeft, setTimeLeft] = useState(timeout);
  const [animatedProgress] = useState(new Animated.Value(0));
  const screenWidth = Dimensions.get('window').width;

  // Таймер для отсчета времени
  useEffect(() => {
    if (state === 'loading' && timeout > 0) {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [state, timeout]);

  // Анимация прогресса
  useEffect(() => {
    if (showProgress) {
      Animated.timing(animatedProgress, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, showProgress, animatedProgress]);

  // Сброс таймера при изменении состояния
  useEffect(() => {
    if (state !== 'loading') {
      setTimeLeft(timeout);
    }
  }, [state, timeout]);

  const renderContent = () => {
    switch (state) {
      case 'idle':
        return (
          <View style={styles.stateContainer}>
            <Icon name="check" size={48} color={ICON_COLORS.secondary} />
            <Text style={styles.stateText}>Готов к загрузке</Text>
            {message && <Text style={styles.messageText}>{message}</Text>}
          </View>
        );

      case 'loading':
        return (
          <View style={styles.stateContainer}>
            <View style={styles.loadingIndicator}>
              <ActivityIndicator size="large" color={ICON_COLORS.primary} />
              {showProgress && (
                <Text style={styles.progressText}>{Math.round(progress)}%</Text>
              )}
            </View>
            
            <Text style={styles.stateText}>Загрузка...</Text>
            {message && <Text style={styles.messageText}>{message}</Text>}
            
            {showProgress && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: animatedProgress.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                          extrapolate: 'clamp',
                        }),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
              </View>
            )}

            {timeout > 0 && (
              <Text style={styles.timeoutText}>
                Таймаут через {timeLeft} сек.
              </Text>
            )}
          </View>
        );

      case 'success':
        return (
          <View style={styles.stateContainer}>
            <Icon name="check" size={48} color={ICON_COLORS.success} />
            <Text style={[styles.stateText, { color: ICON_COLORS.success }]}>
              Успешно загружено
            </Text>
            {message && (
              <Text style={[styles.messageText, { color: ICON_COLORS.success }]}>
                {message}
              </Text>
            )}
          </View>
        );

      case 'error':
        return (
          <View style={styles.stateContainer}>
            <Icon name="close" size={48} color={ICON_COLORS.danger} />
            <Text style={[styles.stateText, { color: ICON_COLORS.danger }]}>
              Ошибка загрузки
            </Text>
            {message && (
              <Text style={[styles.messageText, { color: ICON_COLORS.danger }]}>
                {message}
              </Text>
            )}
            {onRetry && (
              <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                <Icon name="rotate" size={20} color={ICON_COLORS.secondary} />
                <Text style={styles.retryButtonText}>Повторить</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'timeout':
        return (
          <View style={styles.stateContainer}>
            <Icon name="clock" size={48} color={ICON_COLORS.warning} />
            <Text style={[styles.stateText, { color: ICON_COLORS.warning }]}>
              Время ожидания истекло
            </Text>
            {message && (
              <Text style={[styles.messageText, { color: ICON_COLORS.warning }]}>
                {message}
              </Text>
            )}
            {onRetry && (
              <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                <Icon name="rotate" size={20} color={ICON_COLORS.secondary} />
                <Text style={styles.retryButtonText}>Попробовать снова</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return <View style={styles.container}>{renderContent()}</View>;
};

/**
 * Демонстрационный компонент для различных состояний загрузки
 * Показывает все возможные состояния и их интерактивность
 */
const LoadingStatesDemo: React.FC = () => {
  const [currentState, setCurrentState] = useState<LoadingState>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  // Симуляция загрузки
  const simulateLoading = useCallback(() => {
    setCurrentState('loading');
    setProgress(0);
    setMessage('Загружаем данные...');

    // Симулируем прогресс
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          // Случайно выбираем успех или ошибку
          const isSuccess = Math.random() > 0.3;
          setCurrentState(isSuccess ? 'success' : 'error');
          setMessage(
            isSuccess
              ? 'Данные успешно загружены!'
              : 'Не удалось загрузить данные. Проверьте подключение к интернету.'
          );
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    // Таймаут
    setTimeout(() => {
      if (currentState === 'loading') {
        clearInterval(progressInterval);
        setCurrentState('timeout');
        setMessage('Сервер не отвечает. Попробуйте позже.');
      }
    }, 10000);
  }, [currentState]);

  // Симуляция быстрой загрузки
  const simulateQuickLoad = useCallback(() => {
    setCurrentState('loading');
    setMessage('Быстрая загрузка...');
    
    setTimeout(() => {
      setCurrentState('success');
      setMessage('Готово!');
    }, 1500);
  }, []);

  // Симуляция ошибки
  const simulateError = useCallback(() => {
    setCurrentState('loading');
    setMessage('Пытаемся подключиться...');
    
    setTimeout(() => {
      setCurrentState('error');
      setMessage('Сервер недоступен. Код ошибки: 500');
    }, 2000);
  }, []);

  // Сброс состояния
  const resetState = useCallback(() => {
    setCurrentState('idle');
    setProgress(0);
    setMessage('');
  }, []);

  return (
    <View style={styles.demoContainer}>
      <Text style={styles.demoTitle}>Демонстрация состояний загрузки</Text>
      
      <LoadingStateIndicator
        state={currentState}
        message={message}
        progress={progress}
        showProgress={currentState === 'loading' && progress > 0}
        onRetry={simulateLoading}
        timeout={10}
      />

      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={simulateLoading}>
          <Text style={styles.controlButtonText}>Загрузка с прогрессом</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={simulateQuickLoad}>
          <Text style={styles.controlButtonText}>Быстрая загрузка</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={simulateError}>
          <Text style={styles.controlButtonText}>Симуляция ошибки</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={resetState}>
          <Text style={styles.controlButtonText}>Сброс</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.stateInfo}>
        <Text style={styles.stateInfoText}>Текущее состояние: {currentState}</Text>
        {progress > 0 && (
          <Text style={styles.stateInfoText}>Прогресс: {Math.round(progress)}%</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingIndicator: {
    alignItems: 'center',
    marginBottom: 15,
  },
  stateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: ICON_COLORS.secondary,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  messageText: {
    fontSize: 14,
    color: ICON_COLORS.secondary,
    textAlign: 'center',
    opacity: 0.8,
    paddingHorizontal: 20,
  },
  progressText: {
    fontSize: 16,
    color: ICON_COLORS.primary,
    fontWeight: 'bold',
    marginTop: 10,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 250,
    marginTop: 15,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ICON_COLORS.primary,
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    color: ICON_COLORS.secondary,
    marginTop: 5,
  },
  timeoutText: {
    fontSize: 12,
    color: ICON_COLORS.warning,
    marginTop: 10,
    opacity: 0.8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ICON_COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 15,
  },
  retryButtonText: {
    color: ICON_COLORS.secondary,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  demoContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingVertical: 20,
  },
  demoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: ICON_COLORS.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  controlButton: {
    backgroundColor: '#333',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    margin: 5,
  },
  controlButtonText: {
    color: ICON_COLORS.secondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  stateInfo: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    margin: 20,
    borderRadius: 8,
  },
  stateInfoText: {
    color: ICON_COLORS.secondary,
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 2,
  },
});

export default LoadingStatesDemo;
export { LoadingStateIndicator };
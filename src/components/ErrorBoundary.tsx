import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon, { ICON_COLORS } from './Icon';

// Интерфейс для пропсов Error Boundary
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

// Интерфейс для состояния Error Boundary
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary компонент для перехвата и обработки ошибок React
 * Предоставляет пользователю понятный интерфейс при возникновении ошибок
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  // Статический метод для обновления состояния при ошибке
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  // Метод вызывается при перехвате ошибки
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Вызываем колбэк если он предоставлен
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Логируем ошибку для отладки
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  // Метод для сброса состояния ошибки
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Если предоставлен кастомный fallback, используем его
      if (this.props.fallback && this.state.error && this.state.errorInfo) {
        return this.props.fallback(this.state.error, this.state.errorInfo);
      }

      // Используем стандартный UI для ошибки
      return (
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Icon name="close" size={64} color={ICON_COLORS.danger} />
          </View>
          
          <Text style={styles.errorTitle}>Произошла ошибка</Text>
          
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'Неизвестная ошибка'}
          </Text>

          <View style={styles.errorDetails}>
            <Text style={styles.errorDetailsTitle}>Детали ошибки:</Text>
            <Text style={styles.errorDetailsText}>
              {this.state.error?.stack?.split('\n')[0] || 'Нет дополнительной информации'}
            </Text>
          </View>

          <TouchableOpacity style={styles.retryButton} onPress={this.resetError}>
            <Icon name="rotate" size={20} color={ICON_COLORS.secondary} />
            <Text style={styles.retryButtonText}>Попробовать снова</Text>
          </TouchableOpacity>

          {__DEV__ && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugTitle}>Информация для разработчика:</Text>
              <Text style={styles.debugText}>
                {this.state.errorInfo?.componentStack}
              </Text>
            </View>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: ICON_COLORS.danger,
    textAlign: 'center',
    marginBottom: 15,
  },
  errorMessage: {
    fontSize: 16,
    color: ICON_COLORS.secondary,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  errorDetails: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
    maxWidth: 400,
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: ICON_COLORS.warning,
    marginBottom: 8,
  },
  errorDetailsText: {
    fontSize: 12,
    color: ICON_COLORS.secondary,
    fontFamily: 'monospace',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ICON_COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  retryButtonText: {
    color: ICON_COLORS.secondary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  debugInfo: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    maxWidth: 400,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: ICON_COLORS.warning,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 10,
    color: '#aaa',
    fontFamily: 'monospace',
  },
});

export default ErrorBoundary;
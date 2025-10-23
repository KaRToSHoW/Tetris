import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Icon, { ICON_COLORS } from './Icon';
import { useAuth } from '../contexts/AuthContext';
import type { Screen } from '../types/app';
import VideoBackground from './VideoBackground';

interface MainMenuProps {
  onNavigate: (screen: Screen) => void;
}

interface MenuItem {
  key: string;
  label: string;
  icon: string;
  disabled: boolean;
  subtitle?: string;
}

const { width, height } = Dimensions.get('window');

export default function MainMenu({ onNavigate }: MainMenuProps) {
  const { user, session } = useAuth();
  // play menu music
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const sm = await import('../sounds/soundManager');
        if (mounted) {
          sm.playMusic('menu');
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
      (async () => {
        try {
          const sm = await import('../sounds/soundManager');
          sm.stopMusic('menu');
        } catch (e) {}
      })();
    };
  }, []);

  // Dynamic menu items based on authentication status
  const getMenuItems = (): MenuItem[] => {
    const baseItems = [
      { key: 'game', label: 'Играть', icon: 'gamepad', disabled: false },
      { key: 'records', label: 'Рекорды', icon: 'trophy', disabled: false },
      { key: 'settings', label: 'Настройки', icon: 'gear', disabled: false },
    ];

    const authItem = session?.user 
      ? { key: 'profile', label: 'Профиль', icon: 'user', disabled: false }
      : { key: 'login', label: 'Вход / Регистрация', icon: 'login', disabled: false };

    const endItems = [
      { key: 'multiplayer', label: 'Мультиплеер', icon: 'users', disabled: true, subtitle: '(в доработке)' },
    ];

    return [...baseItems, authItem, ...endItems];
  };

  const menuItems = getMenuItems();

  const handlePress = (key: string) => {
    (async () => {
      try {
        const sm = await import('../sounds/soundManager');
        sm.playSound('click');
      } catch (e) {}
    })();
    onNavigate(key as Screen);
  };

  return (
    <VideoBackground blurIntensity={60}>
      <View style={styles.container}>
        <View style={styles.header}>
        <Text style={styles.title}>ТЕТРИС</Text>
        <Text style={styles.subtitle}>Классическая игра</Text>
        {session?.user && (
          <Text style={styles.userWelcome}>
            Добро пожаловать, {user?.display_name || user?.username || session.user.email}!
          </Text>
        )}
      </View>
      
      <View style={styles.menu}>
        {menuItems.map((item, index) => (
          <Pressable
            key={item.key}
            style={[
              styles.menuItem,
              item.disabled && styles.menuItemDisabled
            ]}
            onPress={() => handlePress(item.key)}
            disabled={item.disabled}
            android_ripple={{ color: '#ffffff20' }}
          >
            <View style={styles.menuItemContent}>
              <View style={styles.menuIconContainer}>
                <Icon 
                  name={item.icon} 
                  size={24} 
                  color={item.disabled ? ICON_COLORS.disabled : ICON_COLORS.primary}
                />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={[styles.menuText, item.disabled && styles.menuTextDisabled]}>
                  {item.label}
                </Text>
                {item.subtitle && (
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                )}
              </View>
            </View>
            {!item.disabled && <View style={styles.menuArrow}>
              <Icon name="right" size={16} color={ICON_COLORS.primary} />
            </View>}
          </Pressable>
        ))}
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2024 Tetris Game</Text>
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
      </View>
    </VideoBackground>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    // Добавим немного отступов сверху и снизу, чтобы меню не "прилипало"
    // к краям при некоторых разрешениях
    paddingVertical: 40, 
  },
  header: {
    alignItems: 'center',
    marginBottom: 50, // Немного уменьшил отступ
  },
  title: {
    fontSize: 64, // Крупнее
    fontWeight: 'bold',
    color: '#00ffff', // Яркий циан
    textAlign: 'center',
    letterSpacing: 2, // Небольшой разнос букв
    textShadowColor: 'rgba(0, 255, 255, 0.8)', // Более яркая тень
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 25, // Более сильное "свечение"
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#e0e0e0', // Светло-серый вместо тусклого
    textAlign: 'center',
    fontWeight: '300', // Тонкое начертание
  },
  userWelcome: {
    fontSize: 16,
    color: '#00e676', // Более яркий "позитивный" зеленый
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '500',
  },
  menu: {
    maxWidth: 450, // Чуть шире для планшетов
    alignSelf: 'center',
    width: '100%',
  },
  menuItem: {
    // Темный, полупрозрачный фон с синим оттенком
    backgroundColor: 'rgba(10, 10, 20, 0.75)', 
    borderRadius: 12, // Чуть более скругленные углы
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.3)', // Полупрозрачная неоновая рамка
    overflow: 'hidden', // Для ripple-эффекта
    // Тень для "глубины"
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8, // Для Android
  },
  menuItemDisabled: {
    backgroundColor: 'rgba(10, 10, 20, 0.4)', // Более прозрачный
    borderColor: 'rgba(128, 128, 128, 0.2)', // Серая рамка
    shadowOpacity: 0, // Убираем тень
    elevation: 0,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    // Сделаем паdding чуть поменьше по вертикали
    paddingVertical: 18, 
    paddingHorizontal: 20,
  },
  menuIconContainer: {
    marginRight: 18,
    minWidth: 30, // Убедимся, что иконка не "прыгает"
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContainer: {
    flex: 1, // Занимает все оставшееся место
  },
  menuText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff', // Чистый белый
  },
  menuTextDisabled: {
    color: '#777', // Более контрастный серый
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#aaa', // Светло-серый
    marginTop: 2,
  },
  menuArrow: {
    position: 'absolute',
    right: 20,
    // Улучшенный способ вертикального центрирования
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30, // Немного поднимем
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)', // Полупрозрачный белый
    marginBottom: 5,
  },
  versionText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)', // Еще более прозрачный
  },
});
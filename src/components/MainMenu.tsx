import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Icon, { ICON_COLORS } from './Icon';
import { useAuth } from '../contexts/AuthContext';
import { THEME } from '../styles/theme';
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
  const { user } = useAuth();
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

    const authItem = user 
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
    <VideoBackground>
      <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ТЕТРИС</Text>
        <Text style={styles.subtitle}>Классическая игра</Text>
        {user && (
          <Text style={styles.userWelcome}>
            Добро пожаловать, {user?.display_name || user?.username || user?.email}!
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
    paddingHorizontal: THEME.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: THEME.colors.primary,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: THEME.spacing.md,
  },
  subtitle: {
    fontSize: 18,
    color: THEME.colors.disabled,
    textAlign: 'center',
  },
  userWelcome: {
    fontSize: 16,
    color: THEME.colors.success,
    textAlign: 'center',
    marginTop: THEME.spacing.md,
  },
  menu: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  menuItem: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.lg,
    borderWidth: 2,
    borderColor: THEME.colors.primary,
    overflow: 'hidden',
  },
  menuItemDisabled: {
    backgroundColor: THEME.colors.background,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  menuIconContainer: {
    marginRight: THEME.spacing.lg,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: 20,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  menuTextDisabled: {
    color: THEME.colors.disabled,
  },
  menuSubtitle: {
    fontSize: 14,
    color: THEME.colors.disabled,
    marginTop: THEME.spacing.xs,
  },
  menuArrow: {
    position: 'absolute',
    right: THEME.spacing.lg,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  footer: {
    position: 'absolute',
    bottom: THEME.spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: THEME.colors.disabled,
    marginBottom: THEME.spacing.sm,
  },
  versionText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.2)',
  },
});
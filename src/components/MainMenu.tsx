import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Icon, { ICON_COLORS } from './Icon';
import type { Screen } from '../types/app';

interface MainMenuProps {
  onNavigate: (screen: Screen) => void;
}

const { width, height } = Dimensions.get('window');

export default function MainMenu({ onNavigate }: MainMenuProps) {
  const menuItems = [
    { key: 'game', label: 'Играть', icon: 'gamepad', disabled: false },
    { key: 'settings', label: 'Настройки', icon: 'gear', disabled: false },
    { key: 'records', label: 'Рекорды', icon: 'trophy', disabled: false },
    { key: 'stats', label: 'Статистика', icon: 'chart', disabled: false, subtitle: '(Персональная и глобальная)' },
    { key: 'multiplayer', label: 'Мультиплеер', icon: 'users', disabled: true, subtitle: '(в доработке)' },
    { key: 'exit', label: 'Выход', icon: 'exit', disabled: false },
  ];

  const handlePress = (key: string) => {
    if (key === 'exit') {
      // In a real app, this would close the app
      // For now, we'll just show an alert or do nothing
      return;
    }
    onNavigate(key as Screen);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ТЕТРИС</Text>
        <Text style={styles.subtitle}>Классическая игра</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00ffff',
    textAlign: 'center',
    textShadowColor: '#00ffff50',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
  },
  menu: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  menuItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#333',
    overflow: 'hidden',
  },
  menuItemDisabled: {
    backgroundColor: '#111',
    borderColor: '#222',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  menuIconContainer: {
    marginRight: 20,
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
    color: '#ffffff',
  },
  menuTextDisabled: {
    color: '#666',
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  menuArrow: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -10 }],
  },

  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  versionText: {
    fontSize: 10,
    color: '#444',
  },
});
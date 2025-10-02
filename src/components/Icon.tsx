import React from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: ViewStyle | TextStyle;
}

const ICONS = {
  // Game actions
  play: '▶',
  pause: '⏸',
  settings: '⚙',
  home: '⌂',
  restart: '↻',
  
  // Menu items
  gamepad: '▲', // Triangle for play/game
  trophy: '★', // Filled star for trophy
  users: '⌂', // House/group symbol
  exit: '⬅',
  
  // Navigation
  back: '←',
  forward: '→',
  up: '↑',
  down: '↓',
  
  // Actions
  check: '✓',
  close: '✕',
  menu: '☰',
  
  // Game controls
  rotate: '⟲',
  drop: '⇓',
  left: '◀',
  right: '▶',
  
  // Difficulty
  easy: '●',
  normal: '●',
  hard: '●',
  
  // UI elements
  gear: '⚙',
  star: '★',
  heart: '♥',
  diamond: '♦',
} as const;

const ICON_COLORS = {
  primary: '#00ffff',
  secondary: '#ffffff',
  accent: '#ffd500',
  success: '#00ff6a',
  warning: '#ff8c00',
  danger: '#ff004d',
  disabled: '#666666',
  text: '#ffffff',
} as const;

export default function Icon({ name, size = 16, color = ICON_COLORS.secondary, style }: IconProps) {
  const iconChar = ICONS[name as keyof typeof ICONS] || name;
  
  return (
    <Text style={[
      styles.icon,
      {
        fontSize: size,
        color: color,
        lineHeight: size * 1.2,
      },
      style
    ]}>
      {iconChar}
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export { ICON_COLORS };
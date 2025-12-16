// Unified Design System / Theme
export const THEME = {
  colors: {
    // Primary colors (neon cyberpunk)
    primary: '#00ffff',      // Cyan neon
    secondary: '#ff00ff',    // Magenta neon
    accent: '#00ff00',       // Green neon
    
    // Backgrounds
    background: '#0a0a0a',   // Deep black
    surface: '#1a1a2e',      // Dark navy
    surfaceLight: '#2a2a4a', // Slightly lighter dark
    
    // Text colors
    text: '#ffffff',         // White
    textLight: '#cccccc',    // Light gray
    textSecondary: '#aaaaaa',// Medium gray
    disabled: '#666666',     // Darker gray
    
    // Status colors
    success: '#4CAF50',      // Green
    error: '#ff4444',        // Red
    warning: '#ff9800',      // Orange
    info: '#2196F3',         // Blue
    
    // Glass effect
    glass: 'rgba(10, 10, 20, 0.75)',
    glassLight: 'rgba(0, 255, 255, 0.1)',
    
    // Rankings
    gold: '#FFD700',
    silver: '#C0C0C0',
    bronze: '#CD7F32',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 5,
    },
    lg: {
      shadowColor: '#00ffff',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};

export const commonStyles = {
  flexCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flexBetween: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
};

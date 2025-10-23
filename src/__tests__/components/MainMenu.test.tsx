import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MainMenu from '../../components/MainMenu';
import { AuthContext } from '../../contexts/AuthContext';

// Мок для звукового менеджера
jest.mock('../../sounds/soundManager', () => ({
  playMusic: jest.fn(),
  stopMusic: jest.fn(),
  playSound: jest.fn(),
}));

const mockAuthContextValue = {
  user: null,
  session: null,
  loading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  deleteAccount: jest.fn(),
};

const mockAuthContextWithUser = {
  ...mockAuthContextValue,
  user: { display_name: 'Test User', username: 'testuser', email: 'test@example.com' },
  session: { user: { email: 'test@example.com' } },
};

describe('MainMenu Component - Модульное тестирование', () => {
  const mockOnNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Базовый рендеринг', () => {
    it('должен рендерить заголовок и подзаголовок', () => {
      const { getByText } = render(
        <AuthContext.Provider value={mockAuthContextValue}>
          <MainMenu onNavigate={mockOnNavigate} />
        </AuthContext.Provider>
      );

      expect(getByText('ТЕТРИС')).toBeDefined();
      expect(getByText('Классическая игра')).toBeDefined();
    });

    it('должен рендерить базовые пункты меню', () => {
      const { getByText } = render(
        <AuthContext.Provider value={mockAuthContextValue}>
          <MainMenu onNavigate={mockOnNavigate} />
        </AuthContext.Provider>
      );

      expect(getByText('Играть')).toBeDefined();
      expect(getByText('Рекорды')).toBeDefined();
      expect(getByText('Настройки')).toBeDefined();
    });

    it('должен показывать "Вход / Регистрация" для неавторизованного пользователя', () => {
      const { getByText } = render(
        <AuthContext.Provider value={mockAuthContextValue}>
          <MainMenu onNavigate={mockOnNavigate} />
        </AuthContext.Provider>
      );

      expect(getByText('Вход / Регистрация')).toBeDefined();
    });

    it('должен показывать "Профиль" для авторизованного пользователя', () => {
      const { getByText } = render(
        <AuthContext.Provider value={mockAuthContextWithUser}>
          <MainMenu onNavigate={mockOnNavigate} />
        </AuthContext.Provider>
      );

      expect(getByText('Профиль')).toBeDefined();
    });

    it('должен показывать приветствие для авторизованного пользователя', () => {
      const { getByText } = render(
        <AuthContext.Provider value={mockAuthContextWithUser}>
          <MainMenu onNavigate={mockOnNavigate} />
        </AuthContext.Provider>
      );

      expect(getByText('Добро пожаловать, Test User!')).toBeDefined();
    });
  });

  describe('Взаимодействие с меню', () => {
    it('должен вызывать onNavigate при нажатии на "Играть"', async () => {
      const { getByText } = render(
        <AuthContext.Provider value={mockAuthContextValue}>
          <MainMenu onNavigate={mockOnNavigate} />
        </AuthContext.Provider>
      );

      fireEvent.press(getByText('Играть'));
      
      await waitFor(() => {
        expect(mockOnNavigate).toHaveBeenCalledWith('game');
      });
    });

    it('должен вызывать onNavigate при нажатии на "Рекорды"', async () => {
      const { getByText } = render(
        <AuthContext.Provider value={mockAuthContextValue}>
          <MainMenu onNavigate={mockOnNavigate} />
        </AuthContext.Provider>
      );

      fireEvent.press(getByText('Рекорды'));
      
      await waitFor(() => {
        expect(mockOnNavigate).toHaveBeenCalledWith('records');
      });
    });

    it('должен вызывать onNavigate при нажатии на "Настройки"', async () => {
      const { getByText } = render(
        <AuthContext.Provider value={mockAuthContextValue}>
          <MainMenu onNavigate={mockOnNavigate} />
        </AuthContext.Provider>
      );

      fireEvent.press(getByText('Настройки'));
      
      await waitFor(() => {
        expect(mockOnNavigate).toHaveBeenCalledWith('settings');
      });
    });

    it('должен обрабатывать недоступные пункты меню', () => {
      const { getByText } = render(
        <AuthContext.Provider value={mockAuthContextValue}>
          <MainMenu onNavigate={mockOnNavigate} />
        </AuthContext.Provider>
      );

      const multiplayerButton = getByText('Мультиплеер');
      expect(multiplayerButton).toBeDefined();
      
      // Проверяем, что кнопка отключена
      fireEvent.press(multiplayerButton);
      expect(mockOnNavigate).not.toHaveBeenCalledWith('multiplayer');
    });
  });

  describe('Авторизация пользователя', () => {
    it('должен показывать email если нет display_name и username', () => {
      const contextWithEmailOnly = {
        ...mockAuthContextValue,
        user: { email: 'test@example.com' },
        session: { user: { email: 'test@example.com' } },
      };

      const { getByText } = render(
        <AuthContext.Provider value={contextWithEmailOnly}>
          <MainMenu onNavigate={mockOnNavigate} />
        </AuthContext.Provider>
      );

      expect(getByText('Добро пожаловать, test@example.com!')).toBeDefined();
    });

    it('должен приоритезировать display_name над username', () => {
      const contextWithBothNames = {
        ...mockAuthContextValue,
        user: { 
          display_name: 'Display Name', 
          username: 'username',
          email: 'test@example.com' 
        },
        session: { user: { email: 'test@example.com' } },
      };

      const { getByText } = render(
        <AuthContext.Provider value={contextWithBothNames}>
          <MainMenu onNavigate={mockOnNavigate} />
        </AuthContext.Provider>
      );

      expect(getByText('Добро пожаловать, Display Name!')).toBeDefined();
    });
  });

  describe('Обработка ошибок звука', () => {
    it('должен обрабатывать ошибки звукового менеджера', async () => {
      // Мокаем ошибку импорта
      jest.doMock('../../sounds/soundManager', () => {
        throw new Error('Sound manager error');
      });

      const { getByText } = render(
        <AuthContext.Provider value={mockAuthContextValue}>
          <MainMenu onNavigate={mockOnNavigate} />
        </AuthContext.Provider>
      );

      // Компонент должен рендериться несмотря на ошибку звука
      expect(getByText('ТЕТРИС')).toBeDefined();
    });
  });

  describe('Футер', () => {
    it('должен показывать информацию о версии', () => {
      const { getByText } = render(
        <AuthContext.Provider value={mockAuthContextValue}>
          <MainMenu onNavigate={mockOnNavigate} />
        </AuthContext.Provider>
      );

      expect(getByText('© 2024 Tetris Game')).toBeDefined();
      expect(getByText('v1.0.0')).toBeDefined();
    });
  });
});
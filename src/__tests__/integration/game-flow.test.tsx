import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MainMenu from '../../components/MainMenu';
import { AuthContext } from '../../contexts/AuthContext';

const mockAuthContext = {
  user: null,
  session: null,
  loading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  deleteAccount: jest.fn(),
};

describe('Game Flow - Интеграционное тестирование', () => {
  const mockOnNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('должен корректно обрабатывать навигацию между экранами', async () => {
    const { getByText } = render(
      <AuthContext.Provider value={mockAuthContext}>
        <MainMenu onNavigate={mockOnNavigate} />
      </AuthContext.Provider>
    );

    // Проверяем переход к игре
    fireEvent.press(getByText('Играть'));
    await waitFor(() => {
      expect(mockOnNavigate).toHaveBeenCalledWith('game');
    });

    jest.clearAllMocks();

    // Проверяем переход к рекордам
    fireEvent.press(getByText('Рекорды'));
    await waitFor(() => {
      expect(mockOnNavigate).toHaveBeenCalledWith('records');
    });
  });

  it('должен отображать правильное меню в зависимости от статуса авторизации', () => {
    // Без авторизации
    const { getByText, rerender } = render(
      <AuthContext.Provider value={mockAuthContext}>
        <MainMenu onNavigate={mockOnNavigate} />
      </AuthContext.Provider>
    );

    expect(getByText('Вход / Регистрация')).toBeDefined();

    // С авторизацией
    const authContextWithUser = {
      ...mockAuthContext,
      user: { display_name: 'Test', email: 'test@test.com' },
      session: { user: { email: 'test@test.com' } },
    };

    rerender(
      <AuthContext.Provider value={authContextWithUser}>
        <MainMenu onNavigate={mockOnNavigate} />
      </AuthContext.Provider>
    );

    expect(getByText('Профиль')).toBeDefined();
  });
});
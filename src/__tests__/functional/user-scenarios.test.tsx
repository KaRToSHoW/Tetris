import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MainMenu from '../../components/MainMenu';
import { AuthContext } from '../../contexts/AuthContext';

describe('User Scenarios - Функциональное тестирование', () => {
  const mockOnNavigate = jest.fn();
  const mockAuthContext = {
    user: null,
    session: null,
    loading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    deleteAccount: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Сценарий: Новый пользователь запускает игру', () => {
    const { getByText } = render(
      <AuthContext.Provider value={mockAuthContext}>
        <MainMenu onNavigate={mockOnNavigate} />
      </AuthContext.Provider>
    );

    // Пользователь видит главное меню
    expect(getByText('ТЕТРИС')).toBeDefined();
    expect(getByText('Классическая игра')).toBeDefined();

    // Пользователь может начать игру
    fireEvent.press(getByText('Играть'));
    expect(mockOnNavigate).toHaveBeenCalledWith('game');
  });

  it('Сценарий: Пользователь хочет посмотреть рекорды', () => {
    const { getByText } = render(
      <AuthContext.Provider value={mockAuthContext}>
        <MainMenu onNavigate={mockOnNavigate} />
      </AuthContext.Provider>
    );

    fireEvent.press(getByText('Рекорды'));
    expect(mockOnNavigate).toHaveBeenCalledWith('records');
  });

  it('Сценарий: Авторизованный пользователь заходит в профиль', () => {
    const authContext = {
      ...mockAuthContext,
      user: { display_name: 'Игрок', email: 'player@test.com' },
      session: { user: { email: 'player@test.com' } },
    };

    const { getByText } = render(
      <AuthContext.Provider value={authContext}>
        <MainMenu onNavigate={mockOnNavigate} />
      </AuthContext.Provider>
    );

    expect(getByText('Добро пожаловать, Игрок!')).toBeDefined();
    fireEvent.press(getByText('Профиль'));
    expect(mockOnNavigate).toHaveBeenCalledWith('profile');
  });
});
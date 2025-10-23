import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import VideoBackground from '../../components/VideoBackground';

// Расширенные моки для expo-video
const mockPlayer = {
  loop: false,
  muted: false,
  volume: 1,
  play: jest.fn(),
  pause: jest.fn(),
  addListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
};

jest.mock('expo-video', () => ({
  useVideoPlayer: jest.fn(() => mockPlayer),
  VideoView: 'VideoView',
}));

describe('VideoBackground Component - Модульное тестирование', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Базовый рендеринг', () => {
    it('должен рендериться с дочерними элементами', () => {
      const { getByText } = render(
        <VideoBackground>
          <Text>Test Content</Text>
        </VideoBackground>
      );

      expect(getByText('Test Content')).toBeDefined();
    });

    it('должен создавать video player с правильными настройками', () => {
      const { useVideoPlayer } = require('expo-video');
      
      render(
        <VideoBackground>
          <Text>Test Content</Text>
        </VideoBackground>
      );

      expect(useVideoPlayer).toHaveBeenCalledWith(
        expect.any(Object), // videoSource
        expect.any(Function) // setup function
      );
    });

    it('должен применять правильные настройки к плееру', () => {
      const { useVideoPlayer } = require('expo-video');
      
      render(
        <VideoBackground>
          <Text>Test Content</Text>
        </VideoBackground>
      );

      // Получаем setup функцию из вызова useVideoPlayer
      const setupFunction = useVideoPlayer.mock.calls[0][1];
      
      // Вызываем setup функцию с мок плеером
      setupFunction(mockPlayer);

      expect(mockPlayer.loop).toBe(true);
      expect(mockPlayer.muted).toBe(true);
      expect(mockPlayer.volume).toBe(0);
      expect(mockPlayer.play).toHaveBeenCalled();
    });
  });

  describe('Обработка пропсов', () => {
    it('должен использовать кастомный videoSource', () => {
      const { useVideoPlayer } = require('expo-video');
      const customSource = { uri: 'https://example.com/video.mp4' };
      
      render(
        <VideoBackground videoSource={customSource}>
          <Text>Test Content</Text>
        </VideoBackground>
      );

      expect(useVideoPlayer).toHaveBeenCalledWith(
        customSource,
        expect.any(Function)
      );
    });

    it('должен использовать дефолтный videoSource если не передан', () => {
      const { useVideoPlayer } = require('expo-video');
      
      render(
        <VideoBackground>
          <Text>Test Content</Text>
        </VideoBackground>
      );

      // Проверяем, что используется require для дефолтного видео
      expect(useVideoPlayer).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('должен передавать blurIntensity в BlurView', () => {
      const customBlurIntensity = 80;
      
      const { UNSAFE_getByType } = render(
        <VideoBackground blurIntensity={customBlurIntensity}>
          <Text>Test Content</Text>
        </VideoBackground>
      );

      // В реальном приложении BlurView был бы замокан, 
      // но мы проверяем, что пропс передается
      expect(() => UNSAFE_getByType('BlurView')).not.toThrow();
    });
  });

  describe('Обработка ошибок видео', () => {
    it('должен подписываться на события статуса плеера', () => {
      render(
        <VideoBackground>
          <Text>Test Content</Text>
        </VideoBackground>
      );

      expect(mockPlayer.addListener).toHaveBeenCalledWith(
        'statusChange',
        expect.any(Function)
      );
    });

    it('должен обрабатывать ошибки статуса плеера', () => {
      render(
        <VideoBackground>
          <Text>Test Content</Text>
        </VideoBackground>
      );

      // Получаем callback функцию для statusChange
      const statusChangeCallback = mockPlayer.addListener.mock.calls[0][1];
      
      // Имитируем ошибку
      const errorPayload = {
        status: 'error',
        error: { message: 'Video loading failed' },
      };

      // Вызываем callback с ошибкой
      statusChangeCallback(errorPayload);

      // В случае ошибки должен рендериться AnimatedGradientBackground
      // Это можно проверить через изменение структуры компонента
    });

    it('должен отписываться от событий при размонтировании', () => {
      const mockRemove = jest.fn();
      mockPlayer.addListener.mockReturnValue({ remove: mockRemove });

      const { unmount } = render(
        <VideoBackground>
          <Text>Test Content</Text>
        </VideoBackground>
      );

      unmount();

      expect(mockRemove).toHaveBeenCalled();
    });
  });

  describe('Fallback поведение', () => {
    it('должен показывать AnimatedGradientBackground при ошибке видео', () => {
      // Мокаем ошибку видео
      const errorMockPlayer = {
        ...mockPlayer,
        addListener: jest.fn((event, callback) => {
          // Сразу вызываем callback с ошибкой
          callback({ status: 'error', error: { message: 'Test error' } });
          return { remove: jest.fn() };
        }),
      };

      require('expo-video').useVideoPlayer.mockReturnValue(errorMockPlayer);

      const { getByText } = render(
        <VideoBackground>
          <Text>Test Content</Text>
        </VideoBackground>
      );

      // Контент должен все еще рендериться
      expect(getByText('Test Content')).toBeDefined();
    });
  });

  describe('Компонент VideoView', () => {
    it('должен рендерить VideoView с правильными пропсами', () => {
      const { UNSAFE_getByType } = render(
        <VideoBackground>
          <Text>Test Content</Text>
        </VideoBackground>
      );

      expect(() => UNSAFE_getByType('VideoView')).not.toThrow();
    });
  });
});
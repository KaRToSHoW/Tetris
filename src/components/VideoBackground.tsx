// -*- coding: utf-8 -*-
import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Dimensions, ActivityIndicator, Platform } from 'react-native';
// Предполагается, что 'expo-video' и 'expo-blur' установлены.
import { useVideoPlayer, VideoView } from 'expo-video';
import { BlurView } from 'expo-blur';
import AnimatedGradientBackground from '../../assets/videos/AnimatedGradientBackground';

interface VideoBackgroundProps {
  children?: React.ReactNode;
  blurIntensity?: number;
  videoSource?: any;
}

const { width, height } = Dimensions.get('window');

export default function VideoBackground({ 
  children, 
  blurIntensity = 60,
  videoSource 
}: VideoBackgroundProps) {
  const [hasVideoError, setHasVideoError] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Создаем video player с настройками (только для нативной платформы)
  const player = Platform.OS !== 'web' ? useVideoPlayer(
    videoSource || require('../../assets/videos/tetris-bg.mp4'),
    (player) => {
      player.loop = true;
      player.muted = true;
      player.volume = 0;
      player.play(); 
    }
  ) : null;

  // Web-specific video setup
  useEffect(() => {
    if (Platform.OS === 'web') {
      const timer = setTimeout(() => {
        console.log('Web video: setting ready state after delay');
        setIsVideoReady(true);
        setIsLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' && player) {
      // 1. Таймер для автоматического переключения на резервный фон (fallback)
      const fallbackTimer = setTimeout(() => {
        if (!isVideoReady) {
          console.warn('Video loading timeout, switching to gradient background');
          setHasVideoError(true);
          setIsLoading(false);
        }
      }, 5000); // 5 секунд на загрузку

      // 2. Слушаем изменения статуса видеоплеера
      const subscription = player.addListener('statusChange', ({ status, error }) => {
        console.log('Video status:', status);
        
        if (status === 'error') {
          console.error('Video player error:', error);
          setHasVideoError(true);
          setIsLoading(false);
          clearTimeout(fallbackTimer);
        } else if (status === 'readyToPlay') {
          console.log('Video ready to play');
          setIsVideoReady(true);
          setIsLoading(false);
          clearTimeout(fallbackTimer);
        } else if (status === 'loading') {
          setIsLoading(true);
        }
      });

      return () => {
        subscription.remove();
        clearTimeout(fallbackTimer);
      };
    }
  }, [player, isVideoReady]);

  // Если есть ошибка загрузки видео, используем анимированный градиент и возвращаем контент
  if (hasVideoError) {
    return (
      <AnimatedGradientBackground blurIntensity={blurIntensity}>
        {children}
      </AnimatedGradientBackground>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* 1. ФОН (Градиент + Индикатор загрузки) — видим, пока видео не готово */}
      {(!isVideoReady || isLoading) && (
        <View style={StyleSheet.absoluteFill}>
          <AnimatedGradientBackground blurIntensity={blurIntensity}>
            <View style={styles.loadingContainer}>
              {/* Показываем индикатор, если еще идет загрузка */}
              {isLoading && <ActivityIndicator size="large" color="#00ffff" />}
            </View>
          </AnimatedGradientBackground>
        </View>
      )}
      
      {/* 2. ВИДЕО */}
      {Platform.OS === 'web' ? (
        // Web version with HTML5 video
        <View 
          style={[
            styles.video,
            { opacity: isVideoReady && !isLoading ? 1 : 0 }
          ]}
        >
          {/* @ts-ignore */}
          <video
            ref={videoRef}
            src={require('../../assets/videos/tetris-bg.mp4')}
            autoPlay
            loop
            muted
            playsInline
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            onLoadedData={() => {
              console.log('Web video loaded successfully');
              setIsVideoReady(true);
              setIsLoading(false);
            }}
            onError={(e) => {
              console.error('Web video error:', e);
              setHasVideoError(true);
              setIsLoading(false);
            }}
          />
        </View>
      ) : (
        // Native version with expo-video
        player && (
          <VideoView
            player={player}
            style={[
              styles.video,
              { opacity: isVideoReady && !isLoading ? 1 : 0 }
            ]}
            contentFit="cover"
            nativeControls={false}
            fullscreenOptions={{ preventAutomaticFullscreen: true }}
            allowsPictureInPicture={false}
          />
        )
      )}
      
      {/* 3. СЛОЙ БЛЮРА — только поверх видео */}
      {isVideoReady && !isLoading && (
        <BlurView 
          intensity={blurIntensity} 
          style={styles.blurContainer}
          tint="dark"
        >
          {/* Дополнительный затемняющий оверлей */}
          <View style={styles.overlay} />
        </BlurView>
      )}

      {/* 4. КОНТЕНТ (CHILDREN) — всегда поверх всех фоновых элементов */}
      <View style={styles.contentContainer}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  video: {
    // Используем абсолютное позиционирование для фона
    ...StyleSheet.absoluteFillObject,
    width: width,
    height: height,
  },
  blurContainer: {
    // Блюр должен покрывать весь экран поверх видео
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    // Полупрозрачный черный оверлей для лучшей читаемости
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  contentContainer: {
    // Контейнер контента должен быть поверх всего и растянут на весь экран
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
  loadingContainer: {
    // Контейнер для индикатора загрузки должен быть по размеру AnimatedGradientBackground
    ...StyleSheet.absoluteFillObject, 
    justifyContent: 'center',
    alignItems: 'center',
  },
});

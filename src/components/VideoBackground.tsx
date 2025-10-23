import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions, ActivityIndicator } from 'react-native';
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

  // Создаем video player с настройками
  const player = useVideoPlayer(
    videoSource || require('../../assets/videos/tetris-bg.mp4'),
    (player) => {
      player.loop = true;
      player.muted = true;
      player.volume = 0;
    }
  );

  useEffect(() => {
    // Таймер для автоматического переключения на fallback
    const fallbackTimer = setTimeout(() => {
      if (!isVideoReady) {
        console.warn('Video loading timeout, switching to gradient background');
        setHasVideoError(true);
        setIsLoading(false);
      }
    }, 5000); // 5 секунд на загрузку

    // Слушаем изменения статуса
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
        player.play();
      } else if (status === 'loading') {
        setIsLoading(true);
      }
    });

    return () => {
      subscription.remove();
      clearTimeout(fallbackTimer);
    };
  }, [player, isVideoReady]);

  // Если есть ошибка загрузки видео, используем анимированный градиент
  if (hasVideoError) {
    return (
      <AnimatedGradientBackground blurIntensity={blurIntensity}>
        {children}
      </AnimatedGradientBackground>
    );
  }

  return (
    <View style={styles.container}>
      {/* Показываем градиент пока видео загружается */}
      {(!isVideoReady || isLoading) && (
        <View style={StyleSheet.absoluteFill}>
          <AnimatedGradientBackground blurIntensity={blurIntensity}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00ffff" />
            </View>
          </AnimatedGradientBackground>
        </View>
      )}
      
      {/* Фоновое видео */}
      <VideoView
        player={player}
        style={[
          styles.video,
          { opacity: isVideoReady && !isLoading ? 1 : 0 }
        ]}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />
      
      {/* Слой блюра поверх видео */}
      {isVideoReady && !isLoading && (
        <BlurView 
          intensity={blurIntensity} 
          style={styles.blurContainer}
          tint="dark"
        >
          <View style={styles.overlay} />
          <View style={styles.contentContainer}>
            {children}
          </View>
        </BlurView>
      )}

      {/* Контент показываем всегда */}
      {(!isVideoReady || isLoading) && (
        <View style={styles.contentContainer}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: width,
    height: height,
  },
  blurContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
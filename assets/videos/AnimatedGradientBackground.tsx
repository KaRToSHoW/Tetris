import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';

interface AnimatedGradientBackgroundProps {
  children?: React.ReactNode;
  blurIntensity?: number;
}

const { width, height } = Dimensions.get('window');

/**
 * Анимированный градиентный фон с эффектом блюра
 * Используется как заглушка до добавления видео файла
 * Создает эффект падающих тетрис блоков с помощью анимированных элементов
 */
export default function AnimatedGradientBackground({ 
  children, 
  blurIntensity = 60 
}: AnimatedGradientBackgroundProps) {
  // Анимация для создания динамичного эффекта
  const translateY1 = useRef(new Animated.Value(0)).current;
  const translateY2 = useRef(new Animated.Value(0)).current;
  const translateY3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Создаем бесконечную анимацию падения
    const createAnimation = (animValue: Animated.Value, duration: number, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: height,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: -100,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Запускаем три анимации с разными скоростями
    const anim1 = createAnimation(translateY1, 8000, 0);
    const anim2 = createAnimation(translateY2, 10000, 2000);
    const anim3 = createAnimation(translateY3, 12000, 4000);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Темный градиентный фон */}
      <View style={styles.gradientBackground}>
        {/* Анимированные "блоки" имитирующие падение тетромино */}
        <Animated.View 
          style={[
            styles.block,
            styles.block1,
            { transform: [{ translateY: translateY1 }] }
          ]} 
        />
        <Animated.View 
          style={[
            styles.block,
            styles.block2,
            { transform: [{ translateY: translateY2 }] }
          ]} 
        />
        <Animated.View 
          style={[
            styles.block,
            styles.block3,
            { transform: [{ translateY: translateY3 }] }
          ]} 
        />
      </View>
      
      {/* Слой блюра поверх фона */}
      <BlurView 
        intensity={blurIntensity} 
        style={styles.blurContainer}
        tint="dark"
      >
        {/* Дополнительный затемняющий слой */}
        <View style={styles.overlay} />
        
        {/* Контент поверх фона */}
        <View style={styles.contentContainer}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0a0a',
  },
  block: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 8,
    opacity: 0.3,
  },
  block1: {
    left: '15%',
    backgroundColor: '#00ffff',
    top: -100,
  },
  block2: {
    left: '50%',
    backgroundColor: '#ff00ff',
    top: -100,
  },
  block3: {
    left: '75%',
    backgroundColor: '#ffff00',
    top: -100,
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
});

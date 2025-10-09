import React, { useRef } from 'react';
import { PanGestureHandler, TapGestureHandler, State } from 'react-native-gesture-handler';
import { View, StyleSheet } from 'react-native';

interface GestureGameBoardProps {
  children: React.ReactNode;
  onMove: (direction: 'left' | 'right' | 'down') => void;
  onRotate: () => void;
  onHardDrop: () => void;
  style?: any;
}

export default function GestureGameBoard({ 
  children, 
  onMove, 
  onRotate, 
  onHardDrop, 
  style 
}: GestureGameBoardProps) {
  const tapRef = useRef<any>(null);
  const doubleTapRef = useRef<any>(null);

  const handlePanGesture = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, translationY, velocityX, velocityY } = event.nativeEvent;
      
      // Determine the primary direction based on velocity and translation
      const absX = Math.abs(translationX);
      const absY = Math.abs(translationY);
      const absVelX = Math.abs(velocityX);
      const absVelY = Math.abs(velocityY);
      
      // Minimum distance to register a swipe
      const minDistance = 30;
      const minVelocity = 500;
      
      if (absX > absY && (absX > minDistance || absVelX > minVelocity)) {
        // Horizontal swipe
        if (translationX > 0) {
          onMove('right');
        } else {
          onMove('left');
        }
      } else if (absY > absX && (absY > minDistance || absVelY > minVelocity)) {
        // Vertical swipe
        if (translationY > 0) {
          onMove('down');
        }
      }
    }
  };

  const handleSingleTap = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      onRotate();
    }
  };

  const handleDoubleTap = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      onHardDrop();
    }
  };

  return (
    <TapGestureHandler
      ref={doubleTapRef}
      onHandlerStateChange={handleDoubleTap}
      numberOfTaps={2}
    >
      <TapGestureHandler
        ref={tapRef}
        onHandlerStateChange={handleSingleTap}
        waitFor={doubleTapRef}
      >
        <PanGestureHandler
          onHandlerStateChange={handlePanGesture}
          waitFor={[tapRef, doubleTapRef]}
        >
          <View style={[styles.container, style]}>
            {children}
          </View>
        </PanGestureHandler>
      </TapGestureHandler>
    </TapGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
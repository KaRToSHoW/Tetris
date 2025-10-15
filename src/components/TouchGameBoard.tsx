import React, { useRef } from 'react';
import { View, PanResponder, StyleSheet } from 'react-native';

interface TouchGameBoardProps {
  children: React.ReactNode;
  onMove: (direction: 'left' | 'right' | 'down') => void;
  onRotate: () => void;
  onHardDrop: () => void;
  style?: any;
}

export default function TouchGameBoard({ 
  children, 
  onMove, 
  onRotate, 
  onHardDrop, 
  style 
}: TouchGameBoardProps) {
  const lastTap = useRef<number>(0);
  const touchStartTime = useRef<number>(0);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (event) => {
      touchStartTime.current = Date.now();
    },

    onPanResponderMove: (event, gestureState) => {
      const { dx, dy } = gestureState;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      
      // Only handle significant movements
      if (absX > 40 || absY > 40) {
        if (absX > absY) {
          // Horizontal swipe
          if (dx > 0) {
            (async () => { try { const sm = await import('../sounds/soundManager'); sm.playSound('shift'); } catch(e){} })();
            onMove('right');
          } else {
            (async () => { try { const sm = await import('../sounds/soundManager'); sm.playSound('shift'); } catch(e){} })();
            onMove('left');
          }
        } else {
          // Vertical swipe down
          if (dy > 0) {
            (async () => { try { const sm = await import('../sounds/soundManager'); sm.playSound('down'); } catch(e){} })();
            onMove('down');
          }
        }
      }
    },

    onPanResponderRelease: (event, gestureState) => {
      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - touchStartTime.current;
      const { dx, dy, vx, vy } = gestureState;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      
      // If it's a quick tap (not a swipe), handle as tap
      if (touchDuration < 200 && absX < 20 && absY < 20) {
        const now = Date.now();
        const timeSinceLastTap = now - lastTap.current;
        
        if (timeSinceLastTap < 300) {
          // Double tap - hard drop
          (async () => { try { const sm = await import('../sounds/soundManager'); sm.playSound('shift'); } catch(e){} })();
          onHardDrop();
          lastTap.current = 0;
        } else {
          // Single tap - rotate
          lastTap.current = now;
          setTimeout(() => {
            if (lastTap.current === now) {
              onRotate();
            }
          }, 250);
        }
      } else {
        // Handle as swipe based on velocity
        const minVelocity = 0.5;
        if (Math.abs(vx) > minVelocity || Math.abs(vy) > minVelocity) {
          if (Math.abs(vx) > Math.abs(vy)) {
            // Horizontal swipe
            if (vx > 0) {
              (async () => { try { const sm = await import('../sounds/soundManager'); sm.playSound('shift'); } catch(e){} })();
              onMove('right');
            } else {
              (async () => { try { const sm = await import('../sounds/soundManager'); sm.playSound('shift'); } catch(e){} })();
              onMove('left');
            }
          } else if (vy > 0) {
            // Vertical swipe down
            (async () => { try { const sm = await import('../sounds/soundManager'); sm.playSound('down'); } catch(e){} })();
            onMove('down');
          }
        }
      }
    },
  });

  return (
    <View style={[styles.container, style]} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
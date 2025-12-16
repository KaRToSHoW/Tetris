import React, { useEffect, useMemo, useReducer, useRef } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { BOARD_COLS, BOARD_ROWS, TETROMINOES } from '../game/constants';
import { createInitialState, getTickMs, reducer } from '../game/reducer';
import Icon, { ICON_COLORS } from './Icon';
import TouchGameBoard from './TouchGameBoard';
import { THEME } from '../styles/theme';
import type { GameSettings, Screen } from '../types/app';
import VideoBackground from './VideoBackground';

interface GameScreenProps {
  settings: GameSettings;
  onNavigate: (screen: Screen) => void;
  onGameOver: (score: number, lines: number, level: number) => void;
}

export default function GameScreen({ settings, onNavigate, onGameOver }: GameScreenProps) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameOverHandled = useRef<boolean>(false);

  const speed = useMemo(() => {
    const baseSpeed = getTickMs(state.level);
    // Adjust speed based on difficulty
    switch (settings.difficulty) {
      case 'easy': return baseSpeed * 1.5;
      case 'hard': return baseSpeed * 0.7;
      default: return baseSpeed;
    }
  }, [state.level, settings.difficulty]);

  useEffect(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (!state.isPaused && !state.isGameOver) {
      tickRef.current = setInterval(() => dispatch({ type: 'TICK' }), speed);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [speed, state.isPaused, state.isGameOver]);

  useEffect(() => {
    if (state.isGameOver && !gameOverHandled.current) {
      gameOverHandled.current = true;
      onGameOver(state.score, state.linesCleared, state.level);
    }
    // Reset the flag when game is restarted
    if (!state.isGameOver && gameOverHandled.current) {
      gameOverHandled.current = false;
    }
  }, [state.isGameOver, state.score, state.linesCleared, state.level, onGameOver]);

  const grid = useMemo(() => {
    const g: number[][] = state.board.map((row) => row.slice());
    if (state.active) {
      const { key, rotation, row, col } = state.active;
      const matrix = TETROMINOES[key][rotation];
      for (let r = 0; r < 4; r += 1) {
        for (let c = 0; c < 4; c += 1) {
          const val = matrix[r][c];
          if (!val) continue;
          const br = row + r;
          const bc = col + c;
          if (br >= 0 && br < BOARD_ROWS && bc >= 0 && bc < BOARD_COLS) {
            g[br][bc] = val;
          }
        }
      }
    }
    return g;
  }, [state.board, state.active]);

  // Sound effects: play game theme on mount, stop on unmount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const sm = await import('../sounds/soundManager');
        if (mounted) sm.playMusic('game_theme');
      } catch (e) {}
    })();
    return () => {
      mounted = false;
      (async () => {
        try {
          const sm = await import('../sounds/soundManager');
          sm.stopMusic('game_theme');
        } catch (e) {}
      })();
    };
  }, []);

  // Play 'collect' when linesCleared increases
  const prevLinesRef = useRef<number>(0);
  useEffect(() => {
    if (state.linesCleared > prevLinesRef.current) {
      (async () => {
        try {
          const sm = await import('../sounds/soundManager');
          sm.playSound('collect');
        } catch (e) {}
      })();
    }
    prevLinesRef.current = state.linesCleared;
  }, [state.linesCleared]);

  const nextPieceGrid = useMemo(() => {
    if (!state.next) return [];
    const matrix = TETROMINOES[state.next.key][0];
    return matrix;
  }, [state.next]);

  return (
    <VideoBackground>
      <SafeAreaView style={styles.container}>
      {/* Header with Menu Button */}
      <View style={styles.header}>
        <Pressable 
          style={styles.menuButton} 
          onPress={() => {
            (async () => {
              try {
                const sm = await import('../sounds/soundManager');
                sm.playSound('click');
              } catch(e){}
            })();
            onNavigate('menu');
          }}
        >
          <Icon name="home" size={18} color={THEME.colors.primary} />
          <Text style={styles.menuButtonText}>Меню</Text>
        </Pressable>
        
        <View style={styles.headerCenter}>
          <Text style={styles.levelText}>Уровень {state.level}</Text>
        </View>

        <Pressable 
          style={styles.pauseButton} 
          onPress={() => dispatch({ type: 'PAUSE_TOGGLE' })}
        >
          <Icon 
            name={state.isPaused ? 'play' : 'pause'} 
            size={18} 
            color={THEME.colors.primary} 
          />
        </Pressable>
      </View>

      {/* Game Info */}
      <View style={styles.gameInfo}>
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Счет</Text>
          <Text style={styles.infoValue}>{state.score.toLocaleString()}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Линии</Text>
          <Text style={styles.infoValue}>{state.linesCleared}</Text>
        </View>
      </View>

      {/* Main Game Area - Optimized for mobile */}
      <View style={styles.gameArea}>
        {/* Game Board - Takes more space */}
        {settings.controlMode === 'swipes' ? (
          <TouchGameBoard
            style={styles.board}
            onMove={(dir) => dispatch({ type: 'MOVE', dir })}
            onRotate={() => dispatch({ type: 'ROTATE', dir: 1 })}
            onHardDrop={() => dispatch({ type: 'HARD_DROP' })}
          >
            {grid.map((row, rIdx) => (
              <View key={rIdx} style={styles.row}>
                {row.map((cell, cIdx) => (
                  <View 
                    key={cIdx} 
                    style={[
                      styles.cell, 
                      settings.showGrid && styles.cellWithGrid,
                      (styles as any)[`cell${cell}`]
                    ]} 
                  />
                ))}
              </View>
            ))}
          </TouchGameBoard>
        ) : (
          <View style={styles.board}>
            {grid.map((row, rIdx) => (
              <View key={rIdx} style={styles.row}>
                {row.map((cell, cIdx) => (
                  <View 
                    key={cIdx} 
                    style={[
                      styles.cell, 
                      settings.showGrid && styles.cellWithGrid,
                      (styles as any)[`cell${cell}`]
                    ]} 
                  />
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Next Piece Preview - Beside board */}
        <View style={styles.nextPieceContainer}>
          <Text style={styles.nextPieceLabel}>Следующая</Text>
          <View style={styles.nextPieceGrid}>
            {nextPieceGrid.map((row, rIdx) => (
              <View key={rIdx} style={styles.nextPieceRow}>
                {row.map((cell, cIdx) => (
                  <View 
                    key={cIdx} 
                    style={[
                      styles.nextPieceCell, 
                      cell > 0 && (styles as any)[`cell${cell}`]
                    ]} 
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Game Controls - AMPRTOK Layout */}
      {settings.controlMode === 'buttons' ? (
        <View style={styles.controlsContainer}>
          {/* Top Row - Fast Drop Button */}
          <View style={styles.topControlRow}>
            <View style={styles.spacerLeft} />
            <Pressable 
              style={[styles.btn, styles.fastDropBtn]} 
              onPress={() => {
                (async () => {
                  try {
                    const sm = await import('../sounds/soundManager');
                    sm.playSound('shift');
                  } catch(e){}
                })();
                dispatch({ type: 'HARD_DROP' });
              }}
            >
              <Icon name="drop" size={24} color={THEME.colors.warning} />
            </Pressable>
            <View style={styles.spacerRight} />
          </View>

          {/* Bottom Row - Movement + Rotation */}
          <View style={styles.bottomControlRow}>
            {/* Left side - Movement buttons (3 buttons) */}
            <View style={styles.movementGroup}>
              {/* Left button */}
              <Pressable 
                style={[styles.btn, styles.moveBtn, styles.leftBtn]} 
                onPress={() => {
                  (async () => {
                    try {
                      const sm = await import('../sounds/soundManager');
                      sm.playSound('shift');
                    } catch(e){}
                  })();
                  dispatch({ type: 'MOVE', dir: 'left' });
                }}
              >
                <Icon name="left" size={24} color={THEME.colors.success} />
              </Pressable>
              
              {/* Down button */}
              <Pressable 
                style={[styles.btn, styles.moveBtn, styles.downBtn]} 
                onPress={() => {
                  (async () => {
                    try {
                      const sm = await import('../sounds/soundManager');
                      sm.playSound('down');
                    } catch(e){}
                  })();
                  dispatch({ type: 'MOVE', dir: 'down' });
                }}
              >
                <Icon name="down" size={24} color={THEME.colors.primary} />
              </Pressable>
              
              {/* Right button */}
              <Pressable 
                style={[styles.btn, styles.moveBtn, styles.rightBtn]} 
                onPress={() => {
                  (async () => {
                    try {
                      const sm = await import('../sounds/soundManager');
                      sm.playSound('shift');
                    } catch(e){}
                  })();
                  dispatch({ type: 'MOVE', dir: 'right' });
                }}
              >
                <Icon name="right" size={24} color={THEME.colors.success} />
              </Pressable>
            </View>

            {/* Right side - Rotation button (large circle) */}
            <Pressable 
              style={[styles.btn, styles.rotateBtn]} 
              onPress={() => dispatch({ type: 'ROTATE', dir: 1 })}
            >
              <Icon name="rotate" size={28} color={THEME.colors.secondary} />
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Управление:</Text>
          <Text style={styles.instructionsText}>• Свайп влево/вправо: движение</Text>
          <Text style={styles.instructionsText}>• Свайп вниз: ускорение</Text>
          <Text style={styles.instructionsText}>• Касание: поворот</Text>
          <Text style={styles.instructionsText}>• Двойное касание: сброс</Text>
        </View>
      )}

      {/* Pause Overlay */}
      {state.isPaused && (
        <View style={styles.overlay}>
          <View style={styles.pauseOverlay}>
            <Text style={styles.pauseTitle}>ПАУЗА</Text>
            
            <View style={styles.pauseMenuContainer}>
              <Pressable 
                style={[styles.pauseMenuItem, styles.resumeBtn]} 
                onPress={() => { (async () => { try { const sm = await import('../sounds/soundManager'); sm.playSound('click'); } catch(e){} })(); dispatch({ type: 'PAUSE_TOGGLE' }); }}
              >
                <Icon name="play" size={18} color={ICON_COLORS.secondary} style={{ marginRight: 12 }} />
                <Text style={styles.pauseMenuText}>Продолжить игру</Text>
              </Pressable>
              
              {/* Settings removed from pause menu per design request */}
              
              <Pressable 
                style={styles.pauseMenuItem} 
                onPress={() => { (async () => { try { const sm = await import('../sounds/soundManager'); sm.playSound('click'); } catch(e){} })(); dispatch({ type: 'RESTART' }); }}
              >
                <Icon name="restart" size={18} color={ICON_COLORS.secondary} style={{ marginRight: 12 }} />
                <Text style={styles.pauseMenuText}>Новая игра</Text>
              </Pressable>
              
              <Pressable 
                style={styles.pauseMenuItem} 
                onPress={() => { (async () => { try { const sm = await import('../sounds/soundManager'); sm.playSound('click'); } catch(e){} })(); dispatch({ type: 'PAUSE_TOGGLE' }); onNavigate('menu'); }}
              >
                <Icon name="home" size={18} color={ICON_COLORS.secondary} style={{ marginRight: 12 }} />
                <Text style={styles.pauseMenuText}>Главное меню</Text>
              </Pressable>
            </View>
            
            <Text style={styles.pauseSubtitle}>Нажмите любую опцию или кнопку паузы</Text>
          </View>
        </View>
      )}

      {/* Game Over Overlay */}
      {state.isGameOver && (
        <View style={styles.overlay}>
          <View style={styles.gameOverOverlay}>
            <Text style={styles.gameOverTitle}>ИГРА ОКОНЧЕНА</Text>
            <View style={styles.finalStats}>
              <Text style={styles.finalStatText}>Финальный счет: {state.score.toLocaleString()}</Text>
              <Text style={styles.finalStatText}>Линий очищено: {state.linesCleared}</Text>
              <Text style={styles.finalStatText}>Достигнутый уровень: {state.level}</Text>
            </View>
            <View style={styles.gameOverButtons}>
              <Pressable style={styles.gameOverBtn} onPress={() => { (async () => { try { const sm = await import('../sounds/soundManager'); sm.playSound('click'); } catch(e){} })(); dispatch({ type: 'RESTART' }); }}>
                <Icon name="restart" size={16} color={ICON_COLORS.text} style={{ marginRight: 8 }} />
                <Text style={styles.gameOverBtnText}>Играть снова</Text>
              </Pressable>
              <Pressable style={[styles.gameOverBtn, styles.menuBtn]} onPress={() => { (async () => { try { const sm = await import('../sounds/soundManager'); sm.playSound('click'); } catch(e){} })(); onNavigate('menu'); }}>
                <Icon name="home" size={16} color={ICON_COLORS.text} style={{ marginRight: 8 }} />
                <Text style={styles.gameOverBtnText}>В меню</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
    </VideoBackground>
  );
}

const CELL = 16;

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 255, 0.2)',
    backgroundColor: THEME.colors.background,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.md,
    minWidth: 64,
    justifyContent: 'center',
  },
  menuButtonText: {
    color: THEME.colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: THEME.spacing.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  levelText: {
    color: THEME.colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  pauseButton: {
    backgroundColor: 'rgba(255, 0, 255, 0.1)',
    borderWidth: 1,
    borderColor: THEME.colors.secondary,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameInfo: { 
    flexDirection: 'row', 
    justifyContent: 'space-around',
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    backgroundColor: THEME.colors.background,
  },
  infoBlock: {
    alignItems: 'center',
  },
  infoLabel: {
    color: THEME.colors.disabled,
    fontSize: 12,
    marginBottom: THEME.spacing.xs,
  },
  infoValue: {
    color: THEME.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  gameArea: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    gap: THEME.spacing.md,
  },
  nextPieceContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  nextPieceLabel: {
    color: THEME.colors.disabled,
    fontSize: 11,
    marginBottom: THEME.spacing.sm,
    textAlign: 'center',
  },
  nextPieceGrid: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.3)',
  },
  nextPieceRow: {
    flexDirection: 'row',
  },
  nextPieceCell: {
    width: CELL * 0.7,
    height: CELL * 0.7,
    backgroundColor: THEME.colors.background,
    margin: 1,
    borderRadius: 2,
  },
  board: { 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    padding: 4, 
    borderRadius: THEME.borderRadius.md,
    borderWidth: 2,
    borderColor: THEME.colors.primary,
    flex: 1,
  },
  row: { 
    flexDirection: 'row' 
  },
  cell: { 
    width: CELL, 
    height: CELL, 
    backgroundColor: THEME.colors.background, 
    margin: 1, 
    borderRadius: 2,
  },
  cellWithGrid: {
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cell0: { backgroundColor: THEME.colors.background },
  cell1: { backgroundColor: THEME.colors.primary },
  cell2: { backgroundColor: '#ffd500' },
  cell3: { backgroundColor: THEME.colors.secondary },
  cell4: { backgroundColor: THEME.colors.success },
  cell5: { backgroundColor: THEME.colors.error },
  cell6: { backgroundColor: THEME.colors.info },
  cell7: { backgroundColor: THEME.colors.warning },
  controls: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 255, 255, 0.2)',
  },
  controlsContainer: {
    backgroundColor: THEME.colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 255, 255, 0.2)',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.lg,
    gap: THEME.spacing.lg,
  },
  topControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 80,
  },
  bottomControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 80,
  },
  spacerLeft: {
    flex: 1,
  },
  spacerRight: {
    flex: 1,
  },
  movementGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    flex: 1,
  },
  leftControls: {
    flexDirection: 'column',
    gap: THEME.spacing.sm,
  },
  rightControls: {
    flexDirection: 'column',
    gap: THEME.spacing.sm,
  },
  btn: { 
    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
    minHeight: 50,
    width: 56,
    height: 56,
  },
  moveBtn: {
    backgroundColor: 'rgba(0, 255, 106, 0.1)',
    borderColor: THEME.colors.success,
    width: 56,
    height: 56,
  },
  leftBtn: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  downBtn: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderColor: THEME.colors.primary,
    width: 60,
    height: 60,
    marginHorizontal: -1,
  },
  rightBtn: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  rotateBtn: {
    backgroundColor: 'rgba(170, 0, 255, 0.1)',
    borderColor: THEME.colors.secondary,
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  fastDropBtn: {
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    borderColor: THEME.colors.warning,
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  dropBtn: {
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    borderColor: THEME.colors.warning,
  },
  instructionsContainer: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.2)',
  },
  instructionsTitle: {
    color: THEME.colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: THEME.spacing.sm,
  },
  instructionsText: {
    color: THEME.colors.text,
    fontSize: 12,
    marginBottom: THEME.spacing.xs,
    lineHeight: 18,
  },
  overlay: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    top: 0, 
    bottom: 0, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  pauseOverlay: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.xl,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 2,
    borderColor: THEME.colors.primary,
    alignItems: 'center',
  },
  pauseTitle: { 
    color: THEME.colors.primary, 
    fontSize: 32, 
    fontWeight: 'bold',
    marginBottom: THEME.spacing.md,
  },
  pauseSubtitle: {
    color: THEME.colors.disabled,
    fontSize: 14,
    textAlign: 'center',
    marginTop: THEME.spacing.lg,
  },
  pauseMenuContainer: {
    marginVertical: THEME.spacing.xl,
    width: '100%',
  },
  pauseMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  resumeBtn: {
    backgroundColor: 'rgba(0, 255, 255, 0.15)',
    borderColor: THEME.colors.primary,
  },
  pauseMenuText: {
    color: THEME.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  gameOverOverlay: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.xl,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 2,
    borderColor: THEME.colors.error,
    alignItems: 'center',
    maxWidth: '90%',
  },
  gameOverTitle: { 
    color: THEME.colors.error, 
    fontSize: 28, 
    fontWeight: 'bold',
    marginBottom: THEME.spacing.lg,
  },
  finalStats: {
    marginBottom: THEME.spacing.xl,
    alignItems: 'center',
  },
  finalStatText: {
    color: THEME.colors.text,
    fontSize: 16,
    marginBottom: THEME.spacing.sm,
  },
  gameOverButtons: {
    flexDirection: 'row',
    columnGap: THEME.spacing.md,
  },
  gameOverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
  },
  menuBtn: {
    backgroundColor: THEME.colors.disabled,
  },
  gameOverBtnText: {
    color: THEME.colors.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
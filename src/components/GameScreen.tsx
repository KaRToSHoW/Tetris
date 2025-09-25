import React, { useEffect, useMemo, useReducer, useRef } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { BOARD_COLS, BOARD_ROWS, TETROMINOES } from '../game/constants';
import { createInitialState, getTickMs, reducer } from '../game/reducer';
import Icon, { ICON_COLORS } from './Icon';
import TouchGameBoard from './TouchGameBoard';
import type { GameSettings, Screen } from '../types/app';

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

  const nextPieceGrid = useMemo(() => {
    if (!state.next) return [];
    const matrix = TETROMINOES[state.next.key][0];
    return matrix;
  }, [state.next]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar with Pause (left) and Level (center) */}
      <View style={styles.topBar}>
        <Pressable style={styles.pauseButton} onPress={() => dispatch({ type: 'PAUSE_TOGGLE' })}>
          <Icon 
            name={state.isPaused ? 'play' : 'pause'} 
            size={18} 
            color={ICON_COLORS.primary} 
          />
        </Pressable>
        
        <View style={styles.topCenterInfo}>
          <Text style={styles.levelText}>Уровень {state.level}</Text>
        </View>
        
        <View style={styles.spacer} />
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

      {/* Main Game Area */}
      <View style={styles.gameArea}>
        {/* Next Piece Preview */}
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
                      cell > 0 && styles[`cell${cell}` as const] as any
                    ]} 
                  />
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Game Board */}
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
                      styles[`cell${cell}` as const] as any
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
                      styles[`cell${cell}` as const] as any
                    ]} 
                  />
                ))}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Game Controls or Instructions */}
      {settings.controlMode === 'buttons' ? (
        <View style={styles.controls}>
          {/* Top Row - Movement */}
          <View style={styles.controlRow}>
            <Pressable 
              style={[styles.btn, styles.moveBtn]} 
              onPress={() => dispatch({ type: 'MOVE', dir: 'left' })}
            >
              <Icon name="left" size={24} color={ICON_COLORS.secondary} />
              <Text style={styles.btnLabel}>Лево</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.btn, styles.moveBtn]} 
              onPress={() => dispatch({ type: 'MOVE', dir: 'right' })}
            >
              <Icon name="right" size={24} color={ICON_COLORS.secondary} />
              <Text style={styles.btnLabel}>Право</Text>
            </Pressable>
          </View>
          
          {/* Middle Row - Actions */}
          <View style={styles.controlRow}>
            <Pressable 
              style={[styles.btn, styles.rotateBtn]} 
              onPress={() => dispatch({ type: 'ROTATE', dir: 1 })}
            >
              <Icon name="rotate" size={24} color={ICON_COLORS.secondary} />
              <Text style={styles.btnLabel}>Поворот</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.btn, styles.downBtn]} 
              onPress={() => dispatch({ type: 'MOVE', dir: 'down' })}
            >
              <Icon name="down" size={24} color={ICON_COLORS.secondary} />
              <Text style={styles.btnLabel}>Вниз</Text>
            </Pressable>
          </View>
          
          {/* Bottom Row - Drop */}
          <View style={styles.controlRow}>
            <Pressable 
              style={[styles.btn, styles.dropBtn]} 
              onPress={() => dispatch({ type: 'HARD_DROP' })}
            >
              <Icon name="drop" size={28} color={ICON_COLORS.secondary} />
              <Text style={styles.btnLabel}>Сброс</Text>
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

      {/* Bottom Toolbar */}
      <View style={styles.bottomToolbar}>
        <Pressable style={styles.toolbarBtn} onPress={() => onNavigate('menu')}>
          <Icon name="home" size={14} color={ICON_COLORS.secondary} style={{ marginRight: 8 }} />
          <Text style={styles.toolbarBtnText}>Меню</Text>
        </Pressable>
        <Pressable style={styles.toolbarBtn} onPress={() => dispatch({ type: 'RESTART' })}>
          <Icon name="restart" size={14} color={ICON_COLORS.secondary} style={{ marginRight: 8 }} />
          <Text style={styles.toolbarBtnText}>Заново</Text>
        </Pressable>
      </View>

      {/* Pause Overlay */}
      {state.isPaused && (
        <View style={styles.overlay}>
          <View style={styles.pauseOverlay}>
            <Text style={styles.pauseTitle}>ПАУЗА</Text>
            
            <View style={styles.pauseMenuContainer}>
              <Pressable 
                style={[styles.pauseMenuItem, styles.resumeBtn]} 
                onPress={() => dispatch({ type: 'PAUSE_TOGGLE' })}
              >
                <Icon name="play" size={18} color={ICON_COLORS.secondary} style={{ marginRight: 12 }} />
                <Text style={styles.pauseMenuText}>Продолжить игру</Text>
              </Pressable>
              
              <Pressable 
                style={styles.pauseMenuItem} 
                onPress={() => {
                  dispatch({ type: 'PAUSE_TOGGLE' });
                  onNavigate('settings');
                }}
              >
                <Icon name="gear" size={18} color={ICON_COLORS.secondary} style={{ marginRight: 12 }} />
                <Text style={styles.pauseMenuText}>Настройки</Text>
              </Pressable>
              
              <Pressable 
                style={styles.pauseMenuItem} 
                onPress={() => dispatch({ type: 'RESTART' })}
              >
                <Icon name="restart" size={18} color={ICON_COLORS.secondary} style={{ marginRight: 12 }} />
                <Text style={styles.pauseMenuText}>Новая игра</Text>
              </Pressable>
              
              <Pressable 
                style={styles.pauseMenuItem} 
                onPress={() => {
                  dispatch({ type: 'PAUSE_TOGGLE' });
                  onNavigate('menu');
                }}
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
              <Pressable style={styles.gameOverBtn} onPress={() => dispatch({ type: 'RESTART' })}>
                <Icon name="restart" size={16} color={ICON_COLORS.text} style={{ marginRight: 8 }} />
                <Text style={styles.gameOverBtnText}>Играть снова</Text>
              </Pressable>
              <Pressable style={[styles.gameOverBtn, styles.menuBtn]} onPress={() => onNavigate('menu')}>
                <Icon name="home" size={16} color={ICON_COLORS.text} style={{ marginRight: 8 }} />
                <Text style={styles.gameOverBtnText}>В меню</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const CELL = 18;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0a0a0a', 
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  pauseButton: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenterInfo: {
    alignItems: 'center',
  },
  levelText: {
    color: '#00ffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  spacer: {
    minWidth: 44,
  },
  gameInfo: { 
    flexDirection: 'row', 
    justifyContent: 'space-around',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  infoBlock: {
    alignItems: 'center',
  },
  infoLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 5,
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  gameArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  nextPieceContainer: {
    marginRight: 20,
    alignItems: 'center',
  },
  nextPieceLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  nextPieceGrid: {
    backgroundColor: '#111',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  nextPieceRow: {
    flexDirection: 'row',
  },
  nextPieceCell: {
    width: CELL * 0.8,
    height: CELL * 0.8,
    backgroundColor: '#1b1b1b',
    margin: 0.5,
    borderRadius: 2,
  },
  board: { 
    backgroundColor: '#111', 
    padding: 4, 
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#333',
  },
  row: { 
    flexDirection: 'row' 
  },
  cell: { 
    width: CELL, 
    height: CELL, 
    backgroundColor: '#1b1b1b', 
    margin: 1, 
    borderRadius: 2,
  },
  cellWithGrid: {
    borderWidth: 0.5,
    borderColor: '#333',
  },
  cell0: { backgroundColor: '#1b1b1b' },
  cell1: { backgroundColor: '#00ffff' },
  cell2: { backgroundColor: '#ffd500' },
  cell3: { backgroundColor: '#aa00ff' },
  cell4: { backgroundColor: '#00ff6a' },
  cell5: { backgroundColor: '#ff004d' },
  cell6: { backgroundColor: '#2266ff' },
  cell7: { backgroundColor: '#ff8c00' },
  controls: { 
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  controlRow: {
    flexDirection: 'row', 
    columnGap: 12, 
    marginBottom: 12,
    justifyContent: 'center',
  },
  btn: { 
    backgroundColor: '#1a1a1a', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  moveBtn: {
    backgroundColor: '#2a4d3a',
    borderColor: '#00ff6a',
  },
  rotateBtn: {
    backgroundColor: '#4d2a4d',
    borderColor: '#aa00ff',
  },
  downBtn: {
    backgroundColor: '#2a4d4d',
    borderColor: '#00ffff',
  },
  dropBtn: {
    backgroundColor: '#4d3a2a',
    borderColor: '#ff8c00',
    minWidth: 120,
    paddingVertical: 16,
  },
  btnLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  instructionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  instructionsTitle: {
    color: '#00ffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instructionsText: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 5,
    lineHeight: 20,
  },
  bottomToolbar: { 
    flexDirection: 'row', 
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  toolbarBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#555',
  },
  toolbarBtnText: { 
    color: 'white', 
    fontSize: 14,
    fontWeight: '600',
  },
  overlay: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    top: 0, 
    bottom: 0, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  pauseOverlay: {
    backgroundColor: '#1a1a1a',
    padding: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#00ffff',
    alignItems: 'center',
  },
  pauseTitle: { 
    color: '#00ffff', 
    fontSize: 32, 
    fontWeight: 'bold',
    marginBottom: 10,
  },
  pauseSubtitle: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  pauseMenuContainer: {
    marginVertical: 25,
    width: '100%',
  },
  pauseMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  resumeBtn: {
    backgroundColor: '#00ffff20',
    borderColor: '#00ffff',
  },
  pauseMenuText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  gameOverOverlay: {
    backgroundColor: '#1a1a1a',
    padding: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#ff4444',
    alignItems: 'center',
    maxWidth: '90%',
  },
  gameOverTitle: { 
    color: '#ff4444', 
    fontSize: 28, 
    fontWeight: 'bold',
    marginBottom: 20,
  },
  finalStats: {
    marginBottom: 25,
    alignItems: 'center',
  },
  finalStatText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 5,
  },
  gameOverButtons: {
    flexDirection: 'row',
    columnGap: 15,
  },
  gameOverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00ffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  menuBtn: {
    backgroundColor: '#666',
  },
  gameOverBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
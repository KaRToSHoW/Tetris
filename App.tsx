import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useReducer, useRef } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { BOARD_COLS, BOARD_ROWS, TETROMINOES } from './src/game/constants';
import { createInitialState, getTickMs, reducer } from './src/game/reducer';

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const tickRef = useRef<NodeJS.Timer | null>(null);

  const speed = useMemo(() => getTickMs(state.level), [state.level]);

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.hud}>
        <Text style={styles.hudText}>Счет: {state.score}</Text>
        <Text style={styles.hudText}>Линии: {state.linesCleared}</Text>
        <Text style={styles.hudText}>Уровень: {state.level}</Text>
      </View>
      <View style={styles.board}>
        {grid.map((row, rIdx) => (
          <View key={rIdx} style={styles.row}>
            {row.map((cell, cIdx) => (
              <View key={cIdx} style={[styles.cell, styles[`cell${cell}` as const] as any]} />
            ))}
          </View>
        ))}
      </View>
      <View style={styles.controls}>
        <Pressable style={styles.btn} onPress={() => dispatch({ type: 'MOVE', dir: 'left' })}><Text style={styles.btnText}>◀</Text></Pressable>
        <Pressable style={styles.btn} onPress={() => dispatch({ type: 'ROTATE', dir: 1 })}><Text style={styles.btnText}>⟳</Text></Pressable>
        <Pressable style={styles.btn} onPress={() => dispatch({ type: 'MOVE', dir: 'right' })}><Text style={styles.btnText}>▶</Text></Pressable>
        <Pressable style={styles.btn} onPress={() => dispatch({ type: 'HARD_DROP' })}><Text style={styles.btnText}>⤓</Text></Pressable>
        <Pressable style={styles.btn} onPress={() => dispatch({ type: 'MOVE', dir: 'down' })}><Text style={styles.btnText}>▼</Text></Pressable>
      </View>
      <View style={styles.toolbar}>
        <Pressable style={styles.smallBtn} onPress={() => dispatch({ type: 'PAUSE_TOGGLE' })}><Text style={styles.smallBtnText}>{state.isPaused ? '▶' : '⏸'}</Text></Pressable>
        <Pressable style={styles.smallBtn} onPress={() => dispatch({ type: 'RESTART' })}><Text style={styles.smallBtnText}>⟲</Text></Pressable>
      </View>
      {state.isGameOver && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>Game Over</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const CELL = 20;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 16 },
  hud: { flexDirection: 'row', columnGap: 12, marginBottom: 8 },
  hudText: { color: 'white', fontSize: 16 },
  board: { width: CELL * BOARD_COLS + 8, backgroundColor: '#111', padding: 4, borderRadius: 6 },
  row: { flexDirection: 'row' },
  cell: { width: CELL, height: CELL, backgroundColor: '#1b1b1b', margin: 1, borderRadius: 3 },
  cell0: { backgroundColor: '#1b1b1b' },
  cell1: { backgroundColor: '#00ffff' },
  cell2: { backgroundColor: '#ffd500' },
  cell3: { backgroundColor: '#aa00ff' },
  cell4: { backgroundColor: '#00ff6a' },
  cell5: { backgroundColor: '#ff004d' },
  cell6: { backgroundColor: '#2266ff' },
  cell7: { backgroundColor: '#ff8c00' },
  controls: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8, rowGap: 8, marginTop: 12, justifyContent: 'center' },
  btn: { backgroundColor: '#222', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  btnText: { color: 'white', fontSize: 20 },
  toolbar: { flexDirection: 'row', columnGap: 8, marginTop: 8 },
  smallBtn: { backgroundColor: '#333', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  smallBtnText: { color: 'white', fontSize: 16 },
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  overlayText: { color: 'white', fontSize: 28, fontWeight: '600' },
});

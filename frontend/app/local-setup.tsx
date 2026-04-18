import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useGameStore, WIN_MODE_LABELS, WIN_THRESHOLDS } from '../store/gameStore';
import { Ionicons } from '@expo/vector-icons';

const PLAYER_COLORS = ['#2196F3', '#e91e63', '#4CAF50', '#ff9800', '#9C27B0'];

export default function LocalSetup() {
  const { winMode, setPlayerNames, setMode, resetGame } = useGameStore();
  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState(['', '', '', '', '']);

  const updateName = (index: number, name: string) => {
    const next = [...names];
    next[index] = name;
    setNames(next);
  };

  const startGame = () => {
    const finalNames = names.slice(0, playerCount).map((n, i) => n.trim() || `Player ${i + 1}`);
    setPlayerNames.apply(null, finalNames);
    setMode('local');
    resetGame();
    router.push('/game');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn} testID="back-btn">
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>LOCAL GAME</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Mode Info */}
          <View style={styles.modeTag}>
            <Text style={styles.modeTagText}>{WIN_MODE_LABELS[winMode]} — {WIN_THRESHOLDS[winMode]} pts</Text>
          </View>

          {/* Player Count */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Number of Players</Text>
            <View style={styles.countRow}>
              {[2, 3, 4, 5].map((n) => (
                <Pressable
                  key={n}
                  testID={`count-${n}`}
                  style={[styles.countBtn, playerCount === n && styles.countBtnActive]}
                  onPress={() => setPlayerCount(n)}
                >
                  <Text style={[styles.countText, playerCount === n && styles.countTextActive]}>{n}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Player Names */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Player Names</Text>
            {Array.from({ length: playerCount }).map((_, i) => (
              <View key={i} style={styles.inputWrapper}>
                <View style={[styles.playerDot, { backgroundColor: PLAYER_COLORS[i] }]} />
                <TextInput
                  testID={`player-${i}-input`}
                  style={styles.input}
                  value={names[i]}
                  onChangeText={(t) => updateName(i, t)}
                  placeholder={`Player ${i + 1}`}
                  placeholderTextColor="#555"
                />
              </View>
            ))}
          </View>

          {/* Start Button */}
          <Pressable testID="start-game-btn" style={styles.startBtn} onPress={startGame}>
            <Ionicons name="dice" size={24} color="#fff" />
            <Text style={styles.startBtnText}>Start Game</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#111122', borderBottomWidth: 1, borderBottomColor: '#222' },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  modeTag: { alignSelf: 'center', backgroundColor: '#e91e63', paddingHorizontal: 16, paddingVertical: 5, borderRadius: 12, marginBottom: 24 },
  modeTagText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  countRow: { flexDirection: 'row', gap: 10 },
  countBtn: { flex: 1, backgroundColor: '#161625', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 2, borderColor: '#222' },
  countBtnActive: { borderColor: '#2196F3', backgroundColor: '#2196F318' },
  countText: { fontSize: 24, fontWeight: '800', color: '#555' },
  countTextActive: { color: '#2196F3' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161625', borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#222', marginBottom: 10 },
  playerDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#fff' },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4CAF50', paddingVertical: 18, borderRadius: 16, gap: 10, marginTop: 8 },
  startBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },
});

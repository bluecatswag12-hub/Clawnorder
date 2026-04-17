import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useGameStore, WinMode, WIN_THRESHOLDS, WIN_MODE_LABELS } from '../store/gameStore';
import { Ionicons } from '@expo/vector-icons';

const WIN_MODES: WinMode[] = ['noobs', 'ogs', 'panthers'];
const WIN_COLORS: Record<WinMode, string> = {
  noobs: '#4CAF50',
  ogs: '#2196F3',
  panthers: '#e91e63',
};
const WIN_ICONS: Record<WinMode, string> = {
  noobs: 'happy',
  ogs: 'flame',
  panthers: 'trophy',
};

export default function Index() {
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const { setPlayerNames, setMode, setWinMode, winMode, resetGame } = useGameStore();

  const startLocalGame = () => {
    setPlayerNames(player1Name || 'Player 1', player2Name || 'Player 2');
    setMode('local');
    resetGame();
    router.push('/game');
  };

  const startOnlineGame = () => {
    setPlayerNames(player1Name || 'Player 1', 'Opponent');
    setMode('online');
    resetGame();
    router.push('/online-lobby');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <Ionicons name="cube" size={36} color="#e91e63" />
              <Ionicons name="cube" size={36} color="#2196F3" />
              <Ionicons name="cube" size={36} color="#4CAF50" />
            </View>
            <Text style={styles.title}>DICE RUSH</Text>
            <Text style={styles.subtitle}>Roll. Score. Win.</Text>
          </View>

          {/* Win Mode Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Game Mode</Text>
            <View style={styles.modeRow}>
              {WIN_MODES.map((mode) => (
                <Pressable
                  key={mode}
                  testID={`mode-${mode}`}
                  style={[
                    styles.modeCard,
                    winMode === mode && { borderColor: WIN_COLORS[mode], backgroundColor: `${WIN_COLORS[mode]}18` },
                  ]}
                  onPress={() => setWinMode(mode)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={WIN_ICONS[mode] as any}
                    size={24}
                    color={winMode === mode ? WIN_COLORS[mode] : '#555'}
                  />
                  <Text style={[styles.modeName, winMode === mode && { color: WIN_COLORS[mode] }]}>
                    {WIN_MODE_LABELS[mode]}
                  </Text>
                  <Text style={[styles.modeScore, winMode === mode && { color: WIN_COLORS[mode] }]}>
                    {WIN_THRESHOLDS[mode]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Player Names */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Player Names</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputWrapper}>
                <View style={[styles.playerDot, { backgroundColor: '#2196F3' }]} />
                <TextInput
                  testID="player1-input"
                  style={styles.input}
                  value={player1Name}
                  onChangeText={setPlayer1Name}
                  placeholder="Player 1"
                  placeholderTextColor="#555"
                />
              </View>
              <View style={styles.inputWrapper}>
                <View style={[styles.playerDot, { backgroundColor: '#e91e63' }]} />
                <TextInput
                  testID="player2-input"
                  style={styles.input}
                  value={player2Name}
                  onChangeText={setPlayer2Name}
                  placeholder="Player 2"
                  placeholderTextColor="#555"
                />
              </View>
            </View>
          </View>

          {/* Scoring Rules */}
          <View style={styles.rulesCard}>
            <Text style={styles.rulesTitle}>Scoring</Text>
            <View style={styles.rulesGrid}>
              <View style={styles.ruleCol}>
                <Text style={styles.ruleRow}>
                  <Text style={styles.ruleVal}>1</Text> = 100
                </Text>
                <Text style={styles.ruleRow}>
                  <Text style={styles.ruleVal}>5</Text> = 50
                </Text>
                <Text style={styles.ruleRow}>
                  <Text style={styles.ruleVal}>111</Text> = 1000
                </Text>
                <Text style={styles.ruleRow}>
                  <Text style={styles.ruleVal}>555</Text> = 500
                </Text>
              </View>
              <View style={styles.ruleCol}>
                <Text style={styles.ruleRow}>
                  <Text style={styles.ruleVal}>222</Text> = 200
                </Text>
                <Text style={styles.ruleRow}>
                  <Text style={styles.ruleVal}>12345</Text> = 500
                </Text>
                <Text style={styles.ruleRow}>
                  <Text style={styles.ruleVal}>23456</Text> = 750
                </Text>
                <Text style={styles.ruleRow}>
                  <Text style={styles.ruleVal}>123456</Text> = 1500
                </Text>
              </View>
            </View>
            <Text style={styles.ruleNote}>Extra dice in a set = ×2 multiplier each</Text>
            <Text style={styles.ruleNote}>Clear all dice = Hot Hand bonus roll!</Text>
          </View>

          {/* Game Buttons */}
          <View style={styles.buttonsContainer}>
            <Pressable
              testID="local-game-btn"
              style={[styles.gameBtn, { backgroundColor: WIN_COLORS[winMode] }]}
              onPress={startLocalGame}
              activeOpacity={0.8}
            >
              <Ionicons name="people" size={26} color="#fff" />
              <View style={styles.btnTextCol}>
                <Text style={styles.btnTitle}>Local Game</Text>
                <Text style={styles.btnSub}>Same device</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.6)" />
            </Pressable>

            <Pressable
              testID="online-game-btn"
              style={[styles.gameBtn, { backgroundColor: '#333' }]}
              onPress={startOnlineGame}
            >
              <Ionicons name="globe" size={26} color="#fff" />
              <View style={styles.btnTextCol}>
                <Text style={styles.btnTitle}>Online Game</Text>
                <Text style={styles.btnSub}>Room code</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.6)" />
            </Pressable>

            <Pressable
              testID="leaderboard-btn"
              style={[styles.gameBtn, { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#e91e63' }]}
              onPress={() => router.push('/leaderboard')}
            >
              <Ionicons name="trophy" size={26} color="#e91e63" />
              <View style={styles.btnTextCol}>
                <Text style={styles.btnTitle}>Leaderboard</Text>
                <Text style={[styles.btnSub, { color: '#e91e63' }]}>Daily & All-Time</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#e91e6366" />
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d1a',
  },
  flex: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  logoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeCard: {
    flex: 1,
    backgroundColor: '#161625',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#222',
  },
  modeName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    marginTop: 6,
  },
  modeScore: {
    fontSize: 18,
    fontWeight: '800',
    color: '#444',
    marginTop: 2,
  },
  inputRow: {
    gap: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161625',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#222',
  },
  playerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
  },
  rulesCard: {
    backgroundColor: '#161625',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  rulesGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  ruleCol: {
    flex: 1,
    gap: 6,
  },
  ruleRow: {
    fontSize: 13,
    color: '#888',
  },
  ruleVal: {
    fontWeight: '700',
    color: '#ccc',
  },
  ruleNote: {
    fontSize: 11,
    color: '#e91e63',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  buttonsContainer: {
    gap: 12,
  },
  gameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 14,
  },
  btnTextCol: {
    flex: 1,
  },
  btnTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  btnSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
});

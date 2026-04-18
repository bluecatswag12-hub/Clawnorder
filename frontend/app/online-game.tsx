import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Dice } from '../components/Dice';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { WinnerModal } from '../components/WinnerModal';
import { getScoringHints } from '../utils/gameLogic';
import { WinMode, WIN_THRESHOLDS, WIN_MODE_LABELS } from '../store/gameStore';

import { BACKEND_URL } from '../utils/api';
import { useAudio } from '../utils/AudioProvider';
import { GameChat } from '../components/GameChat';

const POLL_INTERVAL = 1500;

interface PlayerData {
  name: string;
  totalScore: number;
  currentTurnScore: number;
}

interface RoomState {
  room_code: string;
  win_mode: string;
  players: PlayerData[];
  player_ids: string[];
  currentPlayerIndex: number;
  diceValues: number[];
  diceCount: number;
  selectedDice: boolean[];
  keptDice: number[];
  turnPhase: string;
  currentRollScore: number;
  currentRollBreakdown: string[];
  lastSelectionScore: number;
  lastSelectionBreakdown: string[];
  winner: string | null;
  hasRolled: boolean;
  lastActionAt: string;
}

export default function OnlineGame() {
  const params = useLocalSearchParams<{ roomCode: string; playerId: string; playerIndex: string }>();
  const roomCode = params.roomCode || '';
  const playerId = params.playerId || '';
  const myIndex = parseInt(params.playerIndex || '0');
  const { stopMusic, playMusic } = useAudio();

  const [state, setState] = useState<RoomState | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const lastActionRef = useRef('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms/${roomCode}/state`);
      const data = await res.json();
      if (data.error) return;
      // Only update if there's a new action (avoid flickering)
      if (data.lastActionAt !== lastActionRef.current) {
        lastActionRef.current = data.lastActionAt;
        setState(data);
      }
      setLoading(false);
    } catch (e) {
      console.error('Poll error', e);
    }
  }, [roomCode]);

  useEffect(() => {
    stopMusic();
    fetchState();
    pollRef.current = setInterval(fetchState, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      playMusic();
    };
  }, [fetchState]);

  // Auto-advance bust after 2 seconds
  useEffect(() => {
    if (state?.turnPhase === 'bust' && isMyTurn) {
      const timer = setTimeout(async () => {
        await fetch(`${BACKEND_URL}/api/rooms/${roomCode}/bust-next`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ player_id: playerId }),
        });
        fetchState();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state?.turnPhase]);

  if (loading || !state) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Connecting to game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isMyTurn = state.currentPlayerIndex === myIndex;
  const currentPlayer = state.players[state.currentPlayerIndex];
  const myPlayer = state.players[myIndex];
  const opponentPlayer = state.players[1 - myIndex];
  const winMode = (state.win_mode || 'ogs') as WinMode;
  const threshold = WIN_THRESHOLDS[winMode];
  const scoringHints = state.diceValues.length > 0 ? getScoringHints(state.diceValues) : [];
  const hasSelectedAny = (state.selectedDice || []).some(Boolean);
  const canConfirm = state.lastSelectionScore > 0 && hasSelectedAny;
  const canBank = currentPlayer?.currentTurnScore > 0 && (state.turnPhase === 'rolling' || state.turnPhase === 'hothand');
  const canRoll = state.turnPhase === 'rolling' && isMyTurn && !acting;

  const apiAction = async (endpoint: string, body: any = {}) => {
    setActing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms/${roomCode}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId, ...body }),
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert('Error', data.error);
      } else {
        lastActionRef.current = data.lastActionAt;
        setState(data);
      }
    } catch (e) {
      Alert.alert('Error', 'Network error');
    }
    setActing(false);
  };

  const handleRoll = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) {}
    apiAction('roll');
  };

  const handleSelect = (index: number) => {
    if (!isMyTurn || state.turnPhase !== 'selecting') return;
    try { Haptics.selectionAsync(); } catch (e) {}
    const current = [...(state.selectedDice || [])];
    current[index] = !current[index];
    const indices = current.map((v, i) => v ? i : -1).filter(i => i >= 0);
    apiAction('select', { selected_indices: indices });
  };

  const handleConfirm = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
    apiAction('confirm');
  };

  const handleBank = () => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
    apiAction('bank');
  };

  const handleBankContinue = () => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
    apiAction('bank-continue');
  };

  const handleQuit = () => {
    Alert.alert('Leave Game', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => router.replace('/') },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleQuit} style={styles.headerBtn} testID="quit-btn">
          <Ionicons name="close" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>ONLINE</Text>
        <View style={styles.onlineDot}>
          <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Mode + Room Code */}
        <View style={styles.infoRow}>
          <View style={styles.modeTag}>
            <Text style={styles.modeTagText}>{WIN_MODE_LABELS[winMode]} — {threshold} pts</Text>
          </View>
          <View style={styles.roomTag}>
            <Text style={styles.roomTagText}>Room: {state.room_code}</Text>
          </View>
        </View>

        {/* Scoreboard */}
        <View style={styles.scoreRow}>
          {state.players.map((player, idx) => {
            const isActive = state.currentPlayerIndex === idx;
            const isMe = idx === myIndex;
            const progress = Math.min((player.totalScore / threshold) * 100, 100);
            return (
              <View key={idx} style={[styles.playerCard, isActive && styles.activeCard]}>
                {isActive && <View style={styles.turnBadge}><Text style={styles.turnBadgeText}>TURN</Text></View>}
                <Text style={[styles.playerName, isMe && styles.myName]} numberOfLines={1}>
                  {player.name}{isMe ? ' (You)' : ''}
                </Text>
                <Text style={styles.score}>{player.totalScore}</Text>
                {player.currentTurnScore > 0 && (
                  <View style={styles.turnScoreBox}><Text style={styles.turnScoreText}>+{player.currentTurnScore}</Text></View>
                )}
                <View style={styles.bar}><View style={[styles.barFill, { width: `${progress}%` }]} /></View>
              </View>
            );
          })}
        </View>

        {/* Turn Indicator */}
        <Text style={styles.turnLabel}>
          {isMyTurn ? "Your Turn" : `${currentPlayer?.name}'s Turn`}
        </Text>

        {/* Kept Dice */}
        {state.keptDice.length > 0 && (
          <View style={styles.keptRow}>
            <Text style={styles.keptLabel}>Kept:</Text>
            {state.keptDice.map((v, i) => (
              <View key={i} style={styles.keptDie}><Text style={styles.keptDieText}>{v}</Text></View>
            ))}
          </View>
        )}

        {/* Dice Area */}
        <View style={styles.diceArea}>
          {state.diceValues.length === 0 && state.turnPhase === 'rolling' && (
            <View style={styles.prompt}>
              <Ionicons name="dice" size={48} color="#444" />
              <Text style={styles.promptText}>{isMyTurn ? 'Roll the dice!' : 'Waiting for opponent...'}</Text>
            </View>
          )}

          {state.diceValues.length > 0 && (
            <View style={styles.diceGrid}>
              {state.diceValues.map((val, idx) => (
                <Dice
                  key={`${idx}-${val}`}
                  value={val}
                  isRolling={false}
                  isSelected={state.selectedDice?.[idx] || false}
                  isScoring={scoringHints[idx] || false}
                  onPress={() => handleSelect(idx)}
                  disabled={!isMyTurn || state.turnPhase !== 'selecting'}
                  index={idx}
                />
              ))}
            </View>
          )}

          {/* Selection Preview */}
          {state.turnPhase === 'selecting' && isMyTurn && (
            <View style={styles.preview}>
              {state.lastSelectionScore > 0 ? (
                <>
                  <Text style={styles.previewScore}>+{state.lastSelectionScore} pts</Text>
                  {state.lastSelectionBreakdown.map((b, i) => <Text key={i} style={styles.previewBreak}>{b}</Text>)}
                </>
              ) : state.lastSelectionBreakdown.length > 0 ? (
                <Text style={styles.previewErr}>{state.lastSelectionBreakdown[0]}</Text>
              ) : (
                <Text style={styles.previewHint}>Tap scoring dice to select</Text>
              )}
            </View>
          )}

          {/* Last Roll Info */}
          {state.currentRollScore > 0 && state.turnPhase !== 'selecting' && (
            <View style={styles.rollInfo}>
              <Text style={styles.rollInfoTitle}>+{state.currentRollScore}</Text>
              {state.currentRollBreakdown.map((b, i) => <Text key={i} style={styles.rollInfoBreak}>{b}</Text>)}
            </View>
          )}

          {/* BUST */}
          {state.turnPhase === 'bust' && (
            <View style={styles.bustBox}>
              <Ionicons name="close-circle" size={48} color="#FF5722" />
              <Text style={styles.bustText}>BUST!</Text>
              <Text style={styles.bustSub}>No scoring dice!</Text>
            </View>
          )}

          {/* Hot Hand */}
          {state.turnPhase === 'hothand' && (
            <View style={styles.hotBox}>
              <Ionicons name="flame" size={48} color="#ff9800" />
              <Text style={styles.hotText}>HOT HAND!</Text>
              <Text style={styles.hotSub}>All dice scored!</Text>
            </View>
          )}

          {/* Waiting */}
          {!isMyTurn && state.turnPhase !== 'bust' && state.diceValues.length > 0 && (
            <View style={styles.waitingIndicator}>
              <ActivityIndicator size="small" color="#2196F3" />
              <Text style={styles.waitingText}>Opponent is playing...</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Controls (only show for current player) */}
      {isMyTurn && (
        <View style={styles.controls}>
          {state.turnPhase === 'selecting' && (
            <>
              <Pressable
                testID="confirm-btn"
                style={[styles.ctrlBtn, styles.confirmBtn, !canConfirm && styles.disabledBtn]}
                onPress={handleConfirm}
                disabled={!canConfirm || acting}
              >
                <Ionicons name="checkmark" size={22} color="#fff" />
                <Text style={styles.ctrlText}>Keep & Roll</Text>
              </Pressable>
              {currentPlayer?.currentTurnScore > 0 && canConfirm && (
                <Pressable testID="keep-bank-btn" style={[styles.ctrlBtn, styles.bankBtn]} onPress={() => { handleConfirm(); setTimeout(handleBank, 500); }}>
                  <Ionicons name="wallet" size={22} color="#fff" />
                  <Text style={styles.ctrlText}>Keep & Bank</Text>
                </Pressable>
              )}
            </>
          )}

          {state.turnPhase === 'rolling' && (
            <>
              <Pressable
                testID="roll-btn"
                style={[styles.ctrlBtn, styles.rollBtn, !canRoll && styles.disabledBtn]}
                onPress={handleRoll}
                disabled={!canRoll || acting}
              >
                {acting ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="dice" size={22} color="#fff" />
                    <Text style={styles.ctrlText}>{state.hasRolled ? `Roll ${state.diceCount}` : 'Roll Dice'}</Text>
                  </>
                )}
              </Pressable>
              {canBank && (
                <Pressable testID="bank-btn" style={[styles.ctrlBtn, styles.bankBtn]} onPress={handleBank} disabled={acting}>
                  <Ionicons name="wallet" size={22} color="#fff" />
                  <Text style={styles.ctrlText}>Bank {currentPlayer?.currentTurnScore}</Text>
                </Pressable>
              )}
            </>
          )}

          {state.turnPhase === 'hothand' && (
            <>
              <Pressable testID="bank-continue-btn" style={[styles.ctrlBtn, styles.hotBtn]} onPress={handleBankContinue} disabled={acting}>
                <Ionicons name="flame" size={22} color="#fff" />
                <Text style={styles.ctrlText}>Bank & Continue</Text>
              </Pressable>
              <Pressable testID="bank-pass-btn" style={[styles.ctrlBtn, styles.bankBtn]} onPress={handleBank} disabled={acting}>
                <Ionicons name="wallet" size={22} color="#fff" />
                <Text style={styles.ctrlText}>Bank & Pass</Text>
              </Pressable>
            </>
          )}
        </View>
      )}

      {/* Chat */}
      <GameChat
        roomCode={roomCode}
        playerId={playerId}
        playerNames={state.players.map(p => p.name)}
        visible={chatVisible}
        onToggle={() => setChatVisible(!chatVisible)}
      />

      {state.winner && (
        <WinnerModal
          visible={true}
          winnerName={state.winner}
          winMode={winMode}
          players={state.players.map(p => ({ name: p.name, totalScore: p.totalScore, currentTurnScore: p.currentTurnScore }))}
          onPlayAgain={() => router.replace('/')}
          onBackToMenu={() => router.replace('/')}
          onViewLeaderboard={() => router.replace('/leaderboard')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#111122', borderBottomWidth: 1, borderBottomColor: '#222' },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  onlineDot: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6 },
  scrollContent: { flexGrow: 1, paddingBottom: 16 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#555', marginTop: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingTop: 8 },
  modeTag: { backgroundColor: '#e91e63', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 10 },
  modeTagText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  roomTag: { backgroundColor: '#2a3f5f', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 10 },
  roomTagText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 12 },
  playerCard: { flex: 1, backgroundColor: '#16213e', borderRadius: 14, padding: 12, borderWidth: 2, borderColor: '#2a3f5f', alignItems: 'center' },
  activeCard: { borderColor: '#2196F3', backgroundColor: '#1a2d4e' },
  turnBadge: { position: 'absolute', top: -10, backgroundColor: '#4CAF50', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 8 },
  turnBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  playerName: { fontSize: 13, fontWeight: '700', color: '#aaa', marginTop: 4 },
  myName: { color: '#2196F3' },
  score: { fontSize: 28, fontWeight: '800', color: '#fff', marginVertical: 4 },
  turnScoreBox: { backgroundColor: 'rgba(255,152,0,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#ff9800' },
  turnScoreText: { fontSize: 14, fontWeight: '700', color: '#ff9800' },
  bar: { width: '100%', height: 5, backgroundColor: '#2a3f5f', borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 3 },
  turnLabel: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center', paddingVertical: 10 },
  keptRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 6, marginBottom: 4 },
  keptLabel: { fontSize: 12, color: '#666', fontWeight: '600' },
  keptDie: { width: 26, height: 26, borderRadius: 5, backgroundColor: '#2a3f5f', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#4CAF50' },
  keptDieText: { color: '#4CAF50', fontSize: 13, fontWeight: '700' },
  diceArea: { alignItems: 'center', paddingVertical: 12, minHeight: 180 },
  prompt: { alignItems: 'center', paddingVertical: 30 },
  promptText: { fontSize: 15, color: '#555', marginTop: 10, fontWeight: '600' },
  diceGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 280, paddingVertical: 8 },
  preview: { marginTop: 12, alignItems: 'center', backgroundColor: '#161625', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: '#333', minWidth: 180 },
  previewScore: { fontSize: 22, fontWeight: '800', color: '#4CAF50' },
  previewBreak: { fontSize: 12, color: '#888', marginTop: 2 },
  previewErr: { fontSize: 12, color: '#FF5722', fontWeight: '600' },
  previewHint: { fontSize: 12, color: '#555', fontStyle: 'italic' },
  rollInfo: { marginTop: 10, alignItems: 'center', backgroundColor: 'rgba(76,175,80,0.1)', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#4CAF5044' },
  rollInfoTitle: { fontSize: 15, fontWeight: '700', color: '#4CAF50' },
  rollInfoBreak: { fontSize: 11, color: '#888', marginTop: 2 },
  bustBox: { alignItems: 'center', marginTop: 12, padding: 20, backgroundColor: 'rgba(255,87,34,0.12)', borderRadius: 16, borderWidth: 2, borderColor: '#FF5722' },
  bustText: { fontSize: 32, fontWeight: '900', color: '#FF5722', marginTop: 8 },
  bustSub: { fontSize: 14, color: '#FF5722', marginTop: 4 },
  hotBox: { alignItems: 'center', marginTop: 12, padding: 20, backgroundColor: 'rgba(255,152,0,0.12)', borderRadius: 16, borderWidth: 2, borderColor: '#ff9800' },
  hotText: { fontSize: 32, fontWeight: '900', color: '#ff9800', marginTop: 8 },
  hotSub: { fontSize: 14, color: '#ff9800', marginTop: 4 },
  waitingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  waitingText: { fontSize: 13, color: '#2196F3', fontWeight: '600' },
  controls: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12, gap: 10, backgroundColor: '#111122', borderTopWidth: 1, borderTopColor: '#222' },
  ctrlBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, gap: 8 },
  rollBtn: { backgroundColor: '#2196F3' },
  bankBtn: { backgroundColor: '#4CAF50' },
  confirmBtn: { backgroundColor: '#e91e63' },
  hotBtn: { backgroundColor: '#ff9800' },
  disabledBtn: { backgroundColor: '#333', opacity: 0.5 },
  ctrlText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

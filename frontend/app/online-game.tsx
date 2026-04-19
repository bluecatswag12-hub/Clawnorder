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
import { WinMode, WIN_THRESHOLDS, WIN_MODE_LABELS } from '../store/gameStore';

import { BACKEND_URL } from '../utils/api';
import { useAudio } from '../utils/AudioProvider';
import { GameChat } from '../components/GameChat';
import { saveSession, clearSession } from '../utils/session';

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
  const { stopAllMusic: stopAll, playTitleMusic: playTitle, playIngameMusic, sfxRoll, sfxSelect, sfxScore, sfxCursed, sfxVictory } = useAudio();

  const [state, setState] = useState<RoomState | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const lastActionRef = useRef('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const safeNavigate = (path: string) => {
    mountedRef.current = false;
    stopPolling();
    stopAll();
    playTitle();
    clearSession();
    router.replace(path as any);
  };

  const fetchState = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms/${roomCode}/state`);
      const data = await res.json();
      if (data.error || !mountedRef.current) return;
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
    mountedRef.current = true;
    playIngameMusic();
    saveSession({ roomCode, playerId, playerIndex: String(myIndex) });
    fetchState();
    pollRef.current = setInterval(fetchState, POLL_INTERVAL);
    return () => {
      mountedRef.current = false;
      stopPolling();
      playTitle();
    };
  }, [fetchState]);

  // Auto-advance bust after 2 seconds + play cursed SFX
  useEffect(() => {
    if (state?.turnPhase === 'bust') {
      sfxCursed();
      if (isMyTurn) {
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
    }
  }, [state?.turnPhase]);

  // Victory SFX
  useEffect(() => {
    if (state?.winner) {
      stopAll();
      sfxVictory();
    }
  }, [state?.winner]);

  if (loading || !state) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>Connecting to game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isMyTurn = state.currentPlayerIndex === myIndex;
  const currentPlayer = state.players[state.currentPlayerIndex];
  const winMode = (state.win_mode || 'ogs') as WinMode;
  const threshold = WIN_THRESHOLDS[winMode];
  const hasSelectedAny = (state.selectedDice || []).some(Boolean);
  const canConfirm = state.lastSelectionScore > 0 && hasSelectedAny;
  const canBank = currentPlayer?.currentTurnScore > 0 && (state.turnPhase === 'rolling' || state.turnPhase === 'hothand');
  const canRoll = state.turnPhase === 'rolling' && isMyTurn && !acting;

  const apiAction = async (endpoint: string, body: any = {}) => {
    if (!mountedRef.current) return;
    setActing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms/${roomCode}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId, ...body }),
      });
      const data = await res.json();
      if (!mountedRef.current) return;
      if (data.error) {
        Alert.alert('Error', data.error);
      } else {
        lastActionRef.current = data.lastActionAt;
        setState(data);
      }
    } catch (e) {
      if (mountedRef.current) Alert.alert('Error', 'Network error');
    }
    if (mountedRef.current) setActing(false);
  };

  const handleRoll = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) {}
    sfxRoll();
    apiAction('roll');
  };

  const handleSelect = (index: number) => {
    if (!isMyTurn || state.turnPhase !== 'selecting') return;
    try { Haptics.selectionAsync(); } catch (e) {}
    sfxSelect();
    const current = [...(state.selectedDice || [])];
    current[index] = !current[index];
    const indices = current.map((v, i) => v ? i : -1).filter(i => i >= 0);
    apiAction('select', { selected_indices: indices });
  };

  const handleConfirm = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
    sfxScore();
    apiAction('confirm');
  };

  const handleBank = () => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
    sfxScore();
    apiAction('bank');
  };

  const handleBankContinue = () => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
    sfxScore();
    apiAction('bank-continue');
  };

  const handleQuit = () => {
    Alert.alert('Leave Game', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => safeNavigate('/') },
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
          <View style={[styles.dot, { backgroundColor: '#2E7D32' }]} />
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
              <Text style={styles.promptText}>{isMyTurn ? 'Cast the bones!' : 'Awaiting opponent...'}</Text>
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
                  isScoring={true}
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
              <Text style={styles.bustText}>CURSED!</Text>
              <Text style={styles.bustSub}>No scoring bones!</Text>
            </View>
          )}

          {/* Dragon's Favor */}
          {state.turnPhase === 'hothand' && (
            <View style={styles.hotBox}>
              <Ionicons name="flame" size={48} color="#ff9800" />
              <Text style={styles.hotText}>DRAGON'S FAVOR!</Text>
              <Text style={styles.hotSub}>All bones scored!</Text>
            </View>
          )}

          {/* Waiting */}
          {!isMyTurn && state.turnPhase !== 'bust' && state.diceValues.length > 0 && (
            <View style={styles.waitingIndicator}>
              <ActivityIndicator size="small" color="#D4AF37" />
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
                <Text style={styles.ctrlText}>Keep & Cast</Text>
              </Pressable>
              {currentPlayer?.currentTurnScore > 0 && canConfirm && (
                <Pressable testID="keep-bank-btn" style={[styles.ctrlBtn, styles.bankBtn]} onPress={() => { handleConfirm(); setTimeout(handleBank, 500); }}>
                  <Ionicons name="logo-bitcoin" size={22} color={styles.ctrlText.color} />
                  <Text style={styles.ctrlText}>Keep & Hoard</Text>
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
                {acting ? <ActivityIndicator color="#F4E3C5" /> : (
                  <>
                    <Ionicons name="dice" size={22} color={styles.ctrlText.color} />
                    <Text style={styles.ctrlText}>{state.hasRolled ? `Cast ${state.diceCount} Bones` : 'Cast the Bones'}</Text>
                  </>
                )}
              </Pressable>
              {canBank && (
                <Pressable testID="bank-btn" style={[styles.ctrlBtn, styles.bankBtn]} onPress={handleBank} disabled={acting}>
                  <Ionicons name="logo-bitcoin" size={22} color={styles.ctrlText.color} />
                  <Text style={styles.ctrlText}>Hoard {currentPlayer?.currentTurnScore}</Text>
                </Pressable>
              )}
            </>
          )}

          {state.turnPhase === 'hothand' && (
            <>
              <Pressable testID="bank-continue-btn" style={[styles.ctrlBtn, styles.hotBtn]} onPress={handleBankContinue} disabled={acting}>
                <Ionicons name="flame" size={22} color={styles.ctrlText.color} />
                <Text style={styles.ctrlText}>Hoard & Continue</Text>
              </Pressable>
              <Pressable testID="bank-pass-btn" style={[styles.ctrlBtn, styles.bankBtn]} onPress={handleBank} disabled={acting}>
                <Ionicons name="logo-bitcoin" size={22} color={styles.ctrlText.color} />
                <Text style={styles.ctrlText}>Hoard & Pass</Text>
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

      {state.winner ? (
        <WinnerModal
          visible={true}
          winnerName={state.winner || ''}
          winMode={winMode}
          players={(state.players || []).map(p => ({ name: p.name || '', totalScore: p.totalScore || 0, currentTurnScore: p.currentTurnScore || 0 }))}
          onPlayAgain={() => safeNavigate('/')}
          onBackToMenu={() => safeNavigate('/')}
          onViewLeaderboard={() => safeNavigate('/leaderboard')}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A110A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#2C1E16', borderBottomWidth: 1, borderBottomColor: '#3D2B1F' },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#D4AF37', letterSpacing: 2 },
  onlineDot: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6 },
  scrollContent: { flexGrow: 1, paddingBottom: 16 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#AA7C11', marginTop: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingTop: 8 },
  modeTag: { backgroundColor: '#3D2B1F', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: '#D4AF37' },
  modeTagText: { color: '#D4AF37', fontSize: 11, fontWeight: '700' },
  roomTag: { backgroundColor: '#3D2B1F', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: '#5C3D2E' },
  roomTagText: { color: '#F4E3C5', fontSize: 11, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 12 },
  playerCard: { flex: 1, backgroundColor: '#2C1E16', borderRadius: 14, padding: 12, borderWidth: 2, borderColor: '#3D2B1F', alignItems: 'center' },
  activeCard: { borderColor: '#D4AF37', backgroundColor: '#3D2B1F' },
  turnBadge: { position: 'absolute', top: -10, backgroundColor: '#2E7D32', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 8 },
  turnBadgeText: { color: '#F4E3C5', fontSize: 10, fontWeight: '800' },
  playerName: { fontSize: 13, fontWeight: '700', color: '#C8AC70', marginTop: 4 },
  myName: { color: '#D4AF37' },
  score: { fontSize: 28, fontWeight: '800', color: '#D4AF37', marginVertical: 4 },
  turnScoreBox: { backgroundColor: 'rgba(255,158,61,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#FF9E3D' },
  turnScoreText: { fontSize: 14, fontWeight: '700', color: '#FF9E3D' },
  bar: { width: '100%', height: 5, backgroundColor: '#3D2B1F', borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#D4AF37', borderRadius: 3 },
  turnLabel: { fontSize: 18, fontWeight: '700', color: '#F4E3C5', textAlign: 'center', paddingVertical: 10 },
  keptRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 6, marginBottom: 4 },
  keptLabel: { fontSize: 12, color: '#AA7C11', fontWeight: '600' },
  keptDie: { width: 26, height: 26, borderRadius: 5, backgroundColor: '#3D2B1F', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D4AF37' },
  keptDieText: { color: '#D4AF37', fontSize: 13, fontWeight: '700' },
  diceArea: { alignItems: 'center', paddingVertical: 12, minHeight: 180 },
  prompt: { alignItems: 'center', paddingVertical: 30 },
  promptText: { fontSize: 15, color: '#AA7C11', marginTop: 10, fontWeight: '600' },
  diceGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 280, paddingVertical: 8 },
  preview: { marginTop: 12, alignItems: 'center', backgroundColor: '#2C1E16', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: '#3D2B1F', minWidth: 180 },
  previewScore: { fontSize: 22, fontWeight: '800', color: '#D4AF37' },
  previewBreak: { fontSize: 12, color: '#C8AC70', marginTop: 2 },
  previewErr: { fontSize: 12, color: '#B22222', fontWeight: '600' },
  previewHint: { fontSize: 12, color: '#AA7C11', fontStyle: 'italic' },
  rollInfo: { marginTop: 10, alignItems: 'center', backgroundColor: 'rgba(212,175,55,0.1)', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#D4AF3744' },
  rollInfoTitle: { fontSize: 15, fontWeight: '700', color: '#D4AF37' },
  rollInfoBreak: { fontSize: 11, color: '#C8AC70', marginTop: 2 },
  bustBox: { alignItems: 'center', marginTop: 12, padding: 20, backgroundColor: 'rgba(139,0,0,0.15)', borderRadius: 16, borderWidth: 2, borderColor: '#8B0000' },
  bustText: { fontSize: 32, fontWeight: '900', color: '#B22222', marginTop: 8 },
  bustSub: { fontSize: 14, color: '#B22222', marginTop: 4 },
  hotBox: { alignItems: 'center', marginTop: 12, padding: 20, backgroundColor: 'rgba(255,158,61,0.12)', borderRadius: 16, borderWidth: 2, borderColor: '#FF9E3D' },
  hotText: { fontSize: 32, fontWeight: '900', color: '#FF9E3D', marginTop: 8 },
  hotSub: { fontSize: 14, color: '#FF9E3D', marginTop: 4 },
  waitingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  waitingText: { fontSize: 13, color: '#D4AF37', fontWeight: '600' },
  controls: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12, gap: 10, backgroundColor: '#2C1E16', borderTopWidth: 1, borderTopColor: '#3D2B1F' },
  ctrlBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, gap: 8 },
  rollBtn: { backgroundColor: '#FF9E3D' },
  bankBtn: { backgroundColor: '#D4AF37' },
  confirmBtn: { backgroundColor: '#8B0000' },
  hotBtn: { backgroundColor: '#FF9E3D' },
  disabledBtn: { backgroundColor: '#3D2B1F', opacity: 0.5 },
  ctrlText: { fontSize: 14, fontWeight: '700', color: '#1A110A' },
});

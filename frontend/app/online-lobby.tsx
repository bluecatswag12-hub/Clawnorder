import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, SafeAreaView, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useGameStore, WIN_MODE_LABELS, WIN_THRESHOLDS } from '../store/gameStore';
import { BACKEND_URL } from '../utils/api';
import { Ionicons } from '@expo/vector-icons';

const PLAYER_COLORS = ['#FF9E3D', '#D4AF37', '#2E7D32', '#FF9E3D', '#9C27B0'];

export default function OnlineLobby() {
  const { winMode } = useGameStore();
  const [myName, setMyName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [screen, setScreen] = useState<'menu' | 'create' | 'join'>('menu');
  const [createdCode, setCreatedCode] = useState('');
  const [myPlayerId, setMyPlayerId] = useState('');
  const [myIndex, setMyIndex] = useState(0);
  const [lobbyPlayers, setLobbyPlayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const pollLobby = (code: string, pid: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/rooms/${code}/state`);
        const data = await res.json();
        if (data.players) {
          setLobbyPlayers(data.players.map((p: any) => p.name));
        }
      } catch (e) {}
    }, 1500);
  };

  const handleCreate = async () => {
    if (!myName.trim()) { Alert.alert('Error', 'Enter your name'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_name: myName.trim(), win_mode: winMode }),
      });
      const data = await res.json();
      if (data.error) { Alert.alert('Error', data.error); }
      else {
        setCreatedCode(data.room_code);
        setMyPlayerId(data.player_id);
        setMyIndex(0);
        setLobbyPlayers([myName.trim()]);
        setScreen('create');
        pollLobby(data.room_code, data.player_id);
      }
    } catch (e) { Alert.alert('Error', 'Failed to create room'); }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!myName.trim()) { Alert.alert('Error', 'Enter your name'); return; }
    if (!roomCode.trim()) { Alert.alert('Error', 'Enter room code'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_code: roomCode.trim().toUpperCase(), player_name: myName.trim() }),
      });
      const data = await res.json();
      if (data.error) { Alert.alert('Error', data.error); }
      else {
        setCreatedCode(data.room_code);
        setMyPlayerId(data.player_id);
        // Fetch state to get my index
        const stateRes = await fetch(`${BACKEND_URL}/api/rooms/${data.room_code}/state`);
        const stateData = await stateRes.json();
        const idx = stateData.player_ids?.indexOf(data.player_id) ?? 0;
        setMyIndex(idx);
        setLobbyPlayers(stateData.players.map((p: any) => p.name));
        setScreen('create');
        pollLobby(data.room_code, data.player_id);
      }
    } catch (e) { Alert.alert('Error', 'Failed to join room'); }
    setLoading(false);
  };

  const handleStartGame = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    router.push({ pathname: '/online-game', params: { roomCode: createdCode, playerId: myPlayerId, playerIndex: String(myIndex) } });
  };

  const handleBack = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (screen !== 'menu') { setScreen('menu'); setCreatedCode(''); setLobbyPlayers([]); }
    else router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.headerBtn} testID="back-btn">
          <Ionicons name="arrow-back" size={26} color="#F4E3C5" />
        </Pressable>
        <Text style={styles.headerTitle}>ONLINE GAME</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.modeTag}>
            <Text style={styles.modeTagText}>{WIN_MODE_LABELS[winMode]} — {WIN_THRESHOLDS[winMode]} pts</Text>
          </View>

          {screen === 'menu' && (
            <>
              {/* Name Input */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Your Name</Text>
                <TextInput testID="name-input" style={styles.nameInput} value={myName} onChangeText={setMyName} placeholder="Enter your name" placeholderTextColor="#AA7C11" />
              </View>

              <Pressable testID="create-room-btn" style={styles.createBtn} onPress={handleCreate} disabled={loading}>
                {loading ? <ActivityIndicator color="#F4E3C5" /> : (<><Ionicons name="add-circle" size={22} color="#F4E3C5" /><Text style={styles.btnText}>Create Room</Text></>)}
              </Pressable>

              <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>OR</Text><View style={styles.dividerLine} /></View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Join a Room</Text>
                <TextInput testID="room-code-input" style={styles.codeInput} value={roomCode} onChangeText={(t) => setRoomCode(t.toUpperCase())} placeholder="ROOM CODE" placeholderTextColor="#444" autoCapitalize="characters" maxLength={6} />
              </View>

              <Pressable testID="join-room-btn" style={[styles.joinBtn, (!roomCode.trim() || !myName.trim()) && styles.disabledBtn]} onPress={handleJoin} disabled={loading || !roomCode.trim() || !myName.trim()}>
                {loading ? <ActivityIndicator color="#F4E3C5" /> : (<><Ionicons name="enter" size={22} color="#F4E3C5" /><Text style={styles.btnText}>Join Room</Text></>)}
              </Pressable>
            </>
          )}

          {screen === 'create' && (
            <View style={styles.lobbyBox}>
              <Text style={styles.lobbyTitle}>Room Lobby</Text>
              <Text style={styles.codeDisplay}>{createdCode}</Text>
              <Text style={styles.lobbyHint}>Share this code with friends (up to 5 players)</Text>

              {/* Players in lobby */}
              <View style={styles.playersList}>
                <Text style={styles.playersLabel}>Players ({lobbyPlayers.length}/5)</Text>
                {lobbyPlayers.map((name, i) => (
                  <View key={i} style={styles.playerRow}>
                    <View style={[styles.playerDot, { backgroundColor: PLAYER_COLORS[i % PLAYER_COLORS.length] }]} />
                    <Text style={styles.playerNameText}>{name}</Text>
                    {i === myIndex && <Text style={styles.youTag}>(You)</Text>}
                  </View>
                ))}
                {lobbyPlayers.length < 5 && (
                  <View style={styles.waitingRow}>
                    <ActivityIndicator size="small" color="#AA7C11" />
                    <Text style={styles.waitingSlot}>Waiting for players...</Text>
                  </View>
                )}
              </View>

              {lobbyPlayers.length >= 2 && (
                <Pressable testID="start-online-btn" style={styles.startBtn} onPress={handleStartGame}>
                  <Ionicons name="play" size={22} color="#F4E3C5" />
                  <Text style={styles.btnText}>Start Game ({lobbyPlayers.length} players)</Text>
                </Pressable>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A110A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#2C1E16', borderBottomWidth: 1, borderBottomColor: '#3D2B1F' },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#F4E3C5', letterSpacing: 2 },
  content: { padding: 20, paddingBottom: 40 },
  modeTag: { alignSelf: 'center', backgroundColor: '#D4AF37', paddingHorizontal: 16, paddingVertical: 5, borderRadius: 12, marginBottom: 24 },
  modeTagText: { color: '#F4E3C5', fontSize: 13, fontWeight: '700' },
  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#C8AC70', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  nameInput: { backgroundColor: '#2C1E16', borderRadius: 12, padding: 16, fontSize: 16, color: '#F4E3C5', borderWidth: 1, borderColor: '#3D2B1F' },
  codeInput: { backgroundColor: '#2C1E16', borderRadius: 14, padding: 18, fontSize: 28, color: '#F4E3C5', textAlign: 'center', letterSpacing: 8, fontWeight: '800', borderWidth: 1, borderColor: '#3D2B1F' },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2E7D32', paddingVertical: 16, borderRadius: 14, gap: 10, marginBottom: 8 },
  joinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF9E3D', paddingVertical: 16, borderRadius: 14, gap: 10 },
  disabledBtn: { backgroundColor: '#3D2B1F', opacity: 0.5 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#F4E3C5' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#3D2B1F' },
  dividerText: { marginHorizontal: 16, fontSize: 14, color: '#AA7C11', fontWeight: '700' },
  lobbyBox: { backgroundColor: '#2C1E16', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#2E7D32' },
  lobbyTitle: { fontSize: 22, fontWeight: '800', color: '#F4E3C5' },
  codeDisplay: { fontSize: 44, fontWeight: '900', color: '#2E7D32', letterSpacing: 10, marginTop: 8 },
  lobbyHint: { fontSize: 13, color: '#C8AC70', marginTop: 8, marginBottom: 20 },
  playersList: { width: '100%', marginBottom: 20 },
  playersLabel: { fontSize: 13, fontWeight: '700', color: '#C8AC70', marginBottom: 10 },
  playerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1a1a2e' },
  playerDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  playerNameText: { fontSize: 16, fontWeight: '600', color: '#F4E3C5', flex: 1 },
  youTag: { fontSize: 12, color: '#2E7D32', fontWeight: '600' },
  waitingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  waitingSlot: { fontSize: 14, color: '#AA7C11', fontStyle: 'italic' },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2E7D32', paddingVertical: 16, borderRadius: 14, gap: 10, width: '100%' },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useGameStore, WIN_MODE_LABELS, WIN_THRESHOLDS } from '../store/gameStore';
import { Ionicons } from '@expo/vector-icons';

import { BACKEND_URL } from '../utils/api';

export default function OnlineLobby() {
  const { players, winMode } = useGameStore();
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [createdCode, setCreatedCode] = useState('');
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState('');

  const handleCreateRoom = async () => {
    setIsCreating(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_name: players[0].name || 'Player 1', win_mode: winMode }),
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert('Error', data.error);
      } else {
        setCreatedCode(data.room_code);
        setMyPlayerId(data.player_id);
        setWaitingForOpponent(true);
        pollForOpponent(data.room_code, data.player_id);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to create room. Check your connection.');
    }
    setIsCreating(false);
  };

  const pollForOpponent = (code: string, pid: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/rooms/${code}/state`);
        const data = await res.json();
        if (data.players && data.players.length === 2) {
          clearInterval(interval);
          router.push({ pathname: '/online-game', params: { roomCode: code, playerId: pid, playerIndex: '0' } });
        }
      } catch (e) {
        // Keep polling
      }
    }, 1500);

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(interval), 300000);
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      Alert.alert('Error', 'Enter a room code');
      return;
    }
    setIsJoining(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_code: roomCode.trim().toUpperCase(), player_name: players[0].name || 'Player 2' }),
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert('Error', data.error);
      } else {
        router.push({ pathname: '/online-game', params: { roomCode: data.room_code, playerId: data.player_id, playerIndex: '1' } });
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to join room. Check your connection.');
    }
    setIsJoining(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/')} style={styles.headerBtn} testID="back-btn">
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>ONLINE GAME</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.content}>
          {/* Mode Tag */}
          <View style={styles.modeTag}>
            <Text style={styles.modeTagText}>{WIN_MODE_LABELS[winMode]} — {WIN_THRESHOLDS[winMode]} pts</Text>
          </View>

          {waitingForOpponent ? (
            <View style={styles.waitingBox}>
              <Ionicons name="hourglass" size={48} color="#2196F3" />
              <Text style={styles.waitingTitle}>Room Created!</Text>
              <Text style={styles.codeDisplay}>{createdCode}</Text>
              <Text style={styles.waitingText}>Share this code with your friend</Text>
              <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 20 }} />
              <Text style={styles.waitingSub}>Waiting for opponent to join...</Text>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => { setWaitingForOpponent(false); setCreatedCode(''); }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Create Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Create a Room</Text>
                <Text style={styles.sectionSub}>Start a game and share the code</Text>
                <Pressable
                  testID="create-room-btn"
                  style={styles.createBtn}
                  onPress={handleCreateRoom}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="add-circle" size={22} color="#fff" />
                      <Text style={styles.btnText}>Create Room</Text>
                    </>
                  )}
                </Pressable>
              </View>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Join Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Join a Room</Text>
                <Text style={styles.sectionSub}>Enter your friend's room code</Text>
                <TextInput
                  testID="room-code-input"
                  style={styles.codeInput}
                  value={roomCode}
                  onChangeText={(t) => setRoomCode(t.toUpperCase())}
                  placeholder="ENTER CODE"
                  placeholderTextColor="#444"
                  autoCapitalize="characters"
                  maxLength={6}
                />
                <Pressable
                  testID="join-room-btn"
                  style={[styles.joinBtn, !roomCode.trim() && styles.disabledBtn]}
                  onPress={handleJoinRoom}
                  disabled={isJoining || !roomCode.trim()}
                >
                  {isJoining ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="enter" size={22} color="#fff" />
                      <Text style={styles.btnText}>Join Room</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#111122',
    borderBottomWidth: 1, borderBottomColor: '#222',
  },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  content: { flex: 1, padding: 24 },
  modeTag: { alignSelf: 'center', backgroundColor: '#e91e63', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 12, marginBottom: 24 },
  modeTagText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  sectionSub: { fontSize: 13, color: '#666', marginBottom: 16 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#4CAF50', paddingVertical: 16, borderRadius: 14, gap: 10,
  },
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2196F3', paddingVertical: 16, borderRadius: 14, gap: 10,
  },
  disabledBtn: { backgroundColor: '#333', opacity: 0.5 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  codeInput: {
    backgroundColor: '#161625', borderRadius: 14, padding: 18, fontSize: 28, color: '#fff',
    textAlign: 'center', letterSpacing: 8, fontWeight: '800', borderWidth: 1, borderColor: '#333', marginBottom: 16,
  },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#222' },
  dividerText: { marginHorizontal: 16, fontSize: 14, color: '#555', fontWeight: '700' },
  waitingBox: {
    backgroundColor: '#161625', borderRadius: 20, padding: 32, alignItems: 'center',
    borderWidth: 2, borderColor: '#2196F3',
  },
  waitingTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 12 },
  codeDisplay: { fontSize: 48, fontWeight: '900', color: '#4CAF50', letterSpacing: 10, marginTop: 12 },
  waitingText: { fontSize: 14, color: '#aaa', marginTop: 8 },
  waitingSub: { fontSize: 13, color: '#2196F3', marginTop: 12, fontWeight: '600' },
  cancelBtn: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 24 },
  cancelBtnText: { fontSize: 14, color: '#666', fontWeight: '600' },
});

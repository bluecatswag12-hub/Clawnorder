import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, SafeAreaView, FlatList, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BACKEND_URL } from '../utils/api';
import { WIN_MODE_LABELS } from '../store/gameStore';

interface ActiveRoom {
  room_code: string;
  host_name: string;
  player_count: number;
  max_players: number;
  win_mode: string;
  started: boolean;
  has_winner: boolean;
}

const MODE_COLORS: Record<string, string> = { noobs: '#2E7D32', ogs: '#FF9E3D', panthers: '#D4AF37' };

export default function ServerBrowser() {
  const [rooms, setRooms] = useState<ActiveRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms/active`);
      const data = await res.json();
      if (Array.isArray(data)) setRooms(data);
    } catch (e) {
      console.error('Failed to fetch rooms', e);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  const joinRoom = (code: string) => {
    router.push({ pathname: '/online-lobby', params: { joinCode: code } });
  };

  const renderRoom = ({ item }: { item: ActiveRoom }) => {
    const canJoin = !item.started && item.player_count < item.max_players;
    const modeColor = MODE_COLORS[item.win_mode] || '#FF9E3D';
    const modeName = WIN_MODE_LABELS[item.win_mode as keyof typeof WIN_MODE_LABELS] || item.win_mode;

    return (
      <View style={[styles.roomCard, item.started && styles.startedCard]}>
        <View style={styles.roomTop}>
          <View style={styles.roomInfo}>
            <Text style={styles.hostName}>{item.host_name}'s Room</Text>
            <Text style={styles.roomCode}>{item.room_code}</Text>
          </View>
          <View style={[styles.modeBadge, { backgroundColor: modeColor }]}>
            <Text style={styles.modeBadgeText}>{modeName}</Text>
          </View>
        </View>

        <View style={styles.roomBottom}>
          <View style={styles.playerInfo}>
            <Ionicons name="people" size={16} color="#C8AC70" />
            <Text style={styles.playerCount}>{item.player_count}/{item.max_players}</Text>
          </View>

          <View style={styles.statusRow}>
            {item.started ? (
              <View style={styles.statusBadge}>
                <Ionicons name="lock-closed" size={12} color="#B22222" />
                <Text style={styles.statusStarted}>In Progress</Text>
              </View>
            ) : (
              <View style={styles.statusBadge}>
                <Ionicons name="lock-open" size={12} color="#2E7D32" />
                <Text style={styles.statusOpen}>Open</Text>
              </View>
            )}
          </View>

          {canJoin && (
            <Pressable testID={`join-${item.room_code}`} style={styles.joinBtn} onPress={() => joinRoom(item.room_code)}>
              <Text style={styles.joinBtnText}>Join</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn} testID="back-btn">
          <Ionicons name="arrow-back" size={26} color="#F4E3C5" />
        </Pressable>
        <Text style={styles.headerTitle}>LOCAL SERVER</Text>
        <Pressable onPress={() => { setRefreshing(true); fetchRooms(); }} style={styles.headerBtn}>
          <Ionicons name="refresh" size={22} color="#F4E3C5" />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#FF9E3D" />
          <Text style={styles.loadingText}>Scanning for games...</Text>
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.room_code}
          renderItem={renderRoom}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRooms(); }} tintColor="#FF9E3D" />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="server" size={48} color="#3D2B1F" />
              <Text style={styles.emptyTitle}>No active games</Text>
              <Text style={styles.emptySub}>Create one from the Online Game tab!</Text>
              <Pressable style={styles.createBtn} onPress={() => router.push('/online-lobby')}>
                <Ionicons name="add-circle" size={20} color="#F4E3C5" />
                <Text style={styles.createBtnText}>Create a Room</Text>
              </Pressable>
            </View>
          }
          ListHeaderComponent={
            <Text style={styles.listHeader}>{rooms.length} game{rooms.length !== 1 ? 's' : ''} found</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A110A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#2C1E16', borderBottomWidth: 1, borderBottomColor: '#3D2B1F' },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#F4E3C5', letterSpacing: 2 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 14, color: '#AA7C11', marginTop: 12 },
  listContent: { padding: 16, paddingBottom: 40 },
  listHeader: { fontSize: 13, color: '#AA7C11', fontWeight: '600', marginBottom: 12 },
  roomCard: { backgroundColor: '#2C1E16', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#3D2B1F' },
  startedCard: { borderColor: '#B2222233', opacity: 0.7 },
  roomTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  roomInfo: {},
  hostName: { fontSize: 16, fontWeight: '700', color: '#F4E3C5' },
  roomCode: { fontSize: 12, color: '#AA7C11', fontWeight: '600', marginTop: 2, letterSpacing: 2 },
  modeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  modeBadgeText: { color: '#F4E3C5', fontSize: 11, fontWeight: '700' },
  roomBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playerInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  playerCount: { fontSize: 14, color: '#C8AC70', fontWeight: '600' },
  statusRow: {},
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusStarted: { fontSize: 12, color: '#B22222', fontWeight: '600' },
  statusOpen: { fontSize: 12, color: '#2E7D32', fontWeight: '600' },
  joinBtn: { backgroundColor: '#2E7D32', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10 },
  joinBtnText: { color: '#F4E3C5', fontSize: 14, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#AA7C11', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#444', marginTop: 8 },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2E7D32', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 20 },
  createBtnText: { color: '#F4E3C5', fontSize: 15, fontWeight: '700' },
});

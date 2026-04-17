import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface LeaderEntry {
  player_name: string;
  wins: number;
  total_points: number;
  games_played: number;
  highest_score: number;
}

interface AllTimeEntry {
  player_name: string;
  games_won: number;
  total_points: number;
  games_played: number;
  highest_score: number;
}

type Tab = 'daily' | 'alltime';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const MEDAL_ICONS: Array<'trophy' | 'medal' | 'ribbon'> = ['trophy', 'medal', 'ribbon'];

export default function Leaderboard() {
  const [tab, setTab] = useState<Tab>('daily');
  const [dailyData, setDailyData] = useState<{ date: string; leaderboard: LeaderEntry[]; total_games_today: number } | null>(null);
  const [allTimeData, setAllTimeData] = useState<{ leaderboard: AllTimeEntry[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [dailyRes, allTimeRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/leaderboard/daily`),
        fetch(`${BACKEND_URL}/api/leaderboard/alltime`),
      ]);
      const daily = await dailyRes.json();
      const allTime = await allTimeRes.json();
      setDailyData(daily);
      setAllTimeData(allTime);
    } catch (e) {
      console.error('Failed to fetch leaderboard', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderDailyRow = (entry: LeaderEntry, index: number) => {
    const isTop3 = index < 3;
    return (
      <View key={entry.player_name} style={[styles.row, isTop3 && styles.topRow]}>
        <View style={styles.rankCol}>
          {isTop3 ? (
            <Ionicons name={MEDAL_ICONS[index]} size={24} color={MEDAL_COLORS[index]} />
          ) : (
            <Text style={styles.rankText}>{index + 1}</Text>
          )}
        </View>
        <View style={styles.nameCol}>
          <Text style={[styles.nameText, isTop3 && styles.topName]} numberOfLines={1}>
            {entry.player_name}
          </Text>
          <Text style={styles.gamesText}>{entry.games_played} games</Text>
        </View>
        <View style={styles.statCol}>
          <Text style={styles.winsText}>{entry.wins}W</Text>
        </View>
        <View style={styles.statCol}>
          <Text style={styles.pointsText}>{entry.total_points.toLocaleString()}</Text>
          <Text style={styles.ptsLabel}>pts</Text>
        </View>
      </View>
    );
  };

  const renderAllTimeRow = (entry: AllTimeEntry, index: number) => {
    const isTop3 = index < 3;
    return (
      <View key={entry.player_name} style={[styles.row, isTop3 && styles.topRow]}>
        <View style={styles.rankCol}>
          {isTop3 ? (
            <Ionicons name={MEDAL_ICONS[index]} size={24} color={MEDAL_COLORS[index]} />
          ) : (
            <Text style={styles.rankText}>{index + 1}</Text>
          )}
        </View>
        <View style={styles.nameCol}>
          <Text style={[styles.nameText, isTop3 && styles.topName]} numberOfLines={1}>
            {entry.player_name}
          </Text>
          <Text style={styles.gamesText}>{entry.games_played} games</Text>
        </View>
        <View style={styles.statCol}>
          <Text style={styles.winsText}>{entry.games_won}W</Text>
        </View>
        <View style={styles.statCol}>
          <Text style={styles.pointsText}>{entry.total_points.toLocaleString()}</Text>
          <Text style={styles.ptsLabel}>pts</Text>
        </View>
      </View>
    );
  };

  const dailyLeaderboard = dailyData?.leaderboard || [];
  const allTimeLeaderboard = allTimeData?.leaderboard || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn} testID="back-btn">
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>LEADERBOARD</Text>
        <Pressable onPress={onRefresh} style={styles.headerBtn} testID="refresh-btn">
          <Ionicons name="refresh" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabRow}>
        <Pressable
          testID="tab-daily"
          style={[styles.tab, tab === 'daily' && styles.activeTab]}
          onPress={() => setTab('daily')}
        >
          <Ionicons name="today" size={18} color={tab === 'daily' ? '#fff' : '#666'} />
          <Text style={[styles.tabText, tab === 'daily' && styles.activeTabText]}>Today</Text>
        </Pressable>
        <Pressable
          testID="tab-alltime"
          style={[styles.tab, tab === 'alltime' && styles.activeTab]}
          onPress={() => setTab('alltime')}
        >
          <Ionicons name="stats-chart" size={18} color={tab === 'alltime' ? '#fff' : '#666'} />
          <Text style={[styles.tabText, tab === 'alltime' && styles.activeTabText]}>All Time</Text>
        </Pressable>
      </View>

      {/* Summary Banner */}
      {tab === 'daily' && dailyData && (
        <View style={styles.summaryBanner}>
          <Text style={styles.summaryDate}>
            {new Date(dailyData.date + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
          <Text style={styles.summaryGames}>{dailyData.total_games_today} games played today</Text>
          <Text style={styles.summaryRefresh}>Resets at midnight UTC</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2196F3" />}
        >
          {/* Column Headers */}
          <View style={styles.headerRow}>
            <View style={styles.rankCol}><Text style={styles.headerLabel}>#</Text></View>
            <View style={styles.nameCol}><Text style={styles.headerLabel}>Player</Text></View>
            <View style={styles.statCol}><Text style={styles.headerLabel}>Wins</Text></View>
            <View style={styles.statCol}><Text style={styles.headerLabel}>Points</Text></View>
          </View>

          {tab === 'daily' ? (
            dailyLeaderboard.length > 0 ? (
              dailyLeaderboard.map((entry, i) => renderDailyRow(entry, i))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="dice" size={48} color="#333" />
                <Text style={styles.emptyTitle}>No games today yet!</Text>
                <Text style={styles.emptySubtext}>Play a game to appear on the daily leaderboard</Text>
                <Pressable
                  testID="play-now-btn"
                  style={styles.playBtn}
                  onPress={() => router.replace('/game')}
                >
                  <Text style={styles.playBtnText}>Play Now</Text>
                </Pressable>
              </View>
            )
          ) : (
            allTimeLeaderboard.length > 0 ? (
              allTimeLeaderboard.map((entry, i) => renderAllTimeRow(entry, i))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="trophy" size={48} color="#333" />
                <Text style={styles.emptyTitle}>No games played yet!</Text>
                <Text style={styles.emptySubtext}>Complete a game to join the leaderboard</Text>
              </View>
            )
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#111122',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#161625',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  activeTab: { backgroundColor: '#e91e63' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#666' },
  activeTabText: { color: '#fff' },
  summaryBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#161625',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e91e6333',
  },
  summaryDate: { fontSize: 16, fontWeight: '700', color: '#fff' },
  summaryGames: { fontSize: 13, color: '#e91e63', marginTop: 4, fontWeight: '600' },
  summaryRefresh: { fontSize: 11, color: '#555', marginTop: 4 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    marginBottom: 8,
  },
  headerLabel: { fontSize: 12, color: '#666', fontWeight: '600', textTransform: 'uppercase' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  topRow: {
    backgroundColor: '#161625',
    borderRadius: 10,
    marginBottom: 4,
    borderBottomWidth: 0,
    paddingHorizontal: 8,
  },
  rankCol: { width: 40, alignItems: 'center' },
  rankText: { fontSize: 16, fontWeight: '700', color: '#555' },
  nameCol: { flex: 1, paddingHorizontal: 8 },
  nameText: { fontSize: 15, fontWeight: '600', color: '#ccc' },
  topName: { color: '#fff', fontSize: 16 },
  gamesText: { fontSize: 11, color: '#555', marginTop: 2 },
  statCol: { width: 60, alignItems: 'center' },
  winsText: { fontSize: 16, fontWeight: '800', color: '#4CAF50' },
  pointsText: { fontSize: 14, fontWeight: '700', color: '#2196F3' },
  ptsLabel: { fontSize: 10, color: '#555' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  loadingText: { fontSize: 14, color: '#555', marginTop: 12 },
  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#555', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#444', marginTop: 8, textAlign: 'center' },
  playBtn: {
    backgroundColor: '#e91e63',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  playBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

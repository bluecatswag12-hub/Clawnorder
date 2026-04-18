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

import { BACKEND_URL } from '../utils/api';

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
          <Ionicons name="arrow-back" size={26} color="#F4E3C5" />
        </Pressable>
        <Text style={styles.headerTitle}>LEADERBOARD</Text>
        <Pressable onPress={onRefresh} style={styles.headerBtn} testID="refresh-btn">
          <Ionicons name="refresh" size={24} color="#F4E3C5" />
        </Pressable>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabRow}>
        <Pressable
          testID="tab-daily"
          style={[styles.tab, tab === 'daily' && styles.activeTab]}
          onPress={() => setTab('daily')}
        >
          <Ionicons name="today" size={18} color={tab === 'daily' ? '#F4E3C5' : '#AA7C11'} />
          <Text style={[styles.tabText, tab === 'daily' && styles.activeTabText]}>Today</Text>
        </Pressable>
        <Pressable
          testID="tab-alltime"
          style={[styles.tab, tab === 'alltime' && styles.activeTab]}
          onPress={() => setTab('alltime')}
        >
          <Ionicons name="stats-chart" size={18} color={tab === 'alltime' ? '#F4E3C5' : '#AA7C11'} />
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
          <ActivityIndicator size="large" color="#FF9E3D" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF9E3D" />}
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
                <Ionicons name="dice" size={48} color="#3D2B1F" />
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
                <Ionicons name="trophy" size={48} color="#3D2B1F" />
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
  container: { flex: 1, backgroundColor: '#1A110A' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#2C1E16',
    borderBottomWidth: 1,
    borderBottomColor: '#3D2B1F',
  },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#F4E3C5', letterSpacing: 2 },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#2C1E16',
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
  activeTab: { backgroundColor: '#D4AF37' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#AA7C11' },
  activeTabText: { color: '#F4E3C5' },
  summaryBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#2C1E16',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4AF3733',
  },
  summaryDate: { fontSize: 16, fontWeight: '700', color: '#F4E3C5' },
  summaryGames: { fontSize: 13, color: '#D4AF37', marginTop: 4, fontWeight: '600' },
  summaryRefresh: { fontSize: 11, color: '#AA7C11', marginTop: 4 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3D2B1F',
    marginBottom: 8,
  },
  headerLabel: { fontSize: 12, color: '#AA7C11', fontWeight: '600', textTransform: 'uppercase' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  topRow: {
    backgroundColor: '#2C1E16',
    borderRadius: 10,
    marginBottom: 4,
    borderBottomWidth: 0,
    paddingHorizontal: 8,
  },
  rankCol: { width: 40, alignItems: 'center' },
  rankText: { fontSize: 16, fontWeight: '700', color: '#AA7C11' },
  nameCol: { flex: 1, paddingHorizontal: 8 },
  nameText: { fontSize: 15, fontWeight: '600', color: '#F4E3C5' },
  topName: { color: '#F4E3C5', fontSize: 16 },
  gamesText: { fontSize: 11, color: '#AA7C11', marginTop: 2 },
  statCol: { width: 60, alignItems: 'center' },
  winsText: { fontSize: 16, fontWeight: '800', color: '#2E7D32' },
  pointsText: { fontSize: 14, fontWeight: '700', color: '#FF9E3D' },
  ptsLabel: { fontSize: 10, color: '#AA7C11' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  loadingText: { fontSize: 14, color: '#AA7C11', marginTop: 12 },
  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#AA7C11', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#444', marginTop: 8, textAlign: 'center' },
  playBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  playBtnText: { fontSize: 16, fontWeight: '700', color: '#F4E3C5' },
});

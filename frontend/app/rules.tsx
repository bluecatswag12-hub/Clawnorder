import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Rule = ({ left, right, color }: { left: string; right: string; color?: string }) => (
  <View style={styles.ruleRow}>
    <Text style={[styles.ruleLeft, color ? { color } : {}]}>{left}</Text>
    <Text style={styles.ruleRight}>{right}</Text>
  </View>
);

export default function Rules() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn} testID="back-btn">
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>RULES</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Section title="How to Play">
          <Text style={styles.bodyText}>1. Roll all 6 dice</Text>
          <Text style={styles.bodyText}>2. If no scoring dice appear → BUST! Lose all turn points</Text>
          <Text style={styles.bodyText}>3. Tap scoring dice to select them</Text>
          <Text style={styles.bodyText}>4. Choose: Keep & Roll (re-roll remaining) or Bank (save points)</Text>
          <Text style={styles.bodyText}>5. First player to hit the target score wins!</Text>
        </Section>

        <Section title="Hot Hand">
          <Text style={styles.highlight}>Score all 6 dice in one turn → Hot Hand!</Text>
          <Text style={styles.bodyText}>Choose to bank your points and pass, or bank and continue rolling with a fresh set of 6 dice.</Text>
        </Section>

        <Section title="Single Dice">
          <Rule left="1" right="100 pts" color="#4CAF50" />
          <Rule left="5" right="50 pts" color="#4CAF50" />
          <Text style={styles.note}>2, 3, 4, 6 alone are worth nothing</Text>
        </Section>

        <Section title="Three of a Kind">
          <Rule left="111" right="1,000 pts" color="#e91e63" />
          <Rule left="222" right="200 pts" />
          <Rule left="333" right="300 pts" />
          <Rule left="444" right="400 pts" />
          <Rule left="555" right="500 pts" color="#e91e63" />
          <Rule left="666" right="600 pts" />
        </Section>

        <Section title="Extra Dice Multiplier">
          <Text style={styles.bodyText}>Each extra die beyond 3 of a kind doubles the score:</Text>
          <Rule left="2222 (4 dice)" right="200 × 2 = 400 pts" color="#ff9800" />
          <Rule left="22222 (5 dice)" right="200 × 4 = 800 pts" color="#ff9800" />
          <Rule left="222222 (6 dice)" right="200 × 8 = 1,600 pts" color="#ff9800" />
          <Rule left="1111 (4 ones)" right="1,000 × 2 = 2,000 pts" color="#ff9800" />
        </Section>

        <Section title="Straights">
          <Rule left="1-2-3-4-5" right="500 pts" color="#2196F3" />
          <Rule left="2-3-4-5-6" right="750 pts" color="#2196F3" />
          <Rule left="1-2-3-4-5-6" right="1,500 pts" color="#2196F3" />
          <Text style={styles.note}>Straights can combine with leftover 1s or 5s</Text>
        </Section>

        <Section title="Win Modes">
          <Rule left="Noobs" right="1,500 pts" color="#4CAF50" />
          <Rule left="OGs" right="3,000 pts" color="#2196F3" />
          <Rule left="Panthers" right="5,000 pts" color="#e91e63" />
        </Section>

        <Section title="BUST">
          <Text style={styles.highlight}>If you roll and NO dice are scoring (no 1s, 5s, or combos), it's a BUST!</Text>
          <Text style={styles.bodyText}>You lose ALL points accumulated this turn and your turn ends.</Text>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#111122', borderBottomWidth: 1, borderBottomColor: '#222' },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 24, backgroundColor: '#161625', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#222' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12 },
  bodyText: { fontSize: 14, color: '#aaa', lineHeight: 22, marginBottom: 6 },
  highlight: { fontSize: 14, color: '#ff9800', fontWeight: '700', lineHeight: 22, marginBottom: 6 },
  note: { fontSize: 12, color: '#666', fontStyle: 'italic', marginTop: 8 },
  ruleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1a1a2e' },
  ruleLeft: { fontSize: 16, fontWeight: '700', color: '#ccc', letterSpacing: 1 },
  ruleRight: { fontSize: 14, fontWeight: '600', color: '#888' },
});

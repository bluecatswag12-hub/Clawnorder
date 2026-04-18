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
          <Ionicons name="arrow-back" size={26} color="#F4E3C5" />
        </Pressable>
        <Text style={styles.headerTitle}>RULES</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Section title="How to Play">
          <Text style={styles.bodyText}>1. Cast all 6 bones</Text>
          <Text style={styles.bodyText}>2. If no scoring bones appear → CURSED! Lose all turn gold</Text>
          <Text style={styles.bodyText}>3. Tap scoring bones to select them</Text>
          <Text style={styles.bodyText}>4. Choose: Keep & Cast (re-roll remaining) or Hoard (save gold)</Text>
          <Text style={styles.bodyText}>5. First player to hit the target gold wins!</Text>
        </Section>

        <Section title="Dragon's Favor">
          <Text style={styles.highlight}>Score all 6 bones in one turn → Dragon's Favor!</Text>
          <Text style={styles.bodyText}>Choose to hoard your gold and pass, or hoard and continue casting with a fresh set of 6 bones.</Text>
        </Section>

        <Section title="Single Bones">
          <Rule left="1" right="100 gold" color="#2E7D32" />
          <Rule left="5" right="50 gold" color="#2E7D32" />
          <Text style={styles.note}>2, 3, 4, 6 alone are worth nothing</Text>
        </Section>

        <Section title="Three of a Kind">
          <Rule left="111" right="1,000 gold" color="#D4AF37" />
          <Rule left="222" right="200 gold" />
          <Rule left="333" right="300 gold" />
          <Rule left="444" right="400 gold" />
          <Rule left="555" right="500 gold" color="#D4AF37" />
          <Rule left="666" right="600 gold" />
        </Section>

        <Section title="Extra Dice Multiplier">
          <Text style={styles.bodyText}>Each extra die beyond 3 of a kind doubles the score:</Text>
          <Rule left="2222 (4 dice)" right="200 × 2 = 400 gold" color="#FF9E3D" />
          <Rule left="22222 (5 dice)" right="200 × 4 = 800 gold" color="#FF9E3D" />
          <Rule left="222222 (6 dice)" right="200 × 8 = 1,600 gold" color="#FF9E3D" />
          <Rule left="1111 (4 ones)" right="1,000 × 2 = 2,000 gold" color="#FF9E3D" />
        </Section>

        <Section title="Straights">
          <Rule left="1-2-3-4-5" right="500 gold" color="#FF9E3D" />
          <Rule left="2-3-4-5-6" right="750 gold" color="#FF9E3D" />
          <Rule left="1-2-3-4-5-6" right="1,500 gold" color="#FF9E3D" />
          <Text style={styles.note}>Straights can combine with leftover 1s or 5s</Text>
        </Section>

        <Section title="Thy Challenge">
          <Rule left="Peasants" right="1,500 gold" color="#2E7D32" />
          <Rule left="Knights" right="3,000 gold" color="#FF9E3D" />
          <Rule left="Royals" right="5,000 gold" color="#D4AF37" />
        </Section>

        <Section title="CURSED!">
          <Text style={styles.highlight}>If you cast and NO bones are scoring (no 1s, 5s, or combos), you are CURSED!</Text>
          <Text style={styles.bodyText}>You lose ALL gold accumulated this turn and your turn ends.</Text>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A110A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#2C1E16', borderBottomWidth: 1, borderBottomColor: '#3D2B1F' },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#F4E3C5', letterSpacing: 2 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 24, backgroundColor: '#2C1E16', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#3D2B1F' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#F4E3C5', marginBottom: 12 },
  bodyText: { fontSize: 14, color: '#E8D3A2', lineHeight: 22, marginBottom: 6 },
  highlight: { fontSize: 14, color: '#FF9E3D', fontWeight: '700', lineHeight: 22, marginBottom: 6 },
  note: { fontSize: 12, color: '#AA7C11', fontStyle: 'italic', marginTop: 8 },
  ruleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1a1a2e' },
  ruleLeft: { fontSize: 16, fontWeight: '700', color: '#F4E3C5', letterSpacing: 1 },
  ruleRight: { fontSize: 14, fontWeight: '600', color: '#C8AC70' },
});

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useGameStore, WIN_THRESHOLDS, WIN_MODE_LABELS } from '../store/gameStore';
import { BACKEND_URL } from '../utils/api';
import { Dice } from '../components/Dice';
import { ScoreBoard } from '../components/ScoreBoard';
import { WinnerModal } from '../components/WinnerModal';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { recordMilestone } from './dice-shop';
import { useAudio } from '../utils/AudioProvider';

export default function Game() {
  const {
    players,
    currentPlayerIndex,
    diceValues,
    diceCount,
    selectedDice,
    keptDice,
    turnPhase,
    currentRollScore,
    currentRollBreakdown,
    lastSelectionScore,
    lastSelectionBreakdown,
    winner,
    isRolling,
    winMode,
    hasRolled,
    rollDiceAction,
    toggleDieSelection,
    confirmSelection,
    bankPoints,
    bankAndContinue,
    resetGame,
  } = useGameStore();

  const currentPlayer = players[currentPlayerIndex];
  const hasSelectedAny = selectedDice.some(Boolean);
  const canConfirmSelection = lastSelectionScore > 0 && hasSelectedAny;
  const canBank = currentPlayer.currentTurnScore > 0 && (turnPhase === 'rolling' || turnPhase === 'hothand');
  const canRoll = turnPhase === 'rolling' && !isRolling && !winner;

  const handleRollDice = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    sfxRoll();
    rollDiceAction();
  };

  const handleToggleDie = (index: number) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    sfxSelect();
    toggleDieSelection(index);
  };

  const handleConfirmSelection = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    sfxScore();
    confirmSelection();
  };

  const handleBankPoints = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
    sfxScore();
    bankPoints();
  };

  const handleBankAndContinue = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
    sfxScore();
    bankAndContinue();
  };

  const handlePlayAgain = () => resetGame();

  const { stopAllMusic, playTitleMusic, playIngameMusic, sfxRoll, sfxScore, sfxCursed, sfxVictory, sfxSelect } = useAudio();

  const handleBackToMenu = () => {
    resetGame();
    playTitleMusic();
    router.replace('/');
  };

  const handleViewLeaderboard = () => {
    resetGame();
    playTitleMusic();
    router.replace('/leaderboard');
  };

  // Play ingame music when game starts
  useEffect(() => {
    playIngameMusic();
    return () => { playTitleMusic(); };
  }, []);

  // Auto-save game when there's a winner + record first_win milestone
  const savedRef = useRef(false);
  useEffect(() => {
    if (winner && !savedRef.current) {
      savedRef.current = true;
      recordMilestone('first_win');
      // Save game to backend - support any number of players
      const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);
      fetch(`${BACKEND_URL}/api/games/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player1_name: sorted[0]?.name || 'P1',
          player2_name: sorted[1]?.name || 'P2',
          player1_score: sorted[0]?.totalScore || 0,
          player2_score: sorted[1]?.totalScore || 0,
          winner_name: winner,
          win_mode: winMode,
        }),
      }).catch(e => console.error('Failed to save game:', e));
    }
    if (!winner) {
      savedRef.current = false;
    }
  }, [winner]);

  // Record hot hand milestone
  useEffect(() => {
    if (turnPhase === 'hothand') {
      recordMilestone('first_hothand');
    }
  }, [turnPhase]);

  // Record full straight milestone when breakdown contains 123456
  useEffect(() => {
    if (currentRollBreakdown.some(b => b.includes('123456'))) {
      recordMilestone('first_straight');
    }
  }, [currentRollBreakdown]);

  const handleQuit = () => {
    Alert.alert('Quit Game', 'Progress will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Quit', style: 'destructive', onPress: handleBackToMenu },
    ]);
  };

  // Cursed SFX + stop ingame music
  useEffect(() => {
    if (turnPhase === 'bust') {
      sfxCursed();
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch (e) {}
    }
  }, [turnPhase]);

  // Victory SFX + stop ingame music
  useEffect(() => {
    if (winner) {
      stopAllMusic();
      sfxVictory();
    }
  }, [winner]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleQuit} style={styles.headerBtn} testID="quit-btn">
          <Ionicons name="close" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>CLAW & ORDER</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Scoreboard */}
        <ScoreBoard
          players={players}
          currentPlayerIndex={currentPlayerIndex}
          winMode={winMode}
        />

        {/* Turn indicator */}
        <View style={styles.turnSection}>
          <Text style={styles.turnLabel}>{currentPlayer.name}'s Turn</Text>
          {currentPlayer.currentTurnScore > 0 && (
            <Text style={styles.turnAccum}>Accumulated: {currentPlayer.currentTurnScore} pts</Text>
          )}
        </View>

        {/* Kept Dice display */}
        {keptDice.length > 0 && (
          <View style={styles.keptSection}>
            <Text style={styles.keptLabel}>Kept Dice</Text>
            <View style={styles.keptDiceRow}>
              {keptDice.map((val, i) => (
                <View key={i} style={styles.keptDie}>
                  <Text style={styles.keptDieText}>{val}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Dice Area */}
        <View style={styles.diceArea}>
          {diceValues.length === 0 && turnPhase === 'rolling' && (
            <View style={styles.rollPrompt}>
              <Ionicons name="dice" size={48} color="#444" />
              <Text style={styles.rollPromptText}>
                {hasRolled ? 'Roll remaining dice!' : 'Roll the dice to start!'}
              </Text>
            </View>
          )}

          {diceValues.length > 0 && (
            <View style={styles.diceGrid}>
              {diceValues.map((value, index) => (
                <Dice
                  key={`${index}-${value}`}
                  value={value}
                  isRolling={isRolling}
                  isSelected={selectedDice[index] || false}
                  isScoring={true}
                  onPress={() => handleToggleDie(index)}
                  disabled={turnPhase !== 'selecting'}
                  index={index}
                />
              ))}
            </View>
          )}

          {/* Selection Preview */}
          {turnPhase === 'selecting' && (
            <View style={styles.selectionPreview}>
              {lastSelectionScore > 0 ? (
                <>
                  <Text style={styles.previewScore}>+{lastSelectionScore} pts</Text>
                  {lastSelectionBreakdown.map((b, i) => (
                    <Text key={i} style={styles.previewBreakdown}>{b}</Text>
                  ))}
                </>
              ) : lastSelectionBreakdown.length > 0 ? (
                <Text style={styles.previewError}>{lastSelectionBreakdown[0]}</Text>
              ) : (
                <Text style={styles.previewHint}>Tap dice to select them</Text>
              )}
            </View>
          )}

          {/* Last Roll Score */}
          {currentRollScore > 0 && turnPhase !== 'selecting' && (
            <View style={styles.lastRollInfo}>
              <Text style={styles.lastRollTitle}>Last kept: +{currentRollScore}</Text>
              {currentRollBreakdown.map((b, i) => (
                <Text key={i} style={styles.lastRollBreak}>{b}</Text>
              ))}
            </View>
          )}

          {/* BUST Display */}
          {turnPhase === 'bust' && (
            <View style={styles.bustBox}>
              <Ionicons name="close-circle" size={48} color="#FF5722" />
              <Text style={styles.bustText}>CURSED!</Text>
              <Text style={styles.bustSub}>No scoring bones — turn lost!</Text>
            </View>
          )}

          {/* Hot Hand Display */}
          {turnPhase === 'hothand' && (
            <View style={styles.hotHandBox}>
              <Ionicons name="flame" size={48} color="#ff9800" />
              <Text style={styles.hotHandText}>DRAGON'S FAVOR!</Text>
              <Text style={styles.hotHandSub}>All bones scored! Hoard or cast fresh 6!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Controls */}
      <View style={styles.controls}>
        {turnPhase === 'selecting' && (
          <>
            <Pressable
              testID="confirm-selection-btn"
              style={[styles.ctrlBtn, styles.confirmBtn, !canConfirmSelection && styles.disabledBtn]}
              onPress={handleConfirmSelection}
              disabled={!canConfirmSelection}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={24} color="#fff" />
              <Text style={styles.ctrlText}>Keep & Cast</Text>
            </Pressable>
            {currentPlayer.currentTurnScore > 0 && (
              <Pressable
                testID="bank-from-select-btn"
                style={[styles.ctrlBtn, styles.bankBtn]}
                onPress={() => {
                  if (canConfirmSelection) {
                    confirmSelection();
                    setTimeout(() => bankPoints(), 100);
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-bitcoin" size={24} color="#fff" />
                <Text style={styles.ctrlText}>Keep & Hoard</Text>
              </Pressable>
            )}
          </>
        )}

        {turnPhase === 'rolling' && (
          <>
            <Pressable
              testID="roll-dice-btn"
              style={[styles.ctrlBtn, styles.rollBtn, !canRoll && styles.disabledBtn]}
              onPress={handleRollDice}
              disabled={!canRoll}
              activeOpacity={0.8}
            >
              <Ionicons name="dice" size={24} color="#fff" />
              <Text style={styles.ctrlText}>
                {hasRolled ? `Cast ${diceCount} Bones` : 'Cast the Bones'}
              </Text>
            </Pressable>
            {canBank && (
              <Pressable
                testID="bank-points-btn"
                style={[styles.ctrlBtn, styles.bankBtn]}
                onPress={handleBankPoints}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-bitcoin" size={24} color="#fff" />
                <Text style={styles.ctrlText}>Hoard {currentPlayer.currentTurnScore}</Text>
              </Pressable>
            )}
          </>
        )}

        {turnPhase === 'hothand' && (
          <>
            <Pressable
              testID="bank-continue-btn"
              style={[styles.ctrlBtn, styles.hotHandBtn]}
              onPress={handleBankAndContinue}
              activeOpacity={0.8}
            >
              <Ionicons name="flame" size={24} color="#fff" />
              <Text style={styles.ctrlText}>Hoard & Continue</Text>
            </Pressable>
            <Pressable
              testID="bank-pass-btn"
              style={[styles.ctrlBtn, styles.bankBtn]}
              onPress={handleBankPoints}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-bitcoin" size={24} color="#fff" />
              <Text style={styles.ctrlText}>Hoard & Pass</Text>
            </Pressable>
          </>
        )}
      </View>

      <WinnerModal
        visible={!!winner}
        winnerName={winner || ''}
        winMode={winMode}
        players={players}
        onPlayAgain={handlePlayAgain}
        onBackToMenu={handleBackToMenu}
        onViewLeaderboard={handleViewLeaderboard}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A110A',
  },
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
  headerBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  turnSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  turnLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F4E3C5',
  },
  turnAccum: {
    fontSize: 14,
    color: '#FF9E3D',
    fontWeight: '600',
    marginTop: 4,
  },
  keptSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  keptLabel: {
    fontSize: 12,
    color: '#AA7C11',
    fontWeight: '600',
    marginBottom: 6,
  },
  keptDiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  keptDie: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#3D2B1F',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  keptDieText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '700',
  },
  diceArea: {
    alignItems: 'center',
    paddingVertical: 16,
    minHeight: 200,
  },
  rollPrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  rollPromptText: {
    fontSize: 16,
    color: '#AA7C11',
    marginTop: 12,
    fontWeight: '600',
  },
  diceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 280,
    paddingVertical: 8,
  },
  selectionPreview: {
    marginTop: 16,
    alignItems: 'center',
    backgroundColor: '#2C1E16',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3D2B1F',
    minWidth: 200,
  },
  previewScore: {
    fontSize: 24,
    fontWeight: '800',
    color: '#D4AF37',
  },
  previewBreakdown: {
    fontSize: 13,
    color: '#AA7C11',
    marginTop: 2,
  },
  previewError: {
    fontSize: 13,
    color: '#B22222',
    fontWeight: '600',
  },
  previewHint: {
    fontSize: 13,
    color: '#AA7C11',
    fontStyle: 'italic',
  },
  lastRollInfo: {
    marginTop: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4AF3744',
  },
  lastRollTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D4AF37',
  },
  lastRollBreak: {
    fontSize: 12,
    color: '#AA7C11',
    marginTop: 2,
  },
  bustBox: {
    alignItems: 'center',
    marginTop: 16,
    padding: 24,
    backgroundColor: 'rgba(139, 0, 0, 0.15)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#8B0000',
  },
  bustText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#B22222',
    marginTop: 8,
  },
  bustSub: {
    fontSize: 14,
    color: '#B22222',
    marginTop: 4,
  },
  hotHandBox: {
    alignItems: 'center',
    marginTop: 16,
    padding: 24,
    backgroundColor: 'rgba(255, 158, 61, 0.12)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FF9E3D',
  },
  hotHandText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FF9E3D',
    marginTop: 8,
  },
  hotHandSub: {
    fontSize: 14,
    color: '#FF9E3D',
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#2C1E16',
    borderTopWidth: 1,
    borderTopColor: '#3D2B1F',
  },
  ctrlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  rollBtn: {
    backgroundColor: '#FF9E3D',
  },
  bankBtn: {
    backgroundColor: '#D4AF37',
  },
  confirmBtn: {
    backgroundColor: '#8B0000',
  },
  hotHandBtn: {
    backgroundColor: '#FF9E3D',
  },
  disabledBtn: {
    backgroundColor: '#3D2B1F',
    opacity: 0.5,
  },
  ctrlText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A110A',
  },
});

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
import { getScoringHints } from '../utils/gameLogic';
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
  const scoringHints = diceValues.length > 0 ? getScoringHints(diceValues) : [];
  const hasSelectedAny = selectedDice.some(Boolean);
  const canConfirmSelection = lastSelectionScore > 0 && hasSelectedAny;
  const canBank = currentPlayer.currentTurnScore > 0 && (turnPhase === 'rolling' || turnPhase === 'hothand');
  const canRoll = turnPhase === 'rolling' && !isRolling && !winner;

  const handleRollDice = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    rollDiceAction();
  };

  const handleToggleDie = (index: number) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    toggleDieSelection(index);
  };

  const handleConfirmSelection = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    confirmSelection();
  };

  const handleBankPoints = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
    bankPoints();
  };

  const handleBankAndContinue = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
    bankAndContinue();
  };

  const handlePlayAgain = () => resetGame();

  const { stopMusic, playMusic } = useAudio();

  const handleBackToMenu = () => {
    resetGame();
    playMusic();
    router.replace('/');
  };

  const handleViewLeaderboard = () => {
    resetGame();
    playMusic();
    router.replace('/leaderboard');
  };

  // Stop bg music when game starts
  useEffect(() => {
    stopMusic();
    return () => { playMusic(); };
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

  useEffect(() => {
    if (turnPhase === 'bust') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {}
    }
  }, [turnPhase]);

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
                  isScoring={scoringHints[index] || false}
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
                <Text style={styles.previewHint}>Tap scoring dice to select them</Text>
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
              <Text style={styles.bustText}>BUST!</Text>
              <Text style={styles.bustSub}>No scoring dice — turn lost!</Text>
            </View>
          )}

          {/* Hot Hand Display */}
          {turnPhase === 'hothand' && (
            <View style={styles.hotHandBox}>
              <Ionicons name="flame" size={48} color="#ff9800" />
              <Text style={styles.hotHandText}>HOT HAND!</Text>
              <Text style={styles.hotHandSub}>All dice scored! Bank or roll fresh 6!</Text>
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
              <Text style={styles.ctrlText}>Keep & Roll</Text>
            </Pressable>
            {currentPlayer.currentTurnScore > 0 && (
              <Pressable
                testID="bank-from-select-btn"
                style={[styles.ctrlBtn, styles.bankBtn]}
                onPress={() => {
                  // Need to confirm selection first then bank
                  if (canConfirmSelection) {
                    confirmSelection();
                    setTimeout(() => bankPoints(), 100);
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="wallet" size={24} color="#fff" />
                <Text style={styles.ctrlText}>Keep & Bank</Text>
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
                {hasRolled ? `Roll ${diceCount} Dice` : 'Roll Dice'}
              </Text>
            </Pressable>
            {canBank && (
              <Pressable
                testID="bank-points-btn"
                style={[styles.ctrlBtn, styles.bankBtn]}
                onPress={handleBankPoints}
                activeOpacity={0.8}
              >
                <Ionicons name="wallet" size={24} color="#fff" />
                <Text style={styles.ctrlText}>Bank {currentPlayer.currentTurnScore}</Text>
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
              <Text style={styles.ctrlText}>Bank & Continue</Text>
            </Pressable>
            <Pressable
              testID="bank-pass-btn"
              style={[styles.ctrlBtn, styles.bankBtn]}
              onPress={handleBankPoints}
              activeOpacity={0.8}
            >
              <Ionicons name="wallet" size={24} color="#fff" />
              <Text style={styles.ctrlText}>Bank & Pass</Text>
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
    backgroundColor: '#0d0d1a',
  },
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
  headerBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
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
    color: '#fff',
  },
  turnAccum: {
    fontSize: 14,
    color: '#ff9800',
    fontWeight: '600',
    marginTop: 4,
  },
  keptSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  keptLabel: {
    fontSize: 12,
    color: '#666',
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
    backgroundColor: '#2a3f5f',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  keptDieText: {
    color: '#4CAF50',
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
    color: '#555',
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
    backgroundColor: '#161625',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    minWidth: 200,
  },
  previewScore: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4CAF50',
  },
  previewBreakdown: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  previewError: {
    fontSize: 13,
    color: '#FF5722',
    fontWeight: '600',
  },
  previewHint: {
    fontSize: 13,
    color: '#555',
    fontStyle: 'italic',
  },
  lastRollInfo: {
    marginTop: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4CAF5044',
  },
  lastRollTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  lastRollBreak: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  bustBox: {
    alignItems: 'center',
    marginTop: 16,
    padding: 24,
    backgroundColor: 'rgba(255, 87, 34, 0.12)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FF5722',
  },
  bustText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FF5722',
    marginTop: 8,
  },
  bustSub: {
    fontSize: 14,
    color: '#FF5722',
    marginTop: 4,
  },
  hotHandBox: {
    alignItems: 'center',
    marginTop: 16,
    padding: 24,
    backgroundColor: 'rgba(255, 152, 0, 0.12)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ff9800',
  },
  hotHandText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ff9800',
    marginTop: 8,
  },
  hotHandSub: {
    fontSize: 14,
    color: '#ff9800',
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#111122',
    borderTopWidth: 1,
    borderTopColor: '#222',
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
    backgroundColor: '#2196F3',
  },
  bankBtn: {
    backgroundColor: '#4CAF50',
  },
  confirmBtn: {
    backgroundColor: '#e91e63',
  },
  hotHandBtn: {
    backgroundColor: '#ff9800',
  },
  disabledBtn: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  ctrlText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

import { create } from 'zustand';
import { rollDice, calculateSelectedScore, hasAnyScoringDice } from '../utils/gameLogic';

export type GameMode = 'menu' | 'local' | 'online';
export type WinMode = 'noobs' | 'ogs' | 'panthers';

export const WIN_THRESHOLDS: Record<WinMode, number> = {
  noobs: 1500,
  ogs: 3000,
  panthers: 5000,
};

export const WIN_MODE_LABELS: Record<WinMode, string> = {
  noobs: 'Noobs',
  ogs: 'OGs',
  panthers: 'Panthers',
};

export interface Player {
  name: string;
  totalScore: number;
  currentTurnScore: number;
}

export type TurnPhase = 'rolling' | 'selecting' | 'bust' | 'hothand';

export interface GameState {
  mode: GameMode;
  winMode: WinMode;
  players: [Player, Player];
  currentPlayerIndex: 0 | 1;
  diceValues: number[];
  diceCount: number; // how many dice to roll (decreases as dice are kept)
  selectedDice: boolean[]; // which dice are selected by player
  keptDice: number[]; // dice kept from previous selections this turn
  turnPhase: TurnPhase;
  currentRollScore: number;
  currentRollBreakdown: string[];
  lastSelectionScore: number;
  lastSelectionBreakdown: string[];
  winner: string | null;
  isRolling: boolean;
  gameId: string | null;
  hasRolled: boolean; // whether the player has rolled this turn

  // Actions
  setMode: (mode: GameMode) => void;
  setWinMode: (winMode: WinMode) => void;
  setPlayerNames: (player1: string, player2: string) => void;
  rollDiceAction: () => void;
  toggleDieSelection: (index: number) => void;
  confirmSelection: () => void;
  bankPoints: () => void;
  bankAndContinue: () => void;
  switchTurn: () => void;
  resetGame: () => void;
  setGameId: (id: string | null) => void;
  updateFromServer: (data: any) => void;
}

const initialPlayers: [Player, Player] = [
  { name: 'Player 1', totalScore: 0, currentTurnScore: 0 },
  { name: 'Player 2', totalScore: 0, currentTurnScore: 0 },
];

export const useGameStore = create<GameState>((set, get) => ({
  mode: 'menu',
  winMode: 'ogs',
  players: initialPlayers,
  currentPlayerIndex: 0,
  diceValues: [],
  diceCount: 6,
  selectedDice: [],
  keptDice: [],
  turnPhase: 'rolling',
  currentRollScore: 0,
  currentRollBreakdown: [],
  lastSelectionScore: 0,
  lastSelectionBreakdown: [],
  winner: null,
  isRolling: false,
  gameId: null,
  hasRolled: false,

  setMode: (mode) => set({ mode }),
  setWinMode: (winMode) => set({ winMode }),

  setPlayerNames: (player1, player2) => {
    set((state) => ({
      players: [
        { ...state.players[0], name: player1 || 'Player 1' },
        { ...state.players[1], name: player2 || 'Player 2' },
      ],
    }));
  },

  rollDiceAction: () => {
    const state = get();
    if (state.isRolling || state.winner) return;

    set({ isRolling: true });

    setTimeout(() => {
      const newDice = rollDice(state.diceCount);
      const isBust = !hasAnyScoringDice(newDice);

      if (isBust) {
        // BUST - lose all current turn points
        set((s) => ({
          diceValues: newDice,
          selectedDice: new Array(newDice.length).fill(false),
          turnPhase: 'bust',
          currentRollScore: 0,
          currentRollBreakdown: ['BUST! No scoring dice!'],
          lastSelectionScore: 0,
          lastSelectionBreakdown: [],
          isRolling: false,
          hasRolled: true,
          players: s.players.map((p, i) =>
            i === s.currentPlayerIndex
              ? { ...p, currentTurnScore: 0 }
              : p
          ) as [Player, Player],
        }));

        // Auto-switch turn after showing bust
        setTimeout(() => {
          get().switchTurn();
        }, 2000);
      } else {
        set({
          diceValues: newDice,
          selectedDice: new Array(newDice.length).fill(false),
          turnPhase: 'selecting',
          currentRollScore: 0,
          currentRollBreakdown: [],
          lastSelectionScore: 0,
          lastSelectionBreakdown: [],
          isRolling: false,
          hasRolled: true,
        });
      }
    }, 600);
  },

  toggleDieSelection: (index) => {
    const state = get();
    if (state.turnPhase !== 'selecting') return;

    const newSelected = [...state.selectedDice];
    newSelected[index] = !newSelected[index];

    // Calculate preview score for selected dice
    const selectedValues = state.diceValues.filter((_, i) => newSelected[i]);
    let preview = { score: 0, breakdown: [] as string[], isValid: false };
    if (selectedValues.length > 0) {
      preview = calculateSelectedScore(selectedValues);
    }

    set({
      selectedDice: newSelected,
      lastSelectionScore: preview.isValid ? preview.score : 0,
      lastSelectionBreakdown: preview.isValid ? preview.breakdown : (selectedValues.length > 0 ? [preview.errorMessage || 'Invalid selection'] : []),
    });
  },

  confirmSelection: () => {
    const state = get();
    const selectedValues = state.diceValues.filter((_, i) => state.selectedDice[i]);
    const result = calculateSelectedScore(selectedValues);

    if (!result.isValid) return;

    const currentPlayer = state.players[state.currentPlayerIndex];
    const newTurnScore = currentPlayer.currentTurnScore + result.score;
    const remainingDice = state.diceValues.filter((_, i) => !state.selectedDice[i]);
    const newKeptDice = [...state.keptDice, ...selectedValues];

    // Check if all dice are used (hot hand!)
    if (remainingDice.length === 0) {
      set((s) => ({
        turnPhase: 'hothand',
        keptDice: newKeptDice,
        diceCount: 6,
        currentRollScore: result.score,
        currentRollBreakdown: result.breakdown,
        players: s.players.map((p, i) =>
          i === s.currentPlayerIndex
            ? { ...p, currentTurnScore: newTurnScore }
            : p
        ) as [Player, Player],
      }));
    } else {
      set((s) => ({
        keptDice: newKeptDice,
        diceCount: remainingDice.length,
        diceValues: remainingDice,
        selectedDice: new Array(remainingDice.length).fill(false),
        currentRollScore: result.score,
        currentRollBreakdown: result.breakdown,
        lastSelectionScore: 0,
        lastSelectionBreakdown: [],
        turnPhase: 'rolling', // ready to roll again or bank
        players: s.players.map((p, i) =>
          i === s.currentPlayerIndex
            ? { ...p, currentTurnScore: newTurnScore }
            : p
        ) as [Player, Player],
      }));
    }
  },

  bankPoints: () => {
    const state = get();
    const currentPlayer = state.players[state.currentPlayerIndex];
    const newTotalScore = currentPlayer.totalScore + currentPlayer.currentTurnScore;
    const threshold = WIN_THRESHOLDS[state.winMode];

    if (newTotalScore >= threshold) {
      set({
        players: state.players.map((p, i) =>
          i === state.currentPlayerIndex
            ? { ...p, totalScore: newTotalScore, currentTurnScore: 0 }
            : p
        ) as [Player, Player],
        winner: currentPlayer.name,
      });
    } else {
      set({
        players: state.players.map((p, i) =>
          i === state.currentPlayerIndex
            ? { ...p, totalScore: newTotalScore, currentTurnScore: 0 }
            : p
        ) as [Player, Player],
      });
      get().switchTurn();
    }
  },

  bankAndContinue: () => {
    // Hot hand: bank current turn points and continue with fresh 6 dice
    const state = get();
    const currentPlayer = state.players[state.currentPlayerIndex];
    const newTotalScore = currentPlayer.totalScore + currentPlayer.currentTurnScore;
    const threshold = WIN_THRESHOLDS[state.winMode];

    if (newTotalScore >= threshold) {
      set({
        players: state.players.map((p, i) =>
          i === state.currentPlayerIndex
            ? { ...p, totalScore: newTotalScore, currentTurnScore: 0 }
            : p
        ) as [Player, Player],
        winner: currentPlayer.name,
      });
    } else {
      set({
        diceValues: [],
        selectedDice: [],
        keptDice: [],
        diceCount: 6,
        turnPhase: 'rolling',
        currentRollScore: 0,
        currentRollBreakdown: [],
        lastSelectionScore: 0,
        lastSelectionBreakdown: [],
        hasRolled: false,
        players: state.players.map((p, i) =>
          i === state.currentPlayerIndex
            ? { ...p, totalScore: newTotalScore, currentTurnScore: 0 }
            : p
        ) as [Player, Player],
      });
    }
  },

  switchTurn: () => {
    set((state) => ({
      currentPlayerIndex: state.currentPlayerIndex === 0 ? 1 : 0,
      players: state.players.map((p) => ({
        ...p,
        currentTurnScore: 0,
      })) as [Player, Player],
      diceValues: [],
      diceCount: 6,
      selectedDice: [],
      keptDice: [],
      turnPhase: 'rolling',
      currentRollScore: 0,
      currentRollBreakdown: [],
      lastSelectionScore: 0,
      lastSelectionBreakdown: [],
      isBust: false,
      hasRolled: false,
    }));
  },

  resetGame: () => {
    set({
      players: [
        { name: get().players[0].name, totalScore: 0, currentTurnScore: 0 },
        { name: get().players[1].name, totalScore: 0, currentTurnScore: 0 },
      ],
      currentPlayerIndex: 0,
      diceValues: [],
      diceCount: 6,
      selectedDice: [],
      keptDice: [],
      turnPhase: 'rolling',
      currentRollScore: 0,
      currentRollBreakdown: [],
      lastSelectionScore: 0,
      lastSelectionBreakdown: [],
      winner: null,
      isRolling: false,
      gameId: null,
      hasRolled: false,
    });
  },

  setGameId: (id) => set({ gameId: id }),

  updateFromServer: (data) => {
    set({
      players: data.players,
      currentPlayerIndex: data.currentPlayerIndex,
      diceValues: data.diceValues || get().diceValues,
      diceCount: data.diceCount || get().diceCount,
      selectedDice: data.selectedDice || [],
      keptDice: data.keptDice || [],
      turnPhase: data.turnPhase || 'rolling',
      currentRollScore: data.currentRollScore || 0,
      currentRollBreakdown: data.currentRollBreakdown || [],
      winner: data.winner || null,
      hasRolled: data.hasRolled || false,
    });
  },
}));

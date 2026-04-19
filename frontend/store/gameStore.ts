import { create } from 'zustand';
import { rollDice, calculateSelectedScore, hasAnyScoringDice } from '../utils/gameLogic';

export type GameMode = 'menu' | 'local' | 'online';
export type WinMode = 'noobs' | 'ogs' | 'panthers' | 'royals';

export const WIN_THRESHOLDS: Record<WinMode, number> = { noobs: 1500, ogs: 3000, panthers: 5000, royals: 10000 };
export const WIN_MODE_LABELS: Record<WinMode, string> = { noobs: 'Peasants', ogs: 'Knights', panthers: 'Lords', royals: 'Royals' };

export interface Player {
  name: string;
  totalScore: number;
  currentTurnScore: number;
}

export type TurnPhase = 'rolling' | 'selecting' | 'bust' | 'hothand';

export interface GameState {
  mode: GameMode;
  winMode: WinMode;
  players: Player[];
  currentPlayerIndex: number;
  diceValues: number[];
  diceCount: number;
  selectedDice: boolean[];
  keptDice: number[];
  turnPhase: TurnPhase;
  currentRollScore: number;
  currentRollBreakdown: string[];
  lastSelectionScore: number;
  lastSelectionBreakdown: string[];
  winner: string | null;
  isRolling: boolean;
  gameId: string | null;
  hasRolled: boolean;

  setMode: (mode: GameMode) => void;
  setWinMode: (winMode: WinMode) => void;
  setPlayerNames: (...names: string[]) => void;
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

export const useGameStore = create<GameState>((set, get) => ({
  mode: 'menu',
  winMode: 'ogs',
  players: [
    { name: 'Player 1', totalScore: 0, currentTurnScore: 0 },
    { name: 'Player 2', totalScore: 0, currentTurnScore: 0 },
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

  setMode: (mode) => set({ mode }),
  setWinMode: (winMode) => set({ winMode }),

  setPlayerNames: (...names: string[]) => {
    set({
      players: names.map((n, i) => ({
        name: n || `Player ${i + 1}`,
        totalScore: 0,
        currentTurnScore: 0,
      })),
    });
  },

  rollDiceAction: () => {
    const state = get();
    if (state.isRolling || state.winner) return;
    set({ isRolling: true });

    setTimeout(() => {
      const newDice = rollDice(state.diceCount);
      const isBust = !hasAnyScoringDice(newDice);

      if (isBust) {
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
            i === s.currentPlayerIndex ? { ...p, currentTurnScore: 0 } : p
          ),
        }));
        setTimeout(() => { get().switchTurn(); }, 2000);
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
    const selectedValues = state.diceValues.filter((_, i) => newSelected[i]);
    let preview = { score: 0, breakdown: [] as string[], isValid: false, errorMessage: '' };
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

    const newTurnScore = state.players[state.currentPlayerIndex].currentTurnScore + result.score;
    const remaining = state.diceValues.filter((_, i) => !state.selectedDice[i]);
    const newKept = [...state.keptDice, ...selectedValues];

    if (remaining.length === 0) {
      set((s) => ({
        turnPhase: 'hothand',
        keptDice: newKept,
        diceCount: 6,
        diceValues: [],
        selectedDice: [],
        currentRollScore: result.score,
        currentRollBreakdown: result.breakdown,
        players: s.players.map((p, i) =>
          i === s.currentPlayerIndex ? { ...p, currentTurnScore: newTurnScore } : p
        ),
      }));
    } else {
      set((s) => ({
        keptDice: newKept,
        diceCount: remaining.length,
        diceValues: remaining,
        selectedDice: new Array(remaining.length).fill(false),
        currentRollScore: result.score,
        currentRollBreakdown: result.breakdown,
        lastSelectionScore: 0,
        lastSelectionBreakdown: [],
        turnPhase: 'rolling',
        players: s.players.map((p, i) =>
          i === s.currentPlayerIndex ? { ...p, currentTurnScore: newTurnScore } : p
        ),
      }));
    }
  },

  bankPoints: () => {
    const state = get();
    const cp = state.players[state.currentPlayerIndex];
    const newTotal = cp.totalScore + cp.currentTurnScore;
    const threshold = WIN_THRESHOLDS[state.winMode];

    if (newTotal >= threshold) {
      set({
        players: state.players.map((p, i) =>
          i === state.currentPlayerIndex ? { ...p, totalScore: newTotal, currentTurnScore: 0 } : p
        ),
        winner: cp.name,
      });
    } else {
      set({
        players: state.players.map((p, i) =>
          i === state.currentPlayerIndex ? { ...p, totalScore: newTotal, currentTurnScore: 0 } : p
        ),
      });
      get().switchTurn();
    }
  },

  bankAndContinue: () => {
    const state = get();
    const cp = state.players[state.currentPlayerIndex];
    const newTotal = cp.totalScore + cp.currentTurnScore;
    const threshold = WIN_THRESHOLDS[state.winMode];

    if (newTotal >= threshold) {
      set({
        players: state.players.map((p, i) =>
          i === state.currentPlayerIndex ? { ...p, totalScore: newTotal, currentTurnScore: 0 } : p
        ),
        winner: cp.name,
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
          i === state.currentPlayerIndex ? { ...p, totalScore: newTotal, currentTurnScore: 0 } : p
        ),
      });
    }
  },

  switchTurn: () => {
    set((state) => {
      const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
      return {
        currentPlayerIndex: nextIndex,
        players: state.players.map((p) => ({ ...p, currentTurnScore: 0 })),
        diceValues: [],
        diceCount: 6,
        selectedDice: [],
        keptDice: [],
        turnPhase: 'rolling',
        currentRollScore: 0,
        currentRollBreakdown: [],
        lastSelectionScore: 0,
        lastSelectionBreakdown: [],
        hasRolled: false,
      };
    });
  },

  resetGame: () => {
    set((state) => ({
      players: state.players.map((p) => ({ ...p, totalScore: 0, currentTurnScore: 0 })),
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
    }));
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

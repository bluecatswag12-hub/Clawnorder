# Dice Rush - Product Requirements Document

## Overview
Dice Rush is a 2-player dice game mobile app built with React Native (Expo) where players roll 6 dice, choose which scoring dice to keep, and race to reach the winning score threshold first.

## Game Modes
| Mode | Win Threshold | Difficulty |
|------|--------------|------------|
| **Noobs** | 1,500 pts | Easy |
| **OGs** | 3,000 pts | Medium |
| **Panthers** | 5,000 pts | Hard |

## Scoring System
| Combination | Points |
|-------------|--------|
| Single 1 | 100 |
| Single 5 | 50 |
| 111 | 1,000 |
| 555 | 500 |
| 222 | 200 |
| 333 | 300 |
| 444 | 400 |
| 666 | 600 |
| 12345 (straight) | 500 |
| 23456 (straight) | 750 |
| 123456 (full straight) | 1,500 |

### Exponential Multiplier
Extra dice beyond a triple **double** the base score:
- 3 of a kind = base score × 1
- 4 of a kind = base score × 2
- 5 of a kind = base score × 4
- 6 of a kind = base score × 8

Example: 2222 = 200 × 2 = 400, 22222 = 200 × 4 = 800

## Game Flow
1. **Roll** all available dice (starts with 6)
2. **BUST check**: If no scoring dice → lose all turn points, turn ends
3. **Select** which scoring dice to keep (tap to select)
4. **Choose action**:
   - **Keep & Roll**: Lock selected dice, re-roll remaining
   - **Keep & Bank**: Lock selected dice, add turn total to score, end turn
   - **Bank**: Add accumulated turn points to total, end turn
5. **Hot Hand**: If all 6 dice are scored → can Bank & Pass OR Bank & Continue with fresh 6 dice
6. **Win**: First player to reach the win threshold wins!

## Tech Stack
- **Frontend**: React Native / Expo SDK 54, Zustand state management, Expo Router
- **Backend**: FastAPI with MongoDB for game stats, history, and leaderboard
- **Animations**: react-native-reanimated for dice animations
- **Haptics**: expo-haptics for tactile feedback

## Features Implemented
- [x] Home screen with game mode selector (Noobs/OGs/Panthers)
- [x] Player name customization
- [x] Local multiplayer (same device)
- [x] Dice rolling with animations
- [x] Tap-to-select dice mechanic
- [x] Scoring validation (prevents selecting non-scoring dice)
- [x] BUST detection
- [x] Hot Hand bonus (clear all dice → fresh roll)
- [x] Turn switching with visual indicators
- [x] Winner modal with play again/menu options
- [x] Score breakdown display
- [x] Progress bars toward win threshold
- [x] Haptic feedback
- [x] Backend API for score validation, game history, stats, leaderboard
- [x] **Daily Leaderboard** - Shows today's wins & points, resets at midnight UTC
- [x] **All-Time Leaderboard** - Shows cumulative wins & total points
- [x] **Challenge Friends (Share)** - Share game results via native share sheet
- [x] **Auto-save Games** - Games auto-save to backend on win for leaderboard tracking
- [x] **Leaderboard Screen** - Accessible from home, Daily/All-Time tabs, pull-to-refresh

## Future Enhancements
- [ ] Online multiplayer with room codes (Socket.IO)
- [ ] Sound effects
- [ ] AI opponent mode
- [ ] Tournament mode
- [ ] Push notifications for daily leaderboard results

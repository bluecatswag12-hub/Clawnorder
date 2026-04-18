# Claw & Order: Dice Unit - Product Requirements Document

## Overview
Claw & Order: Dice Unit is a 2-5 player medieval-themed dice game mobile app where players cast 6 bones, choose which scoring dice to keep, and race to hoard enough gold to claim victory.

## Theme
**Dark Tavern Medieval** — deep browns, aged gold, candlelight orange, crimson accents. All game elements use medieval language (Cast the Bones, Hoard Gold, CURSED!, Dragon's Favor).

## Game Modes
| Mode | Win Threshold | Name |
|------|--------------|------|
| **Peasants** | 1,500 gold | Easy |
| **Knights** | 3,000 gold | Medium |
| **Royals** | 5,000 gold | Hard |

## Scoring System
| Combination | Gold |
|-------------|------|
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
Extra dice beyond triple double the base: 4-of-a-kind = ×2, 5-of-a-kind = ×4, 6-of-a-kind = ×8

## Game Flow
1. Cast all available bones (starts with 6)
2. CURSED check: no scoring dice → lose all turn gold, turn ends
3. Tap bones to select scoring ones
4. Choose: Keep & Cast (re-roll remaining) or Hoard Gold
5. Dragon's Favor: all 6 bones scored → hoard and re-roll fresh set or hoard and pass
6. First player to reach target gold wins!

## Features Implemented
- [x] Medieval dark tavern theme across ALL screens
- [x] Local multiplayer (2-5 players, same device)
- [x] Online multiplayer (REST polling, up to 5 players, room codes)
- [x] In-game chat (online games only)
- [x] Local Server browser — browse all hosted rooms
- [x] Room lock — no joining after game starts
- [x] Rejoin active game — banner on home screen if you left mid-game
- [x] Rules screen ("The Scrolls")
- [x] Hall of Champions — Daily & All-Time leaderboards
- [x] The Armoury — 5 unlockable dice colorways with milestone unlocks
- [x] Custom 8-bit audio: title music, in-game music, 4x dice rolls (randomized), dice select, keep & cast, cursed, victory
- [x] Mute toggle (persists across sessions)
- [x] Challenge a Rival — share game results via native share
- [x] Auto-save games to backend on win
- [x] EAS Build configured for Android APK
- [x] All APIs point to https://clawnorder.onrender.com

## Dice Colorways (The Armoury)
| Dice | Unlock |
|------|--------|
| Classic Ivory | Free (default) |
| Midnight Ember | Win your first game |
| Blue Buzz | Score a Dragon's Favor |
| Toxic Lime | Roll a full straight 123456 |
| The Panther (#80F2DD) | Play 5 games in 24 hours |

## Tech Stack
- **Frontend**: React Native / Expo SDK 54, Zustand, Expo Router, expo-audio
- **Backend**: FastAPI + MongoDB
- **Audio**: expo-audio with useAudioPlayer hook, streamed from CDN

# Claw & Order: Dice Unit — Changelog

## main v1.5 (Current)

---

### 🎵 Audio System
- Added **"ROLL IT UP" 8-bit theme music** — loops on all menu screens (home, rules, leaderboard, dice shop, lobbies)
- Music **auto-stops** when entering a game, **resumes** when returning to menus
- **Mute toggle** button (top-right of home screen) — persists across sessions
- Uses HTML5 Audio for web compatibility, streams from CDN (no large bundled files)

### 🎲 Dice Shop & Unlockable Colorways
- New **"Dice Shop"** screen accessible from home menu
- **5 dice colorways** with filled face colors and proper dot rendering:
  - **Classic Ivory** — White/black (free, default)
  - **Midnight Ember** — Dark navy/orange — *Unlock: Win your first game*
  - **Blue Buzz** — Deep blue/light blue — *Unlock: Score a Hot Hand*
  - **Toxic Lime** — Black/neon green — *Unlock: Roll a full straight 123456*
  - **The Panther** — Dark/aqua `#80F2DD` — *Unlock: Play 5 games in 24 hours*
- All unlocks are **permanent** (persist via AsyncStorage)
- Selected colorway applies to all dice in local and online games
- Milestone tracking auto-triggers during gameplay

### 📱 UI Restructure
- **Scoring rules** moved from home page to dedicated **Rules** screen
- **Player name entry** moved to **after** selecting Local or Online mode
- New **Local Setup** screen — pick 2-5 players, enter names, start game
- **Home screen** simplified — mode selector + 5 clean nav buttons (Local, Online, Rules, Leaderboard, Dice Shop)

### 👥 Multi-Player Support (2-5 Players)
- **Local mode** supports 2-5 players on same device
- **Online mode** supports up to 5 players per room
- **ScoreBoard** redesigned — compact horizontal scroll for 4-5 players, color-coded player cards
- **Turn rotation** cycles through all players (not just toggle between 2)
- **Winner modal** shows all players' final scores ranked

### 🌐 Online Multiplayer (REST Polling)
- Full online multiplayer via **REST API polling** (1.5s intervals)
- **Create Room** → get 6-char room code to share
- **Join Room** → enter code, see lobby with all player names as they join
- **Lobby screen** shows players joining in real-time with colored dots
- **"Start Game"** button appears when 2+ players are in lobby
- All game actions server-validated (roll, select, confirm, bank)
- BUST auto-advances turn after 2 seconds
- Hot Hand (Bank & Continue / Bank & Pass) works online

### 🏆 Leaderboard & Viral Features
- **Daily Leaderboard** — wins & points accumulated today, resets at midnight UTC
- **All-Time Leaderboard** — cumulative stats across all games
- **Pull-to-refresh** on leaderboard screen
- **"Challenge a Friend"** share button in winner modal — shares game results via native share sheet
- **Auto-save** — completed games save to backend for leaderboard tracking

### 🎯 Scoring Logic Fixes
- Fixed **straights + leftover scoring dice** bug:
  - `[1,2,3,4,5,1]` now correctly scores 12345 (500) + 1 (100) = **600** → triggers Hot Hand
  - `[2,3,4,5,6,5]` → 23456 (750) + 5 (50) = **800** → triggers Hot Hand
- **Exponential multiplier** for extended sets:
  - 4 of a kind = base × 2
  - 5 of a kind = base × 4
  - 6 of a kind = base × 8

### 🎮 Core Game Mechanics (from main2)
- **Dice selection** — tap to select/deselect scoring dice after each roll
- **BUST detection** — no scoring dice = lose all turn points
- **Hot Hand** — score all 6 dice → bank and re-roll fresh set or bank and pass
- **3 win modes**: Noobs (1500), OGs (3000), Panthers (5000)

### 🔧 Technical
- All API calls centralized via `utils/api.ts` → `https://clawnorder.onrender.com`
- Zero localhost references in codebase
- Backend root endpoint: `GET /` → `"Claw & Order API is running"`
- EAS Build configured (`eas.json`) for Android APK + production builds
- App renamed from "Dice Rush" to **"Claw & Order: Dice Unit"** everywhere
- `app.json` configured with `com.clawandorder.diceunit` bundle IDs

### 📡 Backend Endpoints Added
| Endpoint | Description |
|----------|-------------|
| `POST /api/rooms/create` | Create online game room |
| `POST /api/rooms/join` | Join room with code |
| `GET /api/rooms/{code}/state` | Poll game state |
| `POST /api/rooms/{code}/roll` | Roll dice |
| `POST /api/rooms/{code}/select` | Select/deselect dice |
| `POST /api/rooms/{code}/confirm` | Confirm selection (keep & roll) |
| `POST /api/rooms/{code}/bank` | Bank points & pass turn |
| `POST /api/rooms/{code}/bank-continue` | Hot Hand: bank & continue |
| `POST /api/rooms/{code}/bust-next` | Advance turn after bust |
| `GET /api/leaderboard/daily` | Today's leaderboard |
| `GET /api/leaderboard/alltime` | All-time leaderboard |
| `POST /api/games/save` | Save completed game |
| `POST /api/validate-score` | Validate scoring logic |
| `POST /api/check-scoring` | Check if dice have scoring possibilities |

---

*Build guide: see `frontend/BUILD_GUIDE.md`*

from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import uuid
from datetime import datetime, timezone
import random
import string
import math

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Game state storage (in-memory for active games)
game_rooms: Dict[str, dict] = {}

# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class GameStatsUpdate(BaseModel):
    games_played: int = 0
    games_won: int = 0
    highest_score: int = 0
    total_points: int = 0

class GameHistoryEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player1_name: str
    player2_name: str
    player1_score: int
    player2_score: int
    winner_name: str
    win_mode: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Game logic functions
def roll_dice(count: int = 6) -> List[int]:
    return [random.randint(1, 6) for _ in range(count)]

def calculate_selected_score(selected_dice: List[int]) -> dict:
    if not selected_dice:
        return {'score': 0, 'breakdown': [], 'is_valid': False, 'error': 'No dice selected'}

    sorted_dice = sorted(selected_dice)
    counts = {}
    for val in sorted_dice:
        counts[val] = counts.get(val, 0) + 1

    score = 0
    breakdown = []
    used = [False] * len(selected_dice)

    # Check for full straight 123456 first (exact 6 unique dice)
    unique_sorted = sorted(set(sorted_dice))
    unique_str = ''.join(map(str, unique_sorted))

    if unique_str == '123456' and len(selected_dice) == 6:
        return {'score': 1500, 'breakdown': ['123456 = 1500 points'], 'is_valid': True}

    # Check if dice CONTAIN a straight (12345 or 23456) with possible leftover scoring dice
    straight_found = False

    if all(x in unique_sorted for x in [1, 2, 3, 4, 5]):
        # 12345 straight found
        score += 500
        breakdown.append('12345 = 500 points')
        straight_found = True
        for needed in [1, 2, 3, 4, 5]:
            for i, val in enumerate(selected_dice):
                if val == needed and not used[i]:
                    used[i] = True
                    break
    elif all(x in unique_sorted for x in [2, 3, 4, 5, 6]):
        # 23456 straight found
        score += 750
        breakdown.append('23456 = 750 points')
        straight_found = True
        for needed in [2, 3, 4, 5, 6]:
            for i, val in enumerate(selected_dice):
                if val == needed and not used[i]:
                    used[i] = True
                    break

    if not straight_found:
        # Check for sets with exponential multipliers
        for num, count in counts.items():
            if count >= 3:
                if num == 1:
                    base_score = 1000
                    set_name = '111'
                elif num == 5:
                    base_score = 500
                    set_name = '555'
                else:
                    base_score = num * 100
                    set_name = str(num) * 3

                extra = count - 3
                multiplier = int(math.pow(2, extra))
                final_score = base_score * multiplier

                score += final_score
                if multiplier > 1:
                    breakdown.append(f'{str(num) * count} = {base_score} x {multiplier} = {final_score} points')
                else:
                    breakdown.append(f'{set_name} = {final_score} points')

                found = 0
                for i, val in enumerate(selected_dice):
                    if val == num and not used[i] and found < count:
                        used[i] = True
                        found += 1

    # Individual 1s and 5s (not already used by straight or set)
    for i, val in enumerate(selected_dice):
        if used[i]:
            continue
        if val == 1:
            score += 100
            breakdown.append('1 = 100 points')
            used[i] = True
        elif val == 5:
            score += 50
            breakdown.append('5 = 50 points')
            used[i] = True

    # Check all dice are scoring
    if any(not u for u in used):
        return {'score': 0, 'breakdown': [], 'is_valid': False, 'error': 'Non-scoring dice selected'}

    if score == 0:
        return {'score': 0, 'breakdown': [], 'is_valid': False, 'error': 'No scoring dice'}

    return {'score': score, 'breakdown': breakdown, 'is_valid': True}

def has_any_scoring_dice(dice: List[int]) -> bool:
    if 1 in dice or 5 in dice:
        return True
    counts = {}
    for val in dice:
        counts[val] = counts.get(val, 0) + 1
    for count in counts.values():
        if count >= 3:
            return True
    sorted_dice = sorted(dice)
    sorted_str = ''.join(map(str, sorted_dice))
    if sorted_str == '123456' or ''.join(map(str, sorted_dice[:5])) == '12345' or ''.join(map(str, sorted_dice[1:])) == '23456':
        return True
    return False

def generate_room_code() -> str:
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if code not in game_rooms:
            return code

# ============ ONLINE MULTIPLAYER ROOM ENDPOINTS ============

class CreateRoomRequest(BaseModel):
    player_name: str
    win_mode: str = 'ogs'

class JoinRoomRequest(BaseModel):
    room_code: str
    player_name: str

class RoomActionRequest(BaseModel):
    player_id: str

class SelectDiceRequest(BaseModel):
    player_id: str
    selected_indices: List[int]

def create_room_state(room_code: str, player_name: str, win_mode: str, player_id: str) -> dict:
    return {
        'room_code': room_code,
        'win_mode': win_mode,
        'players': [
            {'id': player_id, 'name': player_name, 'total_score': 0, 'current_turn_score': 0}
        ],
        'current_player_index': 0,
        'dice_values': [],
        'dice_count': 6,
        'selected_dice': [],
        'kept_dice': [],
        'turn_phase': 'waiting',  # waiting, rolling, selecting, bust, hothand
        'current_roll_score': 0,
        'current_roll_breakdown': [],
        'last_selection_score': 0,
        'last_selection_breakdown': [],
        'winner': None,
        'has_rolled': False,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'last_action_at': datetime.now(timezone.utc).isoformat(),
    }

def get_room_state_for_client(room: dict) -> dict:
    """Return sanitized room state for the client"""
    return {
        'room_code': room['room_code'],
        'win_mode': room['win_mode'],
        'players': [
            {'name': p['name'], 'totalScore': p['total_score'], 'currentTurnScore': p['current_turn_score']}
            for p in room['players']
        ],
        'player_ids': [p['id'] for p in room['players']],
        'currentPlayerIndex': room['current_player_index'],
        'diceValues': room['dice_values'],
        'diceCount': room['dice_count'],
        'selectedDice': room['selected_dice'],
        'keptDice': room['kept_dice'],
        'turnPhase': room['turn_phase'],
        'currentRollScore': room['current_roll_score'],
        'currentRollBreakdown': room['current_roll_breakdown'],
        'lastSelectionScore': room['last_selection_score'],
        'lastSelectionBreakdown': room['last_selection_breakdown'],
        'winner': room['winner'],
        'hasRolled': room['has_rolled'],
        'lastActionAt': room['last_action_at'],
    }

WIN_THRESHOLDS = {'noobs': 1500, 'ogs': 3000, 'panthers': 5000}

@api_router.post("/rooms/create")
async def create_room(req: CreateRoomRequest):
    room_code = generate_room_code()
    player_id = str(uuid.uuid4())[:8]
    room = create_room_state(room_code, req.player_name, req.win_mode, player_id)
    game_rooms[room_code] = room
    return {'room_code': room_code, 'player_id': player_id}

@api_router.post("/rooms/join")
async def join_room(req: JoinRoomRequest):
    code = req.room_code.upper().strip()
    if code not in game_rooms:
        return {'error': 'Room not found'}
    room = game_rooms[code]
    if len(room['players']) >= 2:
        return {'error': 'Room is full'}
    player_id = str(uuid.uuid4())[:8]
    room['players'].append({'id': player_id, 'name': req.player_name, 'total_score': 0, 'current_turn_score': 0})
    room['turn_phase'] = 'rolling'
    room['last_action_at'] = datetime.now(timezone.utc).isoformat()
    return {'room_code': code, 'player_id': player_id}

@api_router.get("/rooms/{room_code}/state")
async def get_room_state(room_code: str):
    code = room_code.upper().strip()
    if code not in game_rooms:
        return {'error': 'Room not found'}
    return get_room_state_for_client(game_rooms[code])

@api_router.post("/rooms/{room_code}/roll")
async def room_roll_dice(room_code: str, req: RoomActionRequest):
    code = room_code.upper().strip()
    if code not in game_rooms:
        return {'error': 'Room not found'}
    room = game_rooms[code]
    current = room['players'][room['current_player_index']]
    if current['id'] != req.player_id:
        return {'error': 'Not your turn'}
    if room['turn_phase'] not in ('rolling',):
        return {'error': f'Cannot roll in phase: {room["turn_phase"]}'}

    dice = roll_dice(room['dice_count'])
    is_bust = not has_any_scoring_dice(dice)

    room['dice_values'] = dice
    room['selected_dice'] = [False] * len(dice)
    room['last_selection_score'] = 0
    room['last_selection_breakdown'] = []
    room['has_rolled'] = True
    room['last_action_at'] = datetime.now(timezone.utc).isoformat()

    if is_bust:
        room['turn_phase'] = 'bust'
        room['current_roll_score'] = 0
        room['current_roll_breakdown'] = ['BUST! No scoring dice!']
        current['current_turn_score'] = 0
    else:
        room['turn_phase'] = 'selecting'
        room['current_roll_score'] = 0
        room['current_roll_breakdown'] = []

    return get_room_state_for_client(room)

@api_router.post("/rooms/{room_code}/select")
async def room_select_dice(room_code: str, req: SelectDiceRequest):
    code = room_code.upper().strip()
    if code not in game_rooms:
        return {'error': 'Room not found'}
    room = game_rooms[code]
    current = room['players'][room['current_player_index']]
    if current['id'] != req.player_id:
        return {'error': 'Not your turn'}
    if room['turn_phase'] != 'selecting':
        return {'error': 'Cannot select dice now'}

    new_selected = [False] * len(room['dice_values'])
    for idx in req.selected_indices:
        if 0 <= idx < len(new_selected):
            new_selected[idx] = True

    room['selected_dice'] = new_selected
    selected_values = [room['dice_values'][i] for i in range(len(room['dice_values'])) if new_selected[i]]

    if selected_values:
        result = calculate_selected_score(selected_values)
        room['last_selection_score'] = result['score'] if result['is_valid'] else 0
        room['last_selection_breakdown'] = result['breakdown'] if result['is_valid'] else [result.get('error', 'Invalid')]
    else:
        room['last_selection_score'] = 0
        room['last_selection_breakdown'] = []

    room['last_action_at'] = datetime.now(timezone.utc).isoformat()
    return get_room_state_for_client(room)

@api_router.post("/rooms/{room_code}/confirm")
async def room_confirm_selection(room_code: str, req: RoomActionRequest):
    """Keep selected dice and prepare to roll remaining"""
    code = room_code.upper().strip()
    if code not in game_rooms:
        return {'error': 'Room not found'}
    room = game_rooms[code]
    current = room['players'][room['current_player_index']]
    if current['id'] != req.player_id:
        return {'error': 'Not your turn'}
    if room['turn_phase'] != 'selecting':
        return {'error': 'Cannot confirm now'}

    selected_values = [room['dice_values'][i] for i in range(len(room['dice_values'])) if room['selected_dice'][i]]
    result = calculate_selected_score(selected_values)
    if not result['is_valid']:
        return {'error': 'Invalid selection'}

    new_turn_score = current['current_turn_score'] + result['score']
    current['current_turn_score'] = new_turn_score
    remaining = [room['dice_values'][i] for i in range(len(room['dice_values'])) if not room['selected_dice'][i]]
    room['kept_dice'] = room['kept_dice'] + selected_values
    room['current_roll_score'] = result['score']
    room['current_roll_breakdown'] = result['breakdown']
    room['last_action_at'] = datetime.now(timezone.utc).isoformat()

    if len(remaining) == 0:
        # Hot hand!
        room['turn_phase'] = 'hothand'
        room['dice_count'] = 6
        room['dice_values'] = []
        room['selected_dice'] = []
    else:
        room['turn_phase'] = 'rolling'
        room['dice_count'] = len(remaining)
        room['dice_values'] = remaining
        room['selected_dice'] = [False] * len(remaining)
        room['last_selection_score'] = 0
        room['last_selection_breakdown'] = []

    return get_room_state_for_client(room)

@api_router.post("/rooms/{room_code}/bank")
async def room_bank_points(room_code: str, req: RoomActionRequest):
    code = room_code.upper().strip()
    if code not in game_rooms:
        return {'error': 'Room not found'}
    room = game_rooms[code]
    current = room['players'][room['current_player_index']]
    if current['id'] != req.player_id:
        return {'error': 'Not your turn'}

    new_total = current['total_score'] + current['current_turn_score']
    current['total_score'] = new_total
    current['current_turn_score'] = 0
    threshold = WIN_THRESHOLDS.get(room['win_mode'], 3000)
    room['last_action_at'] = datetime.now(timezone.utc).isoformat()

    if new_total >= threshold:
        room['winner'] = current['name']
    else:
        # Switch turn
        room['current_player_index'] = 1 - room['current_player_index']
        for p in room['players']:
            p['current_turn_score'] = 0

    # Reset dice state
    room['dice_values'] = []
    room['dice_count'] = 6
    room['selected_dice'] = []
    room['kept_dice'] = []
    room['turn_phase'] = 'rolling'
    room['current_roll_score'] = 0
    room['current_roll_breakdown'] = []
    room['last_selection_score'] = 0
    room['last_selection_breakdown'] = []
    room['has_rolled'] = False

    return get_room_state_for_client(room)

@api_router.post("/rooms/{room_code}/bank-continue")
async def room_bank_and_continue(room_code: str, req: RoomActionRequest):
    """Hot hand: bank points and continue with fresh 6 dice"""
    code = room_code.upper().strip()
    if code not in game_rooms:
        return {'error': 'Room not found'}
    room = game_rooms[code]
    current = room['players'][room['current_player_index']]
    if current['id'] != req.player_id:
        return {'error': 'Not your turn'}

    new_total = current['total_score'] + current['current_turn_score']
    current['total_score'] = new_total
    current['current_turn_score'] = 0
    threshold = WIN_THRESHOLDS.get(room['win_mode'], 3000)
    room['last_action_at'] = datetime.now(timezone.utc).isoformat()

    if new_total >= threshold:
        room['winner'] = current['name']

    # Reset for fresh roll but SAME player continues
    room['dice_values'] = []
    room['dice_count'] = 6
    room['selected_dice'] = []
    room['kept_dice'] = []
    room['turn_phase'] = 'rolling'
    room['current_roll_score'] = 0
    room['current_roll_breakdown'] = []
    room['last_selection_score'] = 0
    room['last_selection_breakdown'] = []
    room['has_rolled'] = False

    return get_room_state_for_client(room)

@api_router.post("/rooms/{room_code}/bust-next")
async def room_bust_next_turn(room_code: str, req: RoomActionRequest):
    """After bust, switch to next player"""
    code = room_code.upper().strip()
    if code not in game_rooms:
        return {'error': 'Room not found'}
    room = game_rooms[code]

    room['current_player_index'] = 1 - room['current_player_index']
    for p in room['players']:
        p['current_turn_score'] = 0
    room['dice_values'] = []
    room['dice_count'] = 6
    room['selected_dice'] = []
    room['kept_dice'] = []
    room['turn_phase'] = 'rolling'
    room['current_roll_score'] = 0
    room['current_roll_breakdown'] = []
    room['last_selection_score'] = 0
    room['last_selection_breakdown'] = []
    room['has_rolled'] = False
    room['last_action_at'] = datetime.now(timezone.utc).isoformat()

    return get_room_state_for_client(room)

# ============ EXISTING API ROUTES ============

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Claw & Order: Dice Unit API", "version": "2.0"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    return status_checks

@api_router.post("/games/save")
async def save_game_history(entry: GameHistoryEntry):
    entry_dict = entry.dict()
    await db.game_history.insert_one(entry_dict)

    # Update stats for each player
    for pname, pscore, won in [
        (entry.player1_name, entry.player1_score, entry.winner_name == entry.player1_name),
        (entry.player2_name, entry.player2_score, entry.winner_name == entry.player2_name),
    ]:
        existing = await db.player_stats.find_one({'player_name': pname}, {"_id": 0})
        if existing:
            await db.player_stats.update_one(
                {'player_name': pname},
                {'$inc': {'games_played': 1, 'games_won': 1 if won else 0, 'total_points': pscore},
                 '$max': {'highest_score': pscore}}
            )
        else:
            await db.player_stats.insert_one({
                'player_name': pname,
                'games_played': 1,
                'games_won': 1 if won else 0,
                'highest_score': pscore,
                'total_points': pscore,
            })

    return {'message': 'Game saved'}

@api_router.get("/games/history")
async def get_game_history():
    history = await db.game_history.find({}, {"_id": 0}).sort('created_at', -1).to_list(50)
    return history

@api_router.get("/stats/{player_name}")
async def get_player_stats(player_name: str):
    stats = await db.player_stats.find_one({'player_name': player_name}, {"_id": 0})
    if not stats:
        return {
            'player_name': player_name,
            'games_played': 0,
            'games_won': 0,
            'highest_score': 0,
            'total_points': 0,
        }
    return stats

@api_router.get("/leaderboard")
async def get_leaderboard():
    leaders = await db.player_stats.find({}, {"_id": 0}).sort('games_won', -1).to_list(20)
    return leaders

@api_router.get("/leaderboard/daily")
async def get_daily_leaderboard():
    """Get today's leaderboard - wins and points accumulated today only"""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_str = today_start.isoformat()

    # Aggregate today's games from game_history
    pipeline = [
        {"$match": {"created_at": {"$gte": today_str}}},
        {"$facet": {
            "player1_stats": [
                {"$group": {
                    "_id": "$player1_name",
                    "games_played": {"$sum": 1},
                    "total_points": {"$sum": "$player1_score"},
                    "wins": {"$sum": {"$cond": [{"$eq": ["$winner_name", "$player1_name"]}, 1, 0]}},
                    "highest_score": {"$max": "$player1_score"},
                }}
            ],
            "player2_stats": [
                {"$group": {
                    "_id": "$player2_name",
                    "games_played": {"$sum": 1},
                    "total_points": {"$sum": "$player2_score"},
                    "wins": {"$sum": {"$cond": [{"$eq": ["$winner_name", "$player2_name"]}, 1, 0]}},
                    "highest_score": {"$max": "$player2_score"},
                }}
            ]
        }}
    ]

    result = await db.game_history.aggregate(pipeline).to_list(1)

    # Merge both player stat lists
    player_map = {}
    if result:
        for stats_list in [result[0].get('player1_stats', []), result[0].get('player2_stats', [])]:
            for entry in stats_list:
                name = entry['_id']
                if name in player_map:
                    player_map[name]['games_played'] += entry['games_played']
                    player_map[name]['total_points'] += entry['total_points']
                    player_map[name]['wins'] += entry['wins']
                    player_map[name]['highest_score'] = max(player_map[name]['highest_score'], entry['highest_score'])
                else:
                    player_map[name] = {
                        'player_name': name,
                        'games_played': entry['games_played'],
                        'total_points': entry['total_points'],
                        'wins': entry['wins'],
                        'highest_score': entry['highest_score'],
                    }

    # Sort by wins desc, then total_points desc
    leaders = sorted(player_map.values(), key=lambda x: (-x['wins'], -x['total_points']))
    return {
        'date': today_start.strftime('%Y-%m-%d'),
        'leaderboard': leaders[:20],
        'total_games_today': sum(p['games_played'] for p in player_map.values()) // 2 if player_map else 0,
    }

@api_router.get("/leaderboard/alltime")
async def get_alltime_leaderboard():
    """Get all-time leaderboard sorted by wins then total points"""
    leaders = await db.player_stats.find({}, {"_id": 0}).sort([('games_won', -1), ('total_points', -1)]).to_list(20)
    return {
        'leaderboard': leaders,
    }

# Score validation endpoint for testing
@api_router.post("/validate-score")
async def validate_score(data: dict):
    dice = data.get('dice', [])
    result = calculate_selected_score(dice)
    return result

# Check if dice have scoring possibilities
@api_router.post("/check-scoring")
async def check_scoring(data: dict):
    dice = data.get('dice', [])
    return {'has_scoring': has_any_scoring_dice(dice)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

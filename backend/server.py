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

    # Check for straights (exact match only)
    sorted_str = ''.join(map(str, sorted_dice))

    if sorted_str == '123456' and len(selected_dice) == 6:
        return {'score': 1500, 'breakdown': ['123456 = 1500 points'], 'is_valid': True}

    if sorted_str == '12345' and len(selected_dice) == 5:
        return {'score': 500, 'breakdown': ['12345 = 500 points'], 'is_valid': True}

    if sorted_str == '23456' and len(selected_dice) == 5:
        return {'score': 750, 'breakdown': ['23456 = 750 points'], 'is_valid': True}

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

    # Individual 1s and 5s
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

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Dice Rush API", "version": "2.0"}

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

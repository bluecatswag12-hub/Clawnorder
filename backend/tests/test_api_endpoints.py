import pytest
import requests
import os

# Backend API tests for Dice Rush game
# Tests: API health, score validation, BUST detection

# Load frontend .env to get EXPO_PUBLIC_BACKEND_URL
from pathlib import Path
from dotenv import load_dotenv

frontend_env = Path(__file__).parent.parent.parent / 'frontend' / '.env'
load_dotenv(frontend_env)

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL').rstrip('/')

class TestAPIHealth:
    """Test API health and basic endpoints"""

    def test_api_root(self, api_client):
        """Test GET /api/ returns API info"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert data["message"] == "Dice Rush API"
        print(f"✓ API root endpoint working: {data}")

    def test_status_check_create(self, api_client):
        """Test POST /api/status creates status check"""
        payload = {"client_name": "TEST_pytest_client"}
        response = api_client.post(f"{BASE_URL}/api/status", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert data["client_name"] == "TEST_pytest_client"
        assert "timestamp" in data
        print(f"✓ Status check created: {data['id']}")

    def test_status_check_list(self, api_client):
        """Test GET /api/status returns list"""
        response = api_client.get(f"{BASE_URL}/api/status")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Status checks retrieved: {len(data)} items")


class TestScoreValidation:
    """Test score validation logic"""

    def test_validate_single_one(self, api_client):
        """Test single 1 = 100 points"""
        payload = {"dice": [1]}
        response = api_client.post(f"{BASE_URL}/api/validate-score", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_valid"] == True
        assert data["score"] == 100
        assert "1 = 100 points" in data["breakdown"]
        print(f"✓ Single 1 validated: {data['score']} points")

    def test_validate_single_five(self, api_client):
        """Test single 5 = 50 points"""
        payload = {"dice": [5]}
        response = api_client.post(f"{BASE_URL}/api/validate-score", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_valid"] == True
        assert data["score"] == 50
        assert "5 = 50 points" in data["breakdown"]
        print(f"✓ Single 5 validated: {data['score']} points")

    def test_validate_triple_ones(self, api_client):
        """Test 111 = 1000 points"""
        payload = {"dice": [1, 1, 1]}
        response = api_client.post(f"{BASE_URL}/api/validate-score", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_valid"] == True
        assert data["score"] == 1000
        assert "111 = 1000 points" in data["breakdown"]
        print(f"✓ Triple 1s validated: {data['score']} points")

    def test_validate_triple_fives(self, api_client):
        """Test 555 = 500 points"""
        payload = {"dice": [5, 5, 5]}
        response = api_client.post(f"{BASE_URL}/api/validate-score", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_valid"] == True
        assert data["score"] == 500
        assert "555 = 500 points" in data["breakdown"]
        print(f"✓ Triple 5s validated: {data['score']} points")

    def test_validate_triple_twos(self, api_client):
        """Test 222 = 200 points"""
        payload = {"dice": [2, 2, 2]}
        response = api_client.post(f"{BASE_URL}/api/validate-score", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_valid"] == True
        assert data["score"] == 200
        assert "222 = 200 points" in data["breakdown"]
        print(f"✓ Triple 2s validated: {data['score']} points")

    def test_validate_triple_threes(self, api_client):
        """Test 333 = 300 points"""
        payload = {"dice": [3, 3, 3]}
        response = api_client.post(f"{BASE_URL}/api/validate-score", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_valid"] == True
        assert data["score"] == 300
        print(f"✓ Triple 3s validated: {data['score']} points")

    def test_validate_triple_fours(self, api_client):
        """Test 444 = 400 points"""
        payload = {"dice": [4, 4, 4]}
        response = api_client.post(f"{BASE_URL}/api/validate-score", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_valid"] == True
        assert data["score"] == 400
        print(f"✓ Triple 4s validated: {data['score']} points")

    def test_validate_triple_sixes(self, api_client):
        """Test 666 = 600 points"""
        payload = {"dice": [6, 6, 6]}
        response = api_client.post(f"{BASE_URL}/api/validate-score", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_valid"] == True
        assert data["score"] == 600
        print(f"✓ Triple 6s validated: {data['score']} points")

    def test_validate_quad_twos_doubles_score(self, api_client):
        """Test 2222 = 200 × 2 = 400 points (extra dice doubles)"""
        payload = {"dice": [2, 2, 2, 2]}
        response = api_client.post(f"{BASE_URL}/api/validate-score", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_valid"] == True
        assert data["score"] == 400
        print(f"✓ Quad 2s validated: {data['score']} points (doubled)")

    def test_validate_five_twos_quadruples_score(self, api_client):
        """Test 22222 = 200 × 4 = 800 points (2 extra dice = ×4)"""
        payload = {"dice": [2, 2, 2, 2, 2]}
        response = api_client.post(f"{BASE_URL}/api/validate-score", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_valid"] == True
        assert data["score"] == 800
        print(f"✓ Five 2s validated: {data['score']} points (×4 multiplier)")

    def test_validate_straight_12345(self, api_client):
        """Test 12345 = 500 points"""
        payload = {"dice": [1, 2, 3, 4, 5]}
        response = api_client.post(f"{BASE_URL}/api/validate-score", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_valid"] == True
        assert data["score"] == 500
        assert "12345 = 500 points" in data["breakdown"]
        print(f"✓ Straight 12345 validated: {data['score']} points")

    def test_validate_straight_23456(self, api_client):
        """Test 23456 = 750 points"""
        payload = {"dice": [2, 3, 4, 5, 6]}
        response = api_client.post(f"{BASE_URL}/api/validate-score", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_valid"] == True
        assert data["score"] == 750
        assert "23456 = 750 points" in data["breakdown"]
        print(f"✓ Straight 23456 validated: {data['score']} points")

    def test_validate_straight_123456(self, api_client):
        """Test 123456 = 1500 points"""
        payload = {"dice": [1, 2, 3, 4, 5, 6]}
        response = api_client.post(f"{BASE_URL}/api/validate-score", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_valid"] == True
        assert data["score"] == 1500
        assert "123456 = 1500 points" in data["breakdown"]
        print(f"✓ Straight 123456 validated: {data['score']} points")

    def test_validate_non_scoring_dice_rejected(self, api_client):
        """Test that non-scoring dice are rejected"""
        payload = {"dice": [2, 3, 4]}
        response = api_client.post(f"{BASE_URL}/api/validate-score", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_valid"] == False
        assert "error" in data
        print(f"✓ Non-scoring dice rejected: {data['error']}")

    def test_validate_mixed_scoring_and_non_scoring_rejected(self, api_client):
        """Test that mixed scoring and non-scoring dice are rejected"""
        payload = {"dice": [1, 2, 3]}
        response = api_client.post(f"{BASE_URL}/api/validate-score", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_valid"] == False
        print(f"✓ Mixed dice rejected: {data.get('error', 'Invalid')}")


class TestBustDetection:
    """Test BUST detection (no scoring dice)"""

    def test_check_scoring_with_ones(self, api_client):
        """Test dice with 1s have scoring"""
        payload = {"dice": [1, 2, 3, 4, 6]}
        response = api_client.post(f"{BASE_URL}/api/check-scoring", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["has_scoring"] == True
        print(f"✓ Dice with 1s detected as scoring")

    def test_check_scoring_with_fives(self, api_client):
        """Test dice with 5s have scoring"""
        payload = {"dice": [2, 3, 4, 5, 6]}
        response = api_client.post(f"{BASE_URL}/api/check-scoring", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["has_scoring"] == True
        print(f"✓ Dice with 5s detected as scoring")

    def test_check_scoring_with_triple(self, api_client):
        """Test dice with triple have scoring"""
        payload = {"dice": [2, 2, 2, 3, 4]}
        response = api_client.post(f"{BASE_URL}/api/check-scoring", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["has_scoring"] == True
        print(f"✓ Dice with triple detected as scoring")

    def test_check_scoring_bust_no_scoring_dice(self, api_client):
        """Test BUST: no scoring dice"""
        payload = {"dice": [2, 3, 4, 6]}
        response = api_client.post(f"{BASE_URL}/api/check-scoring", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["has_scoring"] == False
        print(f"✓ BUST detected correctly (no scoring dice)")

    def test_check_scoring_bust_all_non_scoring(self, api_client):
        """Test BUST: all non-scoring dice"""
        payload = {"dice": [2, 3, 4, 6, 2, 3]}
        response = api_client.post(f"{BASE_URL}/api/check-scoring", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["has_scoring"] == False
        print(f"✓ BUST detected correctly (all non-scoring)")


class TestGameHistory:
    """Test game history and stats endpoints"""

    def test_save_game_history(self, api_client):
        """Test POST /api/games/save creates game history"""
        payload = {
            "player1_name": "TEST_Player1",
            "player2_name": "TEST_Player2",
            "player1_score": 3000,
            "player2_score": 2500,
            "winner_name": "TEST_Player1",
            "win_mode": "ogs"
        }
        response = api_client.post(f"{BASE_URL}/api/games/save", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "Game saved"
        print(f"✓ Game history saved")

    def test_get_game_history(self, api_client):
        """Test GET /api/games/history returns list"""
        response = api_client.get(f"{BASE_URL}/api/games/history")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Game history retrieved: {len(data)} games")

    def test_get_player_stats(self, api_client):
        """Test GET /api/stats/{player_name} returns stats"""
        response = api_client.get(f"{BASE_URL}/api/stats/TEST_Player1")
        assert response.status_code == 200
        
        data = response.json()
        assert "player_name" in data
        assert "games_played" in data
        assert "games_won" in data
        assert "highest_score" in data
        assert "total_points" in data
        print(f"✓ Player stats retrieved: {data}")

    def test_get_leaderboard(self, api_client):
        """Test GET /api/leaderboard returns list"""
        response = api_client.get(f"{BASE_URL}/api/leaderboard")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Leaderboard retrieved: {len(data)} players")


class TestLeaderboards:
    """Test daily and all-time leaderboard endpoints"""

    def test_get_daily_leaderboard(self, api_client):
        """Test GET /api/leaderboard/daily returns today's leaderboard"""
        response = api_client.get(f"{BASE_URL}/api/leaderboard/daily")
        assert response.status_code == 200
        
        data = response.json()
        assert "date" in data
        assert "leaderboard" in data
        assert "total_games_today" in data
        assert isinstance(data["leaderboard"], list)
        
        # Verify leaderboard entries have correct structure
        if len(data["leaderboard"]) > 0:
            entry = data["leaderboard"][0]
            assert "player_name" in entry
            assert "wins" in entry
            assert "total_points" in entry
            assert "games_played" in entry
            assert "highest_score" in entry
        
        print(f"✓ Daily leaderboard retrieved: {len(data['leaderboard'])} players, {data['total_games_today']} games today")

    def test_get_alltime_leaderboard(self, api_client):
        """Test GET /api/leaderboard/alltime returns all-time leaderboard"""
        response = api_client.get(f"{BASE_URL}/api/leaderboard/alltime")
        assert response.status_code == 200
        
        data = response.json()
        assert "leaderboard" in data
        assert isinstance(data["leaderboard"], list)
        
        # Verify leaderboard entries have correct structure
        if len(data["leaderboard"]) > 0:
            entry = data["leaderboard"][0]
            assert "player_name" in entry
            assert "games_won" in entry
            assert "total_points" in entry
            assert "games_played" in entry
            assert "highest_score" in entry
        
        print(f"✓ All-time leaderboard retrieved: {len(data['leaderboard'])} players")

    def test_daily_leaderboard_sorting(self, api_client):
        """Test daily leaderboard is sorted by wins then points"""
        response = api_client.get(f"{BASE_URL}/api/leaderboard/daily")
        assert response.status_code == 200
        
        data = response.json()
        leaderboard = data["leaderboard"]
        
        # Verify sorting: wins desc, then total_points desc
        if len(leaderboard) > 1:
            for i in range(len(leaderboard) - 1):
                current = leaderboard[i]
                next_entry = leaderboard[i + 1]
                
                # Either current has more wins, or same wins but more points
                assert (current["wins"] > next_entry["wins"]) or \
                       (current["wins"] == next_entry["wins"] and current["total_points"] >= next_entry["total_points"])
        
        print(f"✓ Daily leaderboard sorting verified")

    def test_alltime_leaderboard_sorting(self, api_client):
        """Test all-time leaderboard is sorted by wins then points"""
        response = api_client.get(f"{BASE_URL}/api/leaderboard/alltime")
        assert response.status_code == 200
        
        data = response.json()
        leaderboard = data["leaderboard"]
        
        # Verify sorting: games_won desc, then total_points desc
        if len(leaderboard) > 1:
            for i in range(len(leaderboard) - 1):
                current = leaderboard[i]
                next_entry = leaderboard[i + 1]
                
                # Either current has more wins, or same wins but more points
                assert (current["games_won"] > next_entry["games_won"]) or \
                       (current["games_won"] == next_entry["games_won"] and current["total_points"] >= next_entry["total_points"])
        
        print(f"✓ All-time leaderboard sorting verified")

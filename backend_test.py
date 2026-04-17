#!/usr/bin/env python3
"""
Comprehensive backend testing for Dice Rush game
Tests both HTTP API endpoints and Socket.IO functionality
"""

import asyncio
import aiohttp
import socketio
import json
import time
import random
from typing import Dict, List, Any

# Backend URL from frontend environment
BACKEND_URL = "https://dice-point-chase.preview.emergentagent.com"
API_BASE_URL = f"{BACKEND_URL}/api"
SOCKET_URL = BACKEND_URL

class DiceRushTester:
    def __init__(self):
        self.session = None
        self.sio_clients = []
        self.test_results = []
        
    async def setup(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup(self):
        """Cleanup resources"""
        if self.session:
            await self.session.close()
        
        for client in self.sio_clients:
            if client.connected:
                await client.disconnect()
    
    def log_result(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
    
    async def test_basic_api_endpoints(self):
        """Test basic HTTP API endpoints"""
        print("\n=== Testing Basic API Endpoints ===")
        
        # Test GET /api/
        try:
            async with self.session.get(f"{API_BASE_URL}/") as response:
                if response.status == 200:
                    data = await response.json()
                    if "Dice Rush API" in data.get("message", ""):
                        self.log_result("GET /api/ - API info", True, f"Response: {data}")
                    else:
                        self.log_result("GET /api/ - API info", False, f"Unexpected response: {data}")
                else:
                    self.log_result("GET /api/ - API info", False, f"Status: {response.status}")
        except Exception as e:
            self.log_result("GET /api/ - API info", False, f"Error: {str(e)}")
        
        # Test GET /api/status
        try:
            async with self.session.get(f"{API_BASE_URL}/status") as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_result("GET /api/status - Get status checks", True, f"Found {len(data)} status checks")
                else:
                    self.log_result("GET /api/status - Get status checks", False, f"Status: {response.status}")
        except Exception as e:
            self.log_result("GET /api/status - Get status checks", False, f"Error: {str(e)}")
        
        # Test POST /api/status
        try:
            test_data = {"client_name": "DiceRushTester"}
            async with self.session.post(f"{API_BASE_URL}/status", json=test_data) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("client_name") == "DiceRushTester":
                        self.log_result("POST /api/status - Create status check", True, f"Created: {data.get('id')}")
                    else:
                        self.log_result("POST /api/status - Create status check", False, f"Unexpected response: {data}")
                else:
                    self.log_result("POST /api/status - Create status check", False, f"Status: {response.status}")
        except Exception as e:
            self.log_result("POST /api/status - Create status check", False, f"Error: {str(e)}")
    
    async def create_socket_client(self, player_name: str) -> socketio.AsyncClient:
        """Create and connect a Socket.IO client"""
        sio = socketio.AsyncClient(logger=False, engineio_logger=False)
        
        # Event handlers for testing
        @sio.event
        async def connect():
            print(f"Socket.IO client {player_name} connected")
        
        @sio.event
        async def disconnect():
            print(f"Socket.IO client {player_name} disconnected")
        
        @sio.event
        async def room_created(data):
            sio.room_data = data
        
        @sio.event
        async def game_start(data):
            sio.game_state = data
        
        @sio.event
        async def game_update(data):
            sio.game_state = data
        
        @sio.event
        async def error(data):
            sio.error_data = data
        
        @sio.event
        async def opponent_disconnected():
            sio.opponent_disconnected = True
        
        # Initialize attributes
        sio.room_data = None
        sio.game_state = None
        sio.error_data = None
        sio.opponent_disconnected = False
        sio.player_name = player_name
        
        self.sio_clients.append(sio)
        return sio
    
    async def test_socket_connection(self):
        """Test Socket.IO connection"""
        print("\n=== Testing Socket.IO Connection ===")
        
        try:
            sio = await self.create_socket_client("TestPlayer")
            await sio.connect(SOCKET_URL)
            
            if sio.connected:
                self.log_result("Socket.IO connection", True, "Successfully connected")
                await sio.disconnect()
            else:
                self.log_result("Socket.IO connection", False, "Failed to connect")
        except Exception as e:
            self.log_result("Socket.IO connection", False, f"Error: {str(e)}")
    
    async def test_room_creation_and_joining(self):
        """Test room creation and joining"""
        print("\n=== Testing Room Creation and Joining ===")
        
        try:
            # Create first client (host)
            host = await self.create_socket_client("Alice")
            await host.connect(SOCKET_URL)
            
            # Test room creation
            await host.emit('create_room', {'player_name': 'Alice'})
            await asyncio.sleep(1)  # Wait for response
            
            if hasattr(host, 'room_data') and host.room_data:
                room_id = host.room_data.get('room_id')
                self.log_result("Create room", True, f"Room created: {room_id}")
                
                # Create second client (joiner)
                joiner = await self.create_socket_client("Bob")
                await joiner.connect(SOCKET_URL)
                
                # Test joining room
                await joiner.emit('join_room', {'room_id': room_id, 'player_name': 'Bob'})
                await asyncio.sleep(1)  # Wait for response
                
                if hasattr(joiner, 'game_state') and joiner.game_state:
                    players = joiner.game_state.get('players', [])
                    if len(players) == 2:
                        self.log_result("Join room", True, f"Both players joined: {[p['name'] for p in players]}")
                    else:
                        self.log_result("Join room", False, f"Expected 2 players, got {len(players)}")
                else:
                    self.log_result("Join room", False, "No game state received after joining")
                
                await host.disconnect()
                await joiner.disconnect()
            else:
                self.log_result("Create room", False, "No room data received")
                await host.disconnect()
                
        except Exception as e:
            self.log_result("Room creation and joining", False, f"Error: {str(e)}")
    
    def validate_scoring_logic(self, dice_values: List[int], expected_score: int, description: str):
        """Validate scoring logic locally (helper for game logic tests)"""
        # Import the scoring function from backend
        import sys
        import os
        sys.path.append('/app/backend')
        
        try:
            from server import calculate_score
            result = calculate_score(dice_values)
            
            if result['score'] == expected_score:
                self.log_result(f"Scoring logic - {description}", True, 
                              f"Dice: {dice_values}, Score: {result['score']}, Breakdown: {result['breakdown']}")
                return True
            else:
                self.log_result(f"Scoring logic - {description}", False, 
                              f"Dice: {dice_values}, Expected: {expected_score}, Got: {result['score']}")
                return False
        except Exception as e:
            self.log_result(f"Scoring logic - {description}", False, f"Error: {str(e)}")
            return False
    
    async def test_game_logic_validation(self):
        """Test the scoring calculation logic"""
        print("\n=== Testing Game Logic Validation ===")
        
        # Test cases for scoring logic
        test_cases = [
            ([1, 2, 3, 4, 6, 6], 100, "Single 1 = 100 points"),
            ([5, 2, 3, 4, 6, 6], 50, "Single 5 = 50 points"),
            ([1, 1, 1, 2, 3, 4], 1000, "Three 1s = 1000 points"),
            ([5, 5, 5, 2, 3, 4], 500, "Three 5s = 500 points"),
            ([2, 2, 2, 3, 4, 6], 200, "Three 2s = 200 points"),
            ([3, 3, 3, 2, 4, 6], 300, "Three 3s = 300 points"),
            ([4, 4, 4, 2, 3, 6], 400, "Three 4s = 400 points"),
            ([6, 6, 6, 2, 3, 4], 600, "Three 6s = 600 points"),
            ([1, 2, 3, 4, 5, 6], 1500, "Straight 123456 = 1500 points"),
            ([1, 2, 3, 4, 5, 2], 500, "Straight 12345 = 500 points"),
            ([2, 3, 4, 5, 6, 1], 750, "Straight 23456 = 750 points"),
            ([2, 3, 4, 6, 6, 6], 0, "BUST - no scoring dice"),
            ([1, 5, 2, 3, 4, 6], 150, "1 and 5 = 150 points"),
        ]
        
        for dice_values, expected_score, description in test_cases:
            self.validate_scoring_logic(dice_values, expected_score, description)
    
    async def test_full_game_flow(self):
        """Test complete game flow"""
        print("\n=== Testing Full Game Flow ===")
        
        try:
            # Create two players
            alice = await self.create_socket_client("Alice")
            bob = await self.create_socket_client("Bob")
            
            await alice.connect(SOCKET_URL)
            await bob.connect(SOCKET_URL)
            
            # Alice creates room
            await alice.emit('create_room', {'player_name': 'Alice'})
            await asyncio.sleep(1)
            
            if not hasattr(alice, 'room_data') or not alice.room_data:
                self.log_result("Full game flow", False, "Failed to create room")
                return
            
            room_id = alice.room_data['room_id']
            
            # Bob joins room
            await bob.emit('join_room', {'room_id': room_id, 'player_name': 'Bob'})
            await asyncio.sleep(1)
            
            if not hasattr(bob, 'game_state') or not bob.game_state:
                self.log_result("Full game flow", False, "Failed to join room")
                return
            
            # Test dice rolling (Alice's turn first)
            await alice.emit('roll_dice', {'room_id': room_id})
            await asyncio.sleep(1)
            
            if hasattr(alice, 'game_state') and alice.game_state:
                dice_values = alice.game_state.get('diceValues', [])
                current_score = alice.game_state.get('currentRollScore', 0)
                self.log_result("Dice rolling", True, f"Rolled: {dice_values}, Score: {current_score}")
                
                # Test banking points (if not bust)
                if not alice.game_state.get('isBust', False) and current_score > 0:
                    await alice.emit('bank_points', {'room_id': room_id})
                    await asyncio.sleep(1)
                    
                    if hasattr(alice, 'game_state') and alice.game_state:
                        players = alice.game_state.get('players', [])
                        alice_score = players[0].get('totalScore', 0) if players else 0
                        current_player = alice.game_state.get('currentPlayerIndex', 0)
                        
                        self.log_result("Banking points", True, 
                                      f"Alice's total: {alice_score}, Current player: {current_player}")
                        self.log_result("Turn switching", current_player == 1, 
                                      f"Turn switched to player {current_player}")
                    else:
                        self.log_result("Banking points", False, "No game state after banking")
                else:
                    self.log_result("Banking points", True, "BUST detected - cannot bank points")
            else:
                self.log_result("Dice rolling", False, "No game state after rolling")
            
            # Test disconnect handling
            await alice.disconnect()
            await asyncio.sleep(1)
            
            if hasattr(bob, 'opponent_disconnected') and bob.opponent_disconnected:
                self.log_result("Disconnect handling", True, "Opponent disconnect detected")
            else:
                self.log_result("Disconnect handling", False, "Opponent disconnect not detected")
            
            await bob.disconnect()
            
        except Exception as e:
            self.log_result("Full game flow", False, f"Error: {str(e)}")
    
    async def test_error_handling(self):
        """Test error handling scenarios"""
        print("\n=== Testing Error Handling ===")
        
        try:
            sio = await self.create_socket_client("ErrorTester")
            await sio.connect(SOCKET_URL)
            
            # Test joining non-existent room
            await sio.emit('join_room', {'room_id': 'INVALID', 'player_name': 'ErrorTester'})
            await asyncio.sleep(1)
            
            if hasattr(sio, 'error_data') and sio.error_data:
                error_msg = sio.error_data.get('message', '')
                if 'Room not found' in error_msg:
                    self.log_result("Error handling - Invalid room", True, f"Error: {error_msg}")
                else:
                    self.log_result("Error handling - Invalid room", False, f"Unexpected error: {error_msg}")
            else:
                self.log_result("Error handling - Invalid room", False, "No error received for invalid room")
            
            await sio.disconnect()
            
        except Exception as e:
            self.log_result("Error handling", False, f"Error: {str(e)}")
    
    async def run_all_tests(self):
        """Run all tests"""
        print("🎲 Starting Dice Rush Backend Tests 🎲")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"API Base URL: {API_BASE_URL}")
        
        await self.setup()
        
        try:
            # Run all test suites
            await self.test_basic_api_endpoints()
            await self.test_socket_connection()
            await self.test_room_creation_and_joining()
            await self.test_game_logic_validation()
            await self.test_full_game_flow()
            await self.test_error_handling()
            
        finally:
            await self.cleanup()
        
        # Print summary
        print("\n" + "="*50)
        print("🎲 DICE RUSH BACKEND TEST SUMMARY 🎲")
        print("="*50)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        print("\nDetailed Results:")
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}")
            if not result['success'] and result['details']:
                print(f"   └─ {result['details']}")
        
        return passed == total

async def main():
    """Main test runner"""
    tester = DiceRushTester()
    success = await tester.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed! Backend is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the details above.")
    
    return success

if __name__ == "__main__":
    asyncio.run(main())
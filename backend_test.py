"""
Backend test for Claw & Order Dice game — focus on the Dragon's Favor /bank-continue mechanic.

CRITICAL INVARIANT TO VERIFY:
- After /bank-continue:
    * total_score MUST stay unchanged
    * current_turn_score MUST stay unchanged (AT RISK)
    * dice_count resets to 6, turn_phase resets to 'rolling'
    * currentPlayerIndex unchanged (same player continues)

ALSO:
- /bank still commits current_turn_score to total_score
- 'royals' mode threshold = 10000 (a player below it is NOT declared winner)
- A bust after bank-continue drops current_turn_score to 0
"""

import requests
import sys

BASE_URL = "http://localhost:8001/api"

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"

results = []


def log(name, passed, detail=""):
    sym = f"{GREEN}PASS{RESET}" if passed else f"{RED}FAIL{RESET}"
    print(f"[{sym}] {name}  {detail}")
    results.append((name, passed, detail))


def post(path, body=None):
    r = requests.post(f"{BASE_URL}{path}", json=body or {}, timeout=10)
    return r.json()


def get(path):
    r = requests.get(f"{BASE_URL}{path}", timeout=10)
    return r.json()


def find_scoring_subset(dice):
    """Pick a scoring subset using simple rules."""
    indices_15 = [i for i, v in enumerate(dice) if v == 1 or v == 5]
    if indices_15:
        vals = [dice[i] for i in indices_15]
        res = post("/validate-score", {"dice": vals})
        if res.get("is_valid"):
            return indices_15, vals, res["score"]
    from collections import Counter
    counts = Counter(dice)
    for face, c in counts.items():
        if c >= 3:
            idxs = [i for i, v in enumerate(dice) if v == face][:3]
            vals = [dice[i] for i in idxs]
            res = post("/validate-score", {"dice": vals})
            if res.get("is_valid"):
                return idxs, vals, res["score"]
    return None, None, 0


def setup_room(win_mode="noobs"):
    r1 = post("/rooms/create", {"player_name": "Alice", "win_mode": win_mode})
    assert "room_code" in r1, f"create failed: {r1}"
    code = r1["room_code"]
    p1_id = r1["player_id"]
    r2 = post("/rooms/join", {"room_code": code, "player_name": "Bob"})
    assert "player_id" in r2, f"join failed: {r2}"
    p2_id = r2["player_id"]
    return code, p1_id, p2_id


def end_other_player_turn(code, other_pid):
    """Drive other player's turn until it ends (bust or bank). Returns when turn passes back."""
    for _ in range(60):
        rs = post(f"/rooms/{code}/roll", {"player_id": other_pid})
        if rs.get("error"):
            return
        if rs["turnPhase"] == "bust":
            post(f"/rooms/{code}/bust-next", {"player_id": other_pid})
            return
        idxs, _, _ = find_scoring_subset(rs["diceValues"])
        if idxs is None:
            return
        post(f"/rooms/{code}/select", {"player_id": other_pid, "selected_indices": idxs})
        post(f"/rooms/{code}/confirm", {"player_id": other_pid})
        post(f"/rooms/{code}/bank", {"player_id": other_pid})
        return


def test_bank_continue_invariants():
    print(f"\n{YELLOW}=== TEST 1: /bank-continue invariants (noobs mode){RESET}")
    code, p1, p2 = setup_room("noobs")

    state = get(f"/rooms/{code}/state")
    log("Room state shows 2 players & noobs mode",
        len(state["players"]) == 2 and state["win_mode"] == "noobs",
        f"win_mode={state['win_mode']}, players={[p['name'] for p in state['players']]}")

    confirmed_once = False
    for attempt in range(80):
        st = get(f"/rooms/{code}/state")
        if st["currentPlayerIndex"] != 0:
            end_other_player_turn(code, p2)
            continue
        if st["turnPhase"] not in ("rolling",):
            # Stuck? Try bust-next as Alice
            break
        roll_state = post(f"/rooms/{code}/roll", {"player_id": p1})
        if roll_state.get("error"):
            log("Roll dice (P1)", False, f"Error: {roll_state}")
            return None
        if roll_state["turnPhase"] == "bust":
            post(f"/rooms/{code}/bust-next", {"player_id": p1})
            end_other_player_turn(code, p2)
            continue
        idxs, vals, sc = find_scoring_subset(roll_state["diceValues"])
        if idxs is None:
            # No scoring found — bank zero, switch turn, then end Bob's
            post(f"/rooms/{code}/bank", {"player_id": p1})
            end_other_player_turn(code, p2)
            continue
        sel_state = post(f"/rooms/{code}/select", {"player_id": p1, "selected_indices": idxs})
        if sel_state.get("error"):
            log("Select dice", False, f"err={sel_state}")
            return None
        cf_state = post(f"/rooms/{code}/confirm", {"player_id": p1})
        if cf_state.get("error"):
            log("Confirm selection", False, f"err={cf_state}")
            return None
        alice = cf_state["players"][0]
        if alice["currentTurnScore"] > 0:
            confirmed_once = True
            break

    if not confirmed_once:
        log("Could not get a scoring confirm in 80 attempts", False, "")
        return None

    pre = get(f"/rooms/{code}/state")
    pre_alice = pre["players"][0]
    pre_total = pre_alice["totalScore"]
    pre_turn = pre_alice["currentTurnScore"]
    pre_idx = pre["currentPlayerIndex"]
    log("Pre-bank-continue snapshot captured",
        True,
        f"total_score={pre_total}, current_turn_score={pre_turn}, currentPlayerIndex={pre_idx}, phase={pre['turnPhase']}")

    res = post(f"/rooms/{code}/bank-continue", {"player_id": p1})
    if res.get("error"):
        log("/bank-continue returned error", False, f"err={res}")
        return None

    post_alice = res["players"][0]
    log("INVARIANT: total_score unchanged after /bank-continue",
        post_alice["totalScore"] == pre_total,
        f"pre={pre_total}, post={post_alice['totalScore']}")
    log("INVARIANT: current_turn_score unchanged after /bank-continue (AT RISK)",
        post_alice["currentTurnScore"] == pre_turn,
        f"pre={pre_turn}, post={post_alice['currentTurnScore']}")
    log("INVARIANT: dice_count reset to 6",
        res["diceCount"] == 6,
        f"diceCount={res['diceCount']}")
    log("INVARIANT: turn_phase reset to 'rolling'",
        res["turnPhase"] == "rolling",
        f"turnPhase={res['turnPhase']}")
    log("INVARIANT: currentPlayerIndex unchanged",
        res["currentPlayerIndex"] == pre_idx,
        f"pre={pre_idx}, post={res['currentPlayerIndex']}")
    log("INVARIANT: hasRolled reset to False",
        res["hasRolled"] is False,
        f"hasRolled={res['hasRolled']}")

    return code, p1, p2, pre_turn


def test_bust_after_bank_continue_drops_turn_score(setup):
    print(f"\n{YELLOW}=== TEST 2: Bust after /bank-continue → current_turn_score drops to 0{RESET}")
    if not setup:
        log("Setup for bust-after-bank-continue", False, "Prior test failed; skipping")
        return
    code, p1, p2, pre_turn = setup

    busted = False
    for attempt in range(300):
        st = get(f"/rooms/{code}/state")
        if st["currentPlayerIndex"] != 0:
            log("Current player is not Alice anymore", False,
                f"idx={st['currentPlayerIndex']}")
            return
        if st["turnPhase"] != "rolling":
            # If hothand or selecting, we should not be here. Continue anyway.
            log("State not in 'rolling' phase pre-bust attempt", False,
                f"phase={st['turnPhase']}")
            return
        roll = post(f"/rooms/{code}/roll", {"player_id": p1})
        if roll.get("error"):
            log("Roll error in bust loop", False, f"{roll}")
            return
        if roll["turnPhase"] == "bust":
            busted = True
            alice = roll["players"][0]
            log("BUST after fresh-cast → current_turn_score == 0",
                alice["currentTurnScore"] == 0,
                f"pre_turn={pre_turn}, post_bust_turn={alice['currentTurnScore']}")
            # also confirm total unchanged (no commit on bust)
            log("BUST after fresh-cast → total_score unchanged",
                alice["totalScore"] == 0,
                f"total_score={alice['totalScore']}")
            break
        idxs, vals, sc = find_scoring_subset(roll["diceValues"])
        if idxs is None:
            continue
        post(f"/rooms/{code}/select", {"player_id": p1, "selected_indices": idxs})
        post(f"/rooms/{code}/confirm", {"player_id": p1})
        # Always go fresh-6 again
        post(f"/rooms/{code}/bank-continue", {"player_id": p1})

    if not busted:
        log("Could not trigger a bust within 300 rolls", False, "")


def test_bank_still_commits():
    print(f"\n{YELLOW}=== TEST 3: /bank still commits current_turn_score to total_score{RESET}")
    code, p1, p2 = setup_room("noobs")

    accumulated = 0
    for attempt in range(80):
        st = get(f"/rooms/{code}/state")
        if st["currentPlayerIndex"] != 0:
            end_other_player_turn(code, p2)
            continue
        roll = post(f"/rooms/{code}/roll", {"player_id": p1})
        if roll.get("error"):
            continue
        if roll["turnPhase"] == "bust":
            post(f"/rooms/{code}/bust-next", {"player_id": p1})
            end_other_player_turn(code, p2)
            continue
        idxs, vals, sc = find_scoring_subset(roll["diceValues"])
        if idxs is None:
            continue
        post(f"/rooms/{code}/select", {"player_id": p1, "selected_indices": idxs})
        cf = post(f"/rooms/{code}/confirm", {"player_id": p1})
        accumulated = cf["players"][0]["currentTurnScore"]
        if accumulated > 0:
            break

    if accumulated <= 0:
        log("Could not accumulate turn score for /bank test", False, "")
        return

    pre = get(f"/rooms/{code}/state")
    pre_total = pre["players"][0]["totalScore"]
    pre_turn = pre["players"][0]["currentTurnScore"]

    after = post(f"/rooms/{code}/bank", {"player_id": p1})
    if after.get("error"):
        log("/bank returned error", False, f"{after}")
        return
    alice_after = after["players"][0]
    expected_total = pre_total + pre_turn
    log("/bank commits current_turn_score to total_score",
        alice_after["totalScore"] == expected_total,
        f"pre_total={pre_total}, pre_turn={pre_turn}, post_total={alice_after['totalScore']}, expected={expected_total}")
    log("/bank resets current_turn_score to 0",
        alice_after["currentTurnScore"] == 0,
        f"post_turn={alice_after['currentTurnScore']}")
    if alice_after["totalScore"] < 1500:
        log("/bank passes turn to next player when below threshold",
            after["currentPlayerIndex"] == 1,
            f"currentPlayerIndex={after['currentPlayerIndex']}, winner={after['winner']}")


def test_royals_mode_threshold():
    print(f"\n{YELLOW}=== TEST 4: 'royals' win_mode → threshold 10000{RESET}")
    code, p1, p2 = setup_room("royals")
    state = get(f"/rooms/{code}/state")
    log("Room created with win_mode='royals'",
        state["win_mode"] == "royals",
        f"win_mode={state['win_mode']}")

    # Accumulate some banked points for Alice and ensure she is NOT a winner with < 10000.
    alice_total = 0
    for attempt in range(60):
        if alice_total >= 9000:
            break  # got plenty for assertion
        st = get(f"/rooms/{code}/state")
        if st["winner"] is not None:
            break
        if st["currentPlayerIndex"] != 0:
            end_other_player_turn(code, p2)
            continue
        roll = post(f"/rooms/{code}/roll", {"player_id": p1})
        if roll.get("error"):
            continue
        if roll["turnPhase"] == "bust":
            post(f"/rooms/{code}/bust-next", {"player_id": p1})
            end_other_player_turn(code, p2)
            continue
        idxs, vals, sc = find_scoring_subset(roll["diceValues"])
        if idxs is None:
            continue
        post(f"/rooms/{code}/select", {"player_id": p1, "selected_indices": idxs})
        post(f"/rooms/{code}/confirm", {"player_id": p1})
        bk = post(f"/rooms/{code}/bank", {"player_id": p1})
        alice_total = bk["players"][0]["totalScore"]
        if bk.get("winner"):
            break

    state = get(f"/rooms/{code}/state")
    alice_total = state["players"][0]["totalScore"]
    winner = state["winner"]
    log("Royals threshold = 10000 — Alice not declared winner while below 10000",
        winner is None and alice_total < 10000,
        f"alice_total={alice_total}, winner={winner}")

    if alice_total >= 1500:
        log("Sanity: Alice >=1500 banked in royals mode but NOT winner (would have won under 'noobs')",
            winner is None,
            f"alice_total={alice_total}")


if __name__ == "__main__":
    try:
        setup = test_bank_continue_invariants()
        test_bust_after_bank_continue_drops_turn_score(setup)
        test_bank_still_commits()
        test_royals_mode_threshold()
    except Exception as e:
        import traceback
        print(f"{RED}EXCEPTION: {e}{RESET}")
        traceback.print_exc()

    passed = sum(1 for _, p, _ in results if p)
    total = len(results)
    print(f"\n{YELLOW}===== SUMMARY: {passed}/{total} checks passed ====={RESET}")
    failed = [(n, d) for n, p, d in results if not p]
    if failed:
        print(f"{RED}Failed checks:{RESET}")
        for n, d in failed:
            print(f"  - {n}  {d}")
        sys.exit(1)
    sys.exit(0)

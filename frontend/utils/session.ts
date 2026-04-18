import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@active_session';

export interface ActiveSession {
  roomCode: string;
  playerId: string;
  playerIndex: string;
}

export async function saveSession(session: ActiveSession) {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {}
}

export async function getSession(): Promise<ActiveSession | null> {
  try {
    const val = await AsyncStorage.getItem(SESSION_KEY);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
}

export async function clearSession() {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch {}
}

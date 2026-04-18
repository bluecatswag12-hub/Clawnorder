import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BACKEND_URL } from '../utils/api';

const PLAYER_COLORS = ['#FF9E3D', '#D4AF37', '#2E7D32', '#FF9E3D', '#9C27B0'];

interface ChatMsg {
  player_name: string;
  message: string;
  timestamp: string;
}

interface GameChatProps {
  roomCode: string;
  playerId: string;
  playerNames: string[];
  visible: boolean;
  onToggle: () => void;
}

export const GameChat: React.FC<GameChatProps> = ({ roomCode, playerId, playerNames, visible, onToggle }) => {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const seenKeys = useRef(new Set<string>());
  const flatRef = useRef<FlatList>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms/${roomCode}/chat`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const newMsgs: ChatMsg[] = [];
        data.forEach((m: ChatMsg) => {
          const key = `${m.timestamp}_${m.player_name}_${m.message}`;
          if (!seenKeys.current.has(key)) {
            seenKeys.current.add(key);
            newMsgs.push(m);
          }
        });
        if (newMsgs.length > 0) {
          setMessages(prev => [...prev, ...newMsgs].slice(-50));
          if (!visible) setUnread(prev => prev + newMsgs.length);
        }
      }
    } catch {}
  }, [roomCode, visible]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (visible) setUnread(0);
  }, [visible]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setInput('');
    try {
      await fetch(`${BACKEND_URL}/api/rooms/${roomCode}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId, message: msg }),
      });
      // Fetch immediately to show own message
      setTimeout(fetchMessages, 300);
    } catch {}
  };

  const getColor = (name: string) => {
    const idx = playerNames.indexOf(name);
    return PLAYER_COLORS[idx >= 0 ? idx % PLAYER_COLORS.length : 0];
  };

  return (
    <>
      {/* Toggle Button */}
      <Pressable testID="chat-toggle" style={styles.toggleBtn} onPress={onToggle}>
        <Ionicons name={visible ? 'chatbubbles' : 'chatbubbles-outline'} size={22} color="#F4E3C5" />
        {unread > 0 && !visible && (
          <View style={styles.badge}><Text style={styles.badgeText}>{unread}</Text></View>
        )}
      </Pressable>

      {/* Chat Panel */}
      {visible && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.chatPanel}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>Game Chat</Text>
            <Pressable onPress={onToggle}><Ionicons name="close" size={22} color="#C8AC70" /></Pressable>
          </View>
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={(_, i) => String(i)}
            style={styles.messageList}
            onContentSizeChange={() => flatRef.current?.scrollToEnd()}
            renderItem={({ item }) => (
              <View style={styles.msgRow}>
                <Text style={[styles.msgName, { color: getColor(item.player_name) }]}>{item.player_name}</Text>
                <Text style={styles.msgText}>{item.message}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyChat}>No messages yet</Text>}
          />
          <View style={styles.inputRow}>
            <TextInput
              testID="chat-input"
              style={styles.chatInput}
              value={input}
              onChangeText={setInput}
              placeholder="Type a message..."
              placeholderTextColor="#AA7C11"
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              maxLength={200}
            />
            <Pressable testID="chat-send" style={styles.sendBtn} onPress={sendMessage}>
              <Ionicons name="send" size={18} color="#F4E3C5" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  toggleBtn: { position: 'absolute', bottom: 80, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: '#D4AF37', justifyContent: 'center', alignItems: 'center', zIndex: 100, elevation: 10 },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#B22222', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#F4E3C5', fontSize: 11, fontWeight: '800' },
  chatPanel: { position: 'absolute', bottom: 70, left: 8, right: 8, height: 280, backgroundColor: '#2C1E16', borderRadius: 16, borderWidth: 1, borderColor: '#3D2B1F', zIndex: 99, elevation: 9, overflow: 'hidden' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#3D2B1F' },
  chatTitle: { fontSize: 14, fontWeight: '700', color: '#F4E3C5' },
  messageList: { flex: 1, paddingHorizontal: 12, paddingTop: 6 },
  msgRow: { flexDirection: 'row', marginBottom: 6, flexWrap: 'wrap' },
  msgName: { fontSize: 13, fontWeight: '700', marginRight: 6 },
  msgText: { fontSize: 13, color: '#F4E3C5', flex: 1 },
  emptyChat: { color: '#444', fontSize: 13, textAlign: 'center', marginTop: 40, fontStyle: 'italic' },
  inputRow: { flexDirection: 'row', padding: 8, gap: 8, borderTopWidth: 1, borderTopColor: '#3D2B1F' },
  chatInput: { flex: 1, backgroundColor: '#1A110A', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, color: '#F4E3C5', fontSize: 14, borderWidth: 1, borderColor: '#3D2B1F' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#D4AF37', justifyContent: 'center', alignItems: 'center' },
});

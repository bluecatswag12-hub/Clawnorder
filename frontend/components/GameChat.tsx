import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BACKEND_URL } from '../utils/api';

const PLAYER_COLORS = ['#2196F3', '#e91e63', '#4CAF50', '#ff9800', '#9C27B0'];

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
  const lastTs = useRef('');
  const flatRef = useRef<FlatList>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms/${roomCode}/chat?after=${lastTs.current}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setMessages(prev => [...prev, ...data].slice(-50));
        lastTs.current = data[data.length - 1].timestamp;
        if (!visible) setUnread(prev => prev + data.length);
      }
    } catch {}
  }, [roomCode, visible]);

  useEffect(() => {
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
      fetchMessages();
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
        <Ionicons name={visible ? 'chatbubbles' : 'chatbubbles-outline'} size={22} color="#fff" />
        {unread > 0 && !visible && (
          <View style={styles.badge}><Text style={styles.badgeText}>{unread}</Text></View>
        )}
      </Pressable>

      {/* Chat Panel */}
      {visible && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.chatPanel}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>Game Chat</Text>
            <Pressable onPress={onToggle}><Ionicons name="close" size={22} color="#888" /></Pressable>
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
              placeholderTextColor="#555"
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              maxLength={200}
            />
            <Pressable testID="chat-send" style={styles.sendBtn} onPress={sendMessage}>
              <Ionicons name="send" size={18} color="#fff" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  toggleBtn: { position: 'absolute', bottom: 80, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: '#e91e63', justifyContent: 'center', alignItems: 'center', zIndex: 100, elevation: 10 },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#FF5722', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  chatPanel: { position: 'absolute', bottom: 70, left: 8, right: 8, height: 280, backgroundColor: '#111122', borderRadius: 16, borderWidth: 1, borderColor: '#333', zIndex: 99, elevation: 9, overflow: 'hidden' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#222' },
  chatTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  messageList: { flex: 1, paddingHorizontal: 12, paddingTop: 6 },
  msgRow: { flexDirection: 'row', marginBottom: 6, flexWrap: 'wrap' },
  msgName: { fontSize: 13, fontWeight: '700', marginRight: 6 },
  msgText: { fontSize: 13, color: '#ccc', flex: 1 },
  emptyChat: { color: '#444', fontSize: 13, textAlign: 'center', marginTop: 40, fontStyle: 'italic' },
  inputRow: { flexDirection: 'row', padding: 8, gap: 8, borderTopWidth: 1, borderTopColor: '#222' },
  chatInput: { flex: 1, backgroundColor: '#0d0d1a', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: '#333' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e91e63', justifyContent: 'center', alignItems: 'center' },
});

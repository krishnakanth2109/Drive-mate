import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { socket } from '../../../services/api';
import { useCustomer } from '../../../context/CustomerContext';

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const { activeRide, driver } = useCustomer();
  const driverPhone = driver?.phone || '+1987654321';
  const driverName = driver?.name || 'Driver';
  const carInfo = driver?.vehicle ? `${driver.vehicle} • ${driver.vehicleType}` : 'Vehicle Info';
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    if (!socket) return;
    socket.on('receive_chat_message', (data: any) => {
      setMessages(prev => [...prev, data]);
    });
    return () => {
      socket.off('receive_chat_message');
    };
  }, []);

  const handleCall = () => {
    Linking.openURL(`tel:${driverPhone}`);
  };

  const sendMessage = () => {
    if (inputText.trim()) {
      const newMsg = {
        id: Date.now().toString(),
        text: inputText.trim(),
        sender: 'customer',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, newMsg]);

      if (activeRide) {
        socket.emit('send_chat_message', {
          rideId: activeRide._id,
          sender: 'customer',
          text: newMsg.text,
          time: newMsg.time
        });
      }
      
      setInputText('');
    }
  };

  const renderItem = ({ item }: any) => {
    const isCustomer = item.sender === 'customer';
    return (
      <View style={[styles.messageBubble, isCustomer ? styles.customerBubble : styles.driverBubble]}>
        <Text style={[styles.messageText, isCustomer ? styles.customerText : styles.driverText]}>
          {item.text}
        </Text>
        <Text style={[styles.timeText, isCustomer ? styles.customerTime : styles.driverTime]}>
          {item.time}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{driverName}</Text>
          <Text style={styles.headerSubtitle}>{carInfo}</Text>
        </View>

        <TouchableOpacity onPress={handleCall} style={styles.iconBtn}>
          <Ionicons name="call" size={22} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.chatContainer}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} 
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  keyboardView: {
    flex: 1,
  },
  chatContainer: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  customerBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#2196F3',
    borderBottomRightRadius: 4,
  },
  driverBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  customerText: {
    color: '#fff',
  },
  driverText: {
    color: '#333',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  customerTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  driverTime: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#333',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendBtnDisabled: {
    backgroundColor: '#b0bec5',
  }
});

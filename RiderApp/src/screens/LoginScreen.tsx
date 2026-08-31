import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { api, connectSocket, socket } from '../services/api';

type LoginScreenProps = {
  navigation: StackNavigationProp<any, 'Login'>;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email) return Alert.alert('Error', 'Please enter email');
    
    setLoading(true);
    try {
      // 1. Create/Login User via Backend
      const res = await api.post('/users/login', { 
        email: email.toLowerCase(), 
        name: "Rider " + Math.floor(Math.random() * 100), 
        role: 'rider',
        phone: "9876543210",
        currentLocation: { lat: 0, lng: 0 }
      });

      const { token, user } = res.data;

      if (user.role !== 'rider') {
        setLoading(false);
        return Alert.alert('Access Denied', 'This account is not a Rider.');
      }

      // 2. Store Data
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userId', user._id);
      
      // 3. Connect Socket
      await connectSocket();
      socket.emit('join_drivers_room'); 
      socket.emit('join_room', user._id);

      navigation.replace('Dashboard');
    } catch (err: any) {
      console.log(err);
      Alert.alert('Error', 'Login failed. Check server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.emoji}>🛵</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.header}>Rider Partner</Text>
        <Text style={styles.subHeader}>Earn money on your schedule</Text>
        
        <TextInput 
          style={styles.input} 
          placeholder="Enter Email Address" 
          value={email} 
          autoCapitalize="none"
          onChangeText={setEmail} 
        />
        
        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Start Driving</Text>}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>New Partner? Register here</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  banner: { flex: 0.4, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffd700' },
  emoji: { fontSize: 80 },
  content: { flex: 0.6, backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, marginTop: -30 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
  subHeader: { color: 'gray', marginBottom: 30 },
  input: { backgroundColor: '#f2f2f2', padding: 18, borderRadius: 12, marginBottom: 20, fontSize: 16 },
  btn: { backgroundColor: '#000', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { marginTop: 20, textAlign: 'center', color: '#007AFF' }
});
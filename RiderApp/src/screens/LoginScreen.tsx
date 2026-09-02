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
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please enter email and password');
    
    setLoading(true);
    try {
      // 1. Login User via Backend
      const res = await api.post('/users/rider/login', { 
        email: email.toLowerCase().trim(),
        password: password.trim()
      });

      const { token, user } = res.data;

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
      Alert.alert('Error', err.response?.data?.error || 'Login failed. Check credentials.');
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
          placeholder="Email Address" 
          value={email} 
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail} 
        />
        
        <TextInput 
          style={styles.input} 
          placeholder="Password" 
          value={password} 
          secureTextEntry
          autoCapitalize="none"
          onChangeText={setPassword} 
        />
        
        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Login & Start Driving</Text>}
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
  banner: { flex: 0.35, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffd700' },
  emoji: { fontSize: 80 },
  content: { flex: 0.65, backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, marginTop: -30 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
  subHeader: { color: 'gray', marginBottom: 25 },
  input: { backgroundColor: '#f2f2f2', padding: 16, borderRadius: 12, marginBottom: 15, fontSize: 16 },
  btn: { backgroundColor: '#000', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 5 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { marginTop: 25, textAlign: 'center', color: '#007AFF', fontWeight: '600' }
});
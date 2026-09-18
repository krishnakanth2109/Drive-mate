import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { api } from '../services/api';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if(!name || !email || !phone || !password) return Alert.alert('Error', 'Fill all fields');

    setLoading(true);
    try {
      await api.post('/users/rider/register', {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password: password.trim()
      });
      Alert.alert('Success', 'Account created! Please login.');
      navigation.navigate('Login');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Become a Partner</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Full Name" 
        value={name} 
        autoCapitalize="words"
        onChangeText={setName} 
      />
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
        placeholder="Phone Number" 
        value={phone} 
        keyboardType="phone-pad" 
        onChangeText={setPhone} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        value={password} 
        secureTextEntry
        autoCapitalize="none" 
        onChangeText={setPassword} 
      />

      <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Register</Text>}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 20 }}>
        <Text style={styles.link}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#fff' },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 30 },
  input: { backgroundColor: '#f9f9f9', padding: 16, borderRadius: 12, marginBottom: 15, fontSize: 16 },
  btn: { backgroundColor: '#000', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { color: '#007AFF', textAlign: 'center', fontWeight: '600' }
});
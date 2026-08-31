import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { api } from '../services/api';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if(!name || !email || !phone) return Alert.alert("Missing Fields");
    setLoading(true);
    
    try {
      // In this backend, /login acts as Register too if user doesn't exist
      // So we just redirect to login logic or call login directly
      await api.post('/users/login', { name, email, phone, role: 'customer' });
      Alert.alert("Success", "Account created!");
      navigation.navigate('Login');
    } catch (err: any) {
      Alert.alert("Error", "Registration Failed");
    } finally {
        setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" value={email} autoCapitalize="none" onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Phone Number" value={phone} keyboardType="phone-pad" onChangeText={setPhone} />
      
      <TouchableOpacity style={styles.btn} onPress={handleRegister}>
        {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.btnText}>Sign Up</Text>}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30 },
  input: { backgroundColor: '#f9f9f9', padding: 18, borderRadius: 12, marginBottom: 15, fontSize: 16 },
  btn: { backgroundColor: 'black', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  link: { marginTop: 20, textAlign: 'center', color: '#666' }
});
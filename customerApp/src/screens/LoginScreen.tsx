import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, connectSocket, socket } from '../services/api';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail]     = useState('');
  const [name, setName]       = useState('');
  const [phone, setPhone]     = useState('');
  const [isNew, setIsNew]     = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) return Alert.alert('Required', 'Please enter your email.');
    if (isNew && (!name.trim() || !phone.trim())) {
      return Alert.alert('Required', 'Please fill all fields.');
    }

    setLoading(true);
    try {
      const res = await api.post('/users/login', {
        email: email.toLowerCase().trim(),
        name: name.trim() || 'Customer',
        role: 'customer',
        phone: phone.trim() || '9876543210',
      });

      const { token, user } = res.data;

      if (user.role !== 'customer') {
        Alert.alert('Wrong App', 'This is the customer app. Use the Rider app to login as a rider.');
        setLoading(false);
        return;
      }

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('userId', user._id);

      await connectSocket();
      socket.emit('join_room', user._id);

      navigation.replace('Dashboard');
    } catch (err: any) {
      console.error(err);
      Alert.alert(
        'Login Failed',
        err.response?.data?.error || 'Could not connect to server. Check your network.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroEmoji}>🚀</Text>
        </View>
        <Text style={styles.heroTitle}>RIDE</Text>
        <Text style={styles.heroSub}>Book fast. Travel safe.</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.formTitle}>
          {isNew ? 'Create Account' : 'Welcome Back'}
        </Text>
        <Text style={styles.formSub}>
          {isNew
            ? 'Fill in your details to get started'
            : 'Enter your email to continue'}
        </Text>

        {isNew && (
          <>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="9876543210"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </>
        )}

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={styles.btn}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              {isNew ? 'Sign Up & Continue' : 'Continue →'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsNew(!isNew)}
          style={styles.toggleWrap}
        >
          <Text style={styles.toggleText}>
            {isNew ? 'Already have an account? ' : "Don't have an account? "}
            <Text style={styles.toggleLink}>{isNew ? 'Log In' : 'Sign Up'}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },

  // Hero
  hero: {
    flex: 0.42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 10,
  },
  heroBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#f72585',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#f72585',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  heroEmoji: { fontSize: 38 },
  heroTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 6,
  },
  heroSub: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 6 },

  // Form
  form: {
    flex: 0.58,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    paddingTop: 32,
  },
  formTitle: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  formSub: { fontSize: 13, color: '#aaa', marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#f4f4f8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1a1a2e',
    marginBottom: 16,
  },
  btn: {
    backgroundColor: '#f72585',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
    shadowColor: '#f72585',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  toggleWrap: { alignItems: 'center' },
  toggleText: { color: '#aaa', fontSize: 14 },
  toggleLink: { color: '#f72585', fontWeight: '700' },
});
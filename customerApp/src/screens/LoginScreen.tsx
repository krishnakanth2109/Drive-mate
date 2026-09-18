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
  const [isLogin, setIsLogin] = useState(true);
  
  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading]     = useState(false);

  const handleAuth = async () => {
    if (isLogin) {
      if (!email.trim() || !password.trim()) {
        return Alert.alert('Required', 'Please fill in Email and Password.');
      }
      
      setLoading(true);
      try {
        const res = await api.post('/users/customer/login', {
          email: email.toLowerCase().trim(),
          password: password.trim(),
        });

        const { token, user } = res.data;

        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        await AsyncStorage.setItem('userId', user._id);

        await connectSocket();
        socket.emit('join_room', user._id);

        navigation.replace('MainTabs');
      } catch (err: any) {
        console.error(err);
        Alert.alert(
          'Login Error',
          err.response?.data?.message || 'Invalid credentials.'
        );
      } finally {
        setLoading(false);
      }
    } else {
      if (!name.trim() || !phone.trim() || !email.trim() || !password.trim()) {
        return Alert.alert('Required', 'Please fill in all fields to register.');
      }

      setLoading(true);
      try {
        await api.post('/users/customer/register', {
          name: name.trim(),
          phone: phone.trim(),
          email: email.toLowerCase().trim(),
          password: password.trim(),
        });

        Alert.alert('Success', 'Account created successfully! You can now log in.');
        setIsLogin(true); // Switch to login mode
      } catch (err: any) {
        console.error(err);
        Alert.alert(
          'Registration Error',
          err.response?.data?.message || 'Could not register. Check your network.'
        );
      } finally {
        setLoading(false);
      }
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
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </Text>
        <Text style={styles.formSub}>
          {isLogin
            ? 'Login to your account to continue'
            : 'Sign up to get started'}
        </Text>

        {!isLogin && (
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

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={styles.btn}
          onPress={handleAuth}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>{isLogin ? 'Login' : 'Register'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsLogin(!isLogin)}
          style={styles.toggleWrap}
        >
          <Text style={styles.toggleText}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Text style={styles.toggleLink}>{isLogin ? 'Sign up' : 'Log in'}</Text>
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
    flex: 0.35,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 5,
  },
  heroBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#f72585',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#f72585',
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  heroEmoji: { fontSize: 30 },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
  },
  heroSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 },

  // Form
  form: {
    flex: 0.65,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingTop: 28,
  },
  formTitle: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', marginBottom: 2 },
  formSub: { fontSize: 13, color: '#aaa', marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#f4f4f8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1a1a2e',
    marginBottom: 12,
  },
  btn: {
    backgroundColor: '#f72585',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
    shadowColor: '#f72585',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  toggleWrap: { alignItems: 'center', marginTop: 10 },
  toggleText: { color: '#aaa', fontSize: 14 },
  toggleLink: { color: '#f72585', fontWeight: '700' },
});
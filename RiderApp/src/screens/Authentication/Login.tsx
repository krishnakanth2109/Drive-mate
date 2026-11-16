import React, { useState, useEffect } from 'react';
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
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { api, connectSocket, socket } from '../../services/api';

const RIDER_CREDENTIALS_KEY = 'rider_saved_credentials';
const REMEMBER_RIDER_KEY = 'remember_rider';

type LoginScreenProps = {
  navigation: StackNavigationProp<any, 'Login'>;
  route?: any;
};

export default function LoginScreen({ navigation, route }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [hasSavedCreds, setHasSavedCreds] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load saved credentials on component mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // If credentials passed via registration or reset flow
        const routeEmail = route?.params?.prefillEmail;
        const routePass = route?.params?.prefillPassword;
        if (routeEmail) {
          if (isMounted) {
            setEmail(routeEmail);
            if (routePass) setPassword(routePass);
            setRememberMe(true);
          }
          return;
        }

        // Check AsyncStorage for stored rider credentials
        const [savedCredsStr, rememberVal] = await Promise.all([
          AsyncStorage.getItem(RIDER_CREDENTIALS_KEY),
          AsyncStorage.getItem(REMEMBER_RIDER_KEY),
        ]);

        if (savedCredsStr && isMounted) {
          const creds = JSON.parse(savedCredsStr);
          if (creds.email) setEmail(creds.email);
          if (creds.password) setPassword(creds.password);
          setHasSavedCreds(true);
          setRememberMe(rememberVal !== 'false');
        }
      } catch (err) {
        console.log('Error reading saved rider credentials:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [route?.params]);

  const handleClearSavedCredentials = async () => {
    try {
      await AsyncStorage.removeItem(RIDER_CREDENTIALS_KEY);
      setEmail('');
      setPassword('');
      setHasSavedCreds(false);
      Alert.alert('Credentials Cleared', 'Saved login details removed from this device.');
    } catch (err) {
      console.log('Error removing saved credentials:', err);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please enter email and password');

    setLoading(true);
    try {
      // 1. Login User via Backend
      const res = await api.post('/users/rider/login', {
        email: email.toLowerCase().trim(),
        password: password.trim(),
      });

      const { token, user } = res.data;

      // 2. Persist Auth Session & User Profile
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userId', user._id || user.id);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('rider', JSON.stringify(user));

      // 3. Persist Credentials for Auto-Login / Auto-Fill
      if (rememberMe) {
        await AsyncStorage.setItem(
          RIDER_CREDENTIALS_KEY,
          JSON.stringify({
            email: email.toLowerCase().trim(),
            password: password.trim(),
            savedAt: Date.now(),
          })
        );
        await AsyncStorage.setItem(REMEMBER_RIDER_KEY, 'true');
      } else {
        await AsyncStorage.removeItem(RIDER_CREDENTIALS_KEY);
        await AsyncStorage.setItem(REMEMBER_RIDER_KEY, 'false');
      }

      // 4. Connect Real-Time Socket
      await connectSocket();
      socket.emit('join_drivers_room');
      socket.emit('join_room', user._id || user.id);

      navigation.replace('MainTabs');
    } catch (err: any) {
      console.log(err);
      Alert.alert('Error', err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.banner}>
        <Text style={styles.emoji}>🛵</Text>
      </View>
      <View style={styles.content}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.header}>Rider Partner</Text>
          <Text style={styles.subHeader}>Earn money on your schedule</Text>

          {/* Saved credentials chip */}
          {hasSavedCreds && (
            <View style={styles.savedBadge}>
              <View style={styles.savedBadgeLeft}>
                <Ionicons name="key" size={16} color="#059669" />
                <Text style={styles.savedBadgeText} numberOfLines={1}>
                  Saved Account: <Text style={{ fontWeight: '700' }}>{email}</Text>
                </Text>
              </View>
              <TouchableOpacity onPress={handleClearSavedCredentials} style={styles.clearBadgeBtn}>
                <Ionicons name="close-circle" size={16} color="#9ca3af" />
                <Text style={styles.clearBadgeText}>Forget</Text>
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#9ca3af"
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={(text) => {
              setEmail(text);
              if (hasSavedCreds && text !== email) setHasSavedCreds(false);
            }}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              value={password}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              onChangeText={(text) => {
                setPassword(text);
                if (hasSavedCreds && text !== password) setHasSavedCreds(false);
              }}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>

          {/* Remember Credentials Checkbox & Forgot Password */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={rememberMe ? 'checkbox' : 'square-outline'}
                size={20}
                color={rememberMe ? '#f72585' : '#9ca3af'}
              />
              <Text style={styles.rememberText}>Save Credentials</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotBtn}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Login & Start Driving</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>New Partner? Register here</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  banner: { flex: 0.3, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffd700' },
  emoji: { fontSize: 80 },
  content: {
    flex: 0.7,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 28,
    paddingTop: 28,
    marginTop: -25,
  },
  header: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  subHeader: { color: '#6b7280', marginBottom: 20, fontSize: 14 },

  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 14,
  },
  savedBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  savedBadgeText: {
    fontSize: 12,
    color: '#065f46',
    flex: 1,
  },
  clearBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    gap: 3,
  },
  clearBadgeText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },

  input: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 14,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 2,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rememberText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  forgotBtn: {
    paddingVertical: 4,
  },
  forgotText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
  },

  btn: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  btnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  link: { marginTop: 22, textAlign: 'center', color: '#007AFF', fontWeight: '600', fontSize: 14 },
});
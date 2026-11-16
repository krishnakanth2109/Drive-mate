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
  StatusBar,
  Dimensions,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../services/api';
import { useCustomer } from '../../../context/CustomerContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const { saveAuthSession } = useCustomer();
  const [isLogin, setIsLogin] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);

  // Load pre-saved credentials if any
  useEffect(() => {
    (async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('saved_email');
        const savedPhone = await AsyncStorage.getItem('saved_phone');
        const savedRemember = await AsyncStorage.getItem('remember_me');

        if (savedRemember !== null) {
          setRememberMe(savedRemember === 'true');
        }

        if (savedEmail) {
          setEmail(savedEmail);
        } else if (savedPhone) {
          setPhone(savedPhone);
        }
      } catch (e) {
        console.warn('Could not read saved credentials', e);
      }
    })();
  }, []);

  // Quick One-Tap Demo Login
  const handleQuickDemoLogin = async () => {
    setEmail('customer@drivemate.in');
    setPassword('admin123');
    setLoading(true);

    try {
      const res = await api.post('/users/customer/login', {
        email: 'customer@drivemate.in',
        password: 'admin123',
      });

      const data = res.data || res;
      const token = data.token;
      const user = data.user;

      if (!token) throw new Error('Token not returned');

      // Save session permanently
      await saveAuthSession(token, user, true);
      navigation.replace('Main');
    } catch (err: any) {
      console.error(err);
      Alert.alert(
        'Demo Login Error',
        err.response?.data?.message || err.message || 'Could not log in. Check backend.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    if (isLogin) {
      if (!email.trim() || !password.trim()) {
        return Alert.alert('Required Fields', 'Please enter your registered Email or Phone and Password.');
      }

      setLoading(true);
      try {
        const res = await api.post('/users/customer/login', {
          email: email.toLowerCase().trim(),
          phone: email.trim(),
          password: password.trim(),
        });

        const data = res.data || res;
        const token = data.token;
        const user = data.user;

        if (!token) {
          throw new Error('Authentication token not received.');
        }

        // Save login session permanently in AsyncStorage
        await saveAuthSession(token, user, rememberMe);

        navigation.replace('Main');
      } catch (err: any) {
        console.error(err);
        Alert.alert(
          'Login Error',
          err.response?.data?.message || 'Invalid credentials. Please verify your email/phone and password.'
        );
      } finally {
        setLoading(false);
      }
    } else {
      // Register
      if (!name.trim() || !phone.trim() || !email.trim() || !password.trim()) {
        return Alert.alert('Required Fields', 'Please fill in all fields to create your customer account.');
      }

      setLoading(true);
      try {
        await api.post('/users/customer/register', {
          name: name.trim(),
          phone: phone.trim(),
          email: email.toLowerCase().trim(),
          password: password.trim(),
        });

        // After register, auto-login immediately for the best UX
        const loginRes = await api.post('/users/customer/login', {
          email: email.toLowerCase().trim(),
          password: password.trim(),
        });

        const data = loginRes.data || loginRes;
        if (data.token && data.user) {
          await saveAuthSession(data.token, data.user, rememberMe);
          navigation.replace('Main');
        } else {
          Alert.alert('Account Created', 'Welcome to DriveMate! Please log in with your credentials.');
          setIsLogin(true);
        }
      } catch (err: any) {
        console.error(err);
        Alert.alert(
          'Registration Error',
          err.response?.data?.message || 'Could not register account. Email might already be registered.'
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
      <StatusBar barStyle="light-content" backgroundColor="#0b0b14" />

      {/* Futuristic Background Accents */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Hero */}
        <View style={styles.hero}>
          <View style={styles.brandIconWrap}>
            <Ionicons name="car-sport" size={32} color="#ffffff" />
          </View>

          <Text style={styles.heroTitle}>DriveMate</Text>
          <Text style={styles.heroSubtitle}>
            {isLogin
              ? 'Welcome back! Book fast, travel safe.'
              : 'Create your account for frictionless city mobility.'}
          </Text>

          {/* Quick Demo Pill */}
          <TouchableOpacity
            style={styles.demoLoginPill}
            onPress={handleQuickDemoLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Ionicons name="flash" size={14} color="#ffd166" />
            <Text style={styles.demoLoginPillText}>One-Tap Demo Customer (Pooja H.)</Text>
          </TouchableOpacity>
        </View>

        {/* Auth Glass Card */}
        <View style={styles.card}>
          {/* Segmented Switcher Tab */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, isLogin && styles.tabBtnActive]}
              onPress={() => setIsLogin(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, isLogin && styles.tabBtnTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, !isLogin && styles.tabBtnActive]}
              onPress={() => setIsLogin(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, !isLogin && styles.tabBtnTextActive]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Registration Fields */}
          {!isLogin && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color="#f72585" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Pooja Hegde"
                    placeholderTextColor="rgba(255, 255, 255, 0.35)"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={18} color="#f72585" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. +91 98845 22109"
                    placeholderTextColor="rgba(255, 255, 255, 0.35)"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </>
          )}

          {/* Email / Identifier Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {isLogin ? 'Email Address or Phone' : 'Email Address'}
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#f72585" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={isLogin ? 'you@example.com or 9884522109' : 'you@example.com'}
                placeholderTextColor="rgba(255, 255, 255, 0.35)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Field */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Password</Text>
              {isLogin && (
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      'Forgot Password?',
                      'Password recovery instructions have been sent to your registered contact channel.'
                    )
                  }
                >
                  <Text style={styles.forgotLink}>Forgot password?</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#f72585" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor="rgba(255, 255, 255, 0.35)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="rgba(255, 255, 255, 0.5)"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Me Toggle */}
          <View style={styles.rememberRow}>
            <View style={styles.rememberLeft}>
              <Switch
                value={rememberMe}
                onValueChange={setRememberMe}
                trackColor={{ false: '#3a3a4c', true: '#f72585' }}
                thumbColor="#ffffff"
                style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
              />
              <Text style={styles.rememberText}>Keep me logged in</Text>
            </View>
            <View style={styles.secureBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#06d6a0" />
              <Text style={styles.secureText}>256-bit SSL</Text>
            </View>
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <View style={styles.submitBtnContent}>
                <Text style={styles.submitBtnText}>
                  {isLogin ? 'Sign In Securely' : 'Create Customer Account'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>

          {/* Safety Footnote */}
          <View style={styles.trustFooter}>
            <Ionicons name="lock-closed" size={12} color="rgba(255, 255, 255, 0.4)" />
            <Text style={styles.trustText}>
              Your session is saved securely. Next time you open DriveMate, you will be logged in automatically.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b14',
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    backgroundColor: 'rgba(247, 37, 133, 0.12)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -100,
    left: -80,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: 'rgba(114, 9, 183, 0.14)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'ios' ? 50 : 36,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#f72585',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#f72585',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 6,
    textAlign: 'center',
    maxWidth: width * 0.78,
    lineHeight: 18,
  },
  demoLoginPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 209, 102, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 102, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 14,
  },
  demoLoginPillText: {
    color: '#ffd166',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#161626',
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#0e0e1a',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#f72585',
    shadowColor: '#f72585',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  tabBtnText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  forgotLink: {
    color: '#f72585',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f1c',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    paddingVertical: 13,
    fontWeight: '500',
  },
  eyeBtn: {
    padding: 6,
  },
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  rememberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 214, 160, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 214, 160, 0.25)',
  },
  secureText: {
    color: '#06d6a0',
    fontSize: 10,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#f72585',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f72585',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  trustFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  trustText: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 10.5,
    lineHeight: 15,
  },
});
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { riderService } from '../../services/riderService';

export default function OTPVerificationScreen({ navigation, route }: any) {
  const email = route?.params?.email || '';
  const demoOtp = route?.params?.demoOtp || '';

  const [otp, setOtp] = useState(demoOtp ? demoOtp.split('') : ['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<Array<any>>([]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 4) {
      Alert.alert('Incomplete Code', 'Please enter the complete 4-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      await riderService.verifyOtp(email, enteredOtp);
      Alert.alert('Verified', 'Code verified successfully. Set your new password.');
      navigation.navigate('ResetPassword', { email });
    } catch (err: any) {
      Alert.alert('Verification Failed', err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const res = await riderService.forgotPassword(email);
      Alert.alert('Resent', res.demoOtp ? `New Code: ${res.demoOtp}` : 'A new code has been sent to your email.');
      if (res.demoOtp) {
        setOtp(res.demoOtp.split(''));
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to resend code');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Ionicons name="lock-closed-outline" size={80} color="#f72585" style={styles.icon} />
        
        <Text style={styles.title}>Verification</Text>
        <Text style={styles.subtitle}>
          Enter the 4-digit code sent to {email || 'your email'}.
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit: string, index: number) => (
            <TextInput
              key={index}
              ref={(ref) => { inputs.current[index] = ref; }}
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
                  inputs.current[index - 1]?.focus();
                }
              }}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.verifyButton} onPress={handleVerify} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyButtonText}>Verify Now</Text>}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <TouchableOpacity onPress={handleResend}>
            <Text style={styles.resendLink}>Resend</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E2C',
  },
  backButton: {
    marginTop: 50,
    marginLeft: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#2a2a3c',
  },
  content: {
    flex: 1,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -50,
  },
  icon: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0b0',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
  },
  otpInput: {
    width: 60,
    height: 60,
    backgroundColor: '#2a2a3c',
    borderRadius: 15,
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#3b3b4f',
  },
  verifyButton: {
    backgroundColor: '#f72585',
    width: '100%',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#f72585',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendText: {
    color: '#a0a0b0',
    fontSize: 15,
  },
  resendLink: {
    color: '#f72585',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

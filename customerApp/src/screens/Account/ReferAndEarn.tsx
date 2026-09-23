import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ReferAndEarnScreen() {
  const referralCode = 'DRIVE2026';

  const onShare = async () => {
    try {
      await Share.share({
        message: `Sign up on DriveMate with my code ${referralCode} and get ₹50 off your first ride!`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.graphicContainer}>
        <Ionicons name="gift" size={100} color="#f72585" />
      </View>
      
      <Text style={styles.title}>Invite Friends & Earn!</Text>
      <Text style={styles.subtitle}>
        Get ₹50 in DriveMate Cash for every friend who takes their first ride using your referral code.
      </Text>

      <View style={styles.codeContainer}>
        <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
        <Text style={styles.codeValue}>{referralCode}</Text>
      </View>

      <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
        <Ionicons name="share-social-outline" size={20} color="#fff" />
        <Text style={styles.shareBtnText}>Share Code</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 24,
  },
  graphicContainer: {
    marginTop: 40,
    marginBottom: 30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#ffe5f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a1a2e',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  codeContainer: {
    backgroundColor: '#f8f8f8',
    borderWidth: 2,
    borderColor: '#eee',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  codeLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  codeValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#3b5998',
    letterSpacing: 2,
  },
  shareBtn: {
    flexDirection: 'row',
    backgroundColor: '#f72585',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  }
});

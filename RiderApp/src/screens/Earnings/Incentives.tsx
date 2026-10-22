import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Clipboard, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { riderService } from '../../services/riderService';
import { RiderIncentivesData } from '../../services/types';

export default function IncentivesScreen() {
  const [data, setData] = useState<RiderIncentivesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIncentives = useCallback(async () => {
    try {
      const res = await riderService.getIncentives();
      setData(res);
    } catch (err) {
      console.log('Failed to fetch incentives:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchIncentives();
  }, [fetchIncentives]);

  const copyReferralCode = () => {
    const code = data?.referralCode || 'ALEX2025';
    Clipboard.setString(code);
    Alert.alert('Copied!', `Referral code ${code} copied to clipboard.`);
  };

  const progressPercent = data?.progressPercentage ?? 70;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchIncentives(); }} colors={['#FFD700']} />}
    >
      <Text style={styles.title}>Rewards & Incentives</Text>
      
      {/* Referral Card */}
      <TouchableOpacity activeOpacity={0.9} onPress={copyReferralCode} style={[styles.card, { backgroundColor: '#FFD700' }]}>
        <Text style={styles.cardHeader}>Refer & Earn</Text>
        <Text style={styles.cardText}>Invite a fellow driver and get ₹100 when they complete their first 5 rides.</Text>
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>Tap to Copy Your Code:</Text>
          <Text style={styles.code}>{data?.referralCode || 'ALEX2025'}</Text>
        </View>
      </TouchableOpacity>

      {/* Loyalty Points */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>Loyalty Points</Text>
        <Text style={styles.points}>{data?.loyaltyPoints ?? 350} pts</Text>
        <Text style={styles.subText}>Earn 10 points for every completed trip</Text>
        
        <Text style={{ marginTop: 20, fontWeight: 'bold', color: '#333' }}>Progress to Gold Member</Text>
        <View style={styles.progressBar}>
           <View style={{ width: `${progressPercent}%`, backgroundColor: '#2ecc71', height: '100%' }} />
        </View>
        <Text style={{ fontSize: 12, color: 'gray', marginTop: 5 }}>
          {data?.pointsNeeded ?? 150} more points needed for Gold Tier
        </Text>
      </View>

      {/* Active Incentives / Bonuses */}
      <Text style={[styles.title, { fontSize: 20, marginTop: 10 }]}>Active Bonuses</Text>
      {(data?.incentives || []).map((inc, index) => (
        <View key={inc._id || index} style={styles.bonusCard}>
          <View style={styles.bonusTop}>
            <Ionicons name="flame" size={24} color="#f72585" />
            <Text style={styles.bonusTitle}>{inc.title}</Text>
          </View>
          <Text style={styles.bonusDesc}>{inc.description}</Text>
          {inc.target ? (
            <View style={styles.progressBar}>
              <View style={{ width: `${Math.min(100, Math.round(((inc.progress || 0) / inc.target) * 100))}%`, backgroundColor: '#f72585', height: '100%' }} />
            </View>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#1a1a2e' },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  cardHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#1a1a2e' },
  cardText: { fontSize: 15, marginBottom: 15, color: '#333', lineHeight: 20 },
  codeBox: { backgroundColor: 'rgba(255,255,255,0.7)', padding: 12, borderRadius: 10, alignItems: 'center' },
  codeLabel: { fontSize: 12, fontWeight: 'bold', color: '#666' },
  code: { fontSize: 24, fontWeight: '900', letterSpacing: 2, color: '#1a1a2e', marginTop: 2 },
  points: { fontSize: 40, fontWeight: 'bold', color: '#007AFF', marginVertical: 4 },
  subText: { color: 'gray', fontSize: 14 },
  progressBar: { height: 10, backgroundColor: '#eee', borderRadius: 5, marginTop: 10, overflow: 'hidden' },
  bonusCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  bonusTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  bonusTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 8, color: '#1a1a2e' },
  bonusDesc: { fontSize: 14, color: '#666', lineHeight: 20 }
});
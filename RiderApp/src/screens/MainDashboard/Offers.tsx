import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Clipboard, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { riderService } from '../../services/riderService';
import { RiderOffer } from '../../services/types';

export default function OffersScreen() {
  const [offers, setOffers] = useState<RiderOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOffers = useCallback(async () => {
    try {
      const data = await riderService.getOffers();
      setOffers(data);
    } catch (err) {
      console.log('Failed to fetch offers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const copyCode = (code?: string) => {
    if (!code) return;
    Clipboard.setString(code);
    Alert.alert('Copied!', `Offer code ${code} copied to clipboard.`);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOffers(); }} colors={['#f72585']} />}
    >
      <Text style={styles.headerTitle}>Driver Offers & Incentives</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#f72585" style={{ marginTop: 40 }} />
      ) : (
        offers.map((offer, idx) => {
          const progressPercent = offer.target
            ? Math.min(100, Math.round(((offer.progress || 0) / offer.target) * 100))
            : 0;

          return (
            <View key={offer._id || idx} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.iconBox, { backgroundColor: idx % 2 === 0 ? '#ffe5e5' : '#eef2ff' }]}>
                  <Ionicons
                    name={idx % 2 === 0 ? 'flame' : 'star'}
                    size={24}
                    color={idx % 2 === 0 ? '#e74c3c' : '#3b5998'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.offerTitle}>{offer.title}</Text>
                  <Text style={styles.offerDesc}>{offer.description}</Text>
                </View>
              </View>

              {offer.target ? (
                <>
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {offer.progress || 0} / {offer.target} Completed
                  </Text>
                </>
              ) : null}

              {offer.code ? (
                <TouchableOpacity style={styles.codeButton} onPress={() => copyCode(offer.code)}>
                  <Text style={styles.codeText}>Code: {offer.code}</Text>
                  <Ionicons name="copy-outline" size={16} color="#f72585" />
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', padding: 20, paddingTop: 40, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  card: { backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTop: { flexDirection: 'row', marginBottom: 14 },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  offerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  offerDesc: { fontSize: 14, color: '#666', lineHeight: 20 },
  progressBg: { height: 8, backgroundColor: '#eee', borderRadius: 4, marginBottom: 8, marginTop: 4 },
  progressFill: { height: '100%', backgroundColor: '#e74c3c', borderRadius: 4 },
  progressText: { fontSize: 13, color: '#888', fontWeight: '500' },
  codeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fdf2f7', padding: 10, borderRadius: 8, marginTop: 12 },
  codeText: { color: '#f72585', fontWeight: 'bold', fontSize: 14 },
});

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Clipboard, Alert, RefreshControl, ActivityIndicator } from 'react-native';
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

  const copyToClipboard = (code: string) => {
    Clipboard.setString(code);
    Alert.alert('Copied', `${code} copied to clipboard!`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Offers & Promo Codes</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#f72585" style={{ marginTop: 40 }} />
      ) : (
        <FlatList 
          data={offers}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.code}>{item.code || item.title}</Text>
                <Text style={styles.desc}>{item.description}</Text>
                <Text style={styles.valid}>
                  Valid until {item.validUntil ? new Date(item.validUntil).toLocaleDateString() : 'Dec 31'}
                </Text>
              </View>
              {item.code ? (
                <TouchableOpacity style={styles.btn} onPress={() => copyToClipboard(item.code!)}>
                  <Text style={styles.btnText}>Copy</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchOffers(); }}
              colors={['#f72585']}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1a1a2e' },
  card: { backgroundColor: 'white', padding: 18, borderRadius: 14, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 },
  code: { fontSize: 18, fontWeight: 'bold', color: '#2ecc71', marginBottom: 5 },
  desc: { fontSize: 14, color: '#333', marginBottom: 5, lineHeight: 18 },
  valid: { fontSize: 12, color: 'gray' },
  btn: { backgroundColor: '#f0f0f0', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  btnText: { fontWeight: 'bold', color: '#333' }
});
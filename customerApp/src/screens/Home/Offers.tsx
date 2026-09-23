import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MyRewardsScreen() {
  const coupons = [
    { id: 1, title: '50% off on your next Auto ride', validTill: 'Valid till 30 Sep', code: 'AUTO50', color: '#4cc9f0' },
    { id: 2, title: 'Flat ₹20 off on Bike taxi', validTill: 'Valid till 25 Sep', code: 'BIKE20', color: '#f72585' },
    { id: 3, title: 'Free ride up to ₹100', validTill: 'Valid till 15 Oct', code: 'FREE100', color: '#3a0ca3' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="medal" size={40} color="#f7bc00" />
        <Text style={styles.headerTitle}>Available Rewards</Text>
      </View>

      <View style={styles.couponsList}>
        {coupons.map((coupon) => (
          <View key={coupon.id} style={[styles.couponCard, { borderLeftColor: coupon.color }]}>
            <View style={styles.couponLeft}>
              <Text style={styles.couponTitle}>{coupon.title}</Text>
              <Text style={styles.couponValid}>{coupon.validTill}</Text>
            </View>
            <TouchableOpacity style={styles.applyBtn}>
              <Text style={[styles.applyText, { color: coupon.color }]}>APPLY</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.scratchSection}>
        <Text style={styles.sectionTitle}>Scratch Cards</Text>
        <View style={styles.scratchGrid}>
          <View style={styles.scratchCard}>
            <Ionicons name="lock-closed" size={30} color="#ccc" />
            <Text style={styles.scratchText}>Locked</Text>
          </View>
          <View style={styles.scratchCard}>
            <Ionicons name="lock-closed" size={30} color="#ccc" />
            <Text style={styles.scratchText}>Locked</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#fff',
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a2e',
    marginTop: 10,
  },
  couponsList: {
    padding: 16,
  },
  couponCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  couponLeft: {
    flex: 1,
    paddingRight: 10,
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  couponValid: {
    fontSize: 13,
    color: '#888',
  },
  applyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
  },
  applyText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  scratchSection: {
    padding: 16,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  scratchGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scratchCard: {
    width: '48%',
    height: 120,
    backgroundColor: '#e9ecef',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderStyle: 'dashed',
  },
  scratchText: {
    marginTop: 8,
    color: '#999',
    fontWeight: '600',
  }
});

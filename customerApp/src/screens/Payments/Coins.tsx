import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CoinsScreen() {
  const transactions = [
    { id: '1', type: 'earned', amount: 50, desc: 'Ride completed', date: '02 Sep 2026' },
    { id: '2', type: 'spent', amount: 20, desc: 'Discount applied', date: '01 Sep 2026' },
    { id: '3', type: 'earned', amount: 100, desc: 'Referral bonus', date: '28 Aug 2026' },
  ];

  const renderItem = ({ item }: any) => (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={[styles.iconBox, { backgroundColor: item.type === 'earned' ? '#e6f9ec' : '#fdecea' }]}>
          <Ionicons 
            name={item.type === 'earned' ? 'arrow-down' : 'arrow-up'} 
            size={20} 
            color={item.type === 'earned' ? '#2ecc71' : '#e74c3c'} 
          />
        </View>
        <View>
          <Text style={styles.desc}>{item.desc}</Text>
          <Text style={styles.date}>{item.date}</Text>
        </View>
      </View>
      <Text style={[styles.amount, { color: item.type === 'earned' ? '#2ecc71' : '#e74c3c' }]}>
        {item.type === 'earned' ? '+' : '-'}{item.amount}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.coinBadge}>
          <Ionicons name="cash" size={24} color="#f7bc00" />
        </View>
        <Text style={styles.balance}>1,250</Text>
        <Text style={styles.balanceLabel}>Total Coins Balance</Text>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Recent Transactions</Text>
        <FlatList 
          data={transactions}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: {
    backgroundColor: '#1a1a2e',
    padding: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  coinBadge: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  balance: { fontSize: 40, fontWeight: '900', color: '#fff' },
  balanceLabel: { color: '#a0a0b0', fontSize: 16, marginTop: 4 },
  listContainer: { flex: 1, padding: 20 },
  listTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 20 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  desc: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', marginBottom: 4 },
  date: { fontSize: 12, color: '#888' },
  amount: { fontSize: 18, fontWeight: 'bold' }
});

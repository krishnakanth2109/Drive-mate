import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TransactionDetails({ route, navigation }: any) {
  const transaction = route?.params?.transaction || null;

  if (!transaction) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="receipt-outline" size={56} color="#94a3b8" />
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginTop: 12 }}>
            No Transaction Selected
          </Text>
          <Text style={{ color: '#64748b', marginTop: 6, textAlign: 'center' }}>
            Select a transaction from your Wallet ledger to view full breakdown.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isCredit = transaction.type === 'credit' || transaction.direction === 'CREDIT';
  const dateFormatted = transaction.createdAt ? new Date(transaction.createdAt).toLocaleString('en-IN') : '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero Card */}
        <View style={styles.amountCard}>
          <View style={[styles.iconCircle, isCredit ? styles.iconCredit : styles.iconDebit]}>
            <Ionicons
              name={isCredit ? 'arrow-down' : 'arrow-up'}
              size={32}
              color={isCredit ? '#2ecc71' : '#e74c3c'}
            />
          </View>
          <Text style={[styles.amountText, isCredit ? styles.amountCredit : styles.amountDebit]}>
            {isCredit ? `+₹${transaction.amount}` : `-₹${transaction.amount}`}
          </Text>
          <Text style={styles.statusBadge}>Payment Successful</Text>
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Summary</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.value}>{transaction.description}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Transaction ID</Text>
            <Text style={styles.valueMono}>{transaction._id}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Date & Time</Text>
            <Text style={styles.value}>{dateFormatted}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Type</Text>
            <Text style={[styles.value, { textTransform: 'capitalize' }]}>{transaction.type}</Text>
          </View>
          {transaction.referenceId ? (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.label}>Reference ID</Text>
                <Text style={styles.valueMono}>{transaction.referenceId}</Text>
              </View>
            </>
          ) : null}
        </View>

        <TouchableOpacity style={styles.helpBtn} onPress={() => navigation.navigate('Support')}>
          <Ionicons name="help-circle-outline" size={20} color="#f72585" />
          <Text style={styles.helpText}>Need help with this transaction?</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f8f8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  content: { padding: 20 },
  amountCard: { backgroundColor: '#fff', borderRadius: 16, padding: 30, alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  iconCredit: { backgroundColor: '#e8f8f0' },
  iconDebit: { backgroundColor: '#fdeeed' },
  amountText: { fontSize: 36, fontWeight: '900', marginBottom: 6 },
  amountCredit: { color: '#2ecc71' },
  amountDebit: { color: '#e74c3c' },
  statusBadge: { backgroundColor: '#e8f8f0', color: '#2ecc71', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, fontSize: 13, fontWeight: 'bold', overflow: 'hidden' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  label: { fontSize: 15, color: '#888' },
  value: { fontSize: 15, color: '#333', fontWeight: '600' },
  valueMono: { fontSize: 13, color: '#555', fontFamily: 'monospace' },
  divider: { height: 1, backgroundColor: '#f0f0f0' },
  helpBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#f72585', backgroundColor: '#fff' },
  helpText: { color: '#f72585', fontWeight: 'bold', fontSize: 15, marginLeft: 8 },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

export default function WalletScreen() {
  const navigation = useNavigation<any>();

  const transactions = [
    { id: '1', title: 'Ride Earnings', date: 'Oct 07, 2026', amount: '+$24.50', type: 'credit', icon: 'car-outline' },
    { id: '2', title: 'Payout to Bank', date: 'Oct 05, 2026', amount: '-$150.00', type: 'debit', icon: 'business-outline' },
    { id: '3', title: 'Ride Earnings', date: 'Oct 04, 2026', amount: '+$12.50', type: 'credit', icon: 'car-outline' },
    { id: '4', title: 'Weekly Bonus', date: 'Oct 01, 2026', amount: '+$50.00', type: 'credit', icon: 'gift-outline' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="help-circle-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        
        {/* Balance Card */}
        <Animated.View entering={ZoomIn.duration(500).springify()} style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>$342.50</Text>
          
          <TouchableOpacity style={styles.transferBtn}>
            <Text style={styles.transferBtnText}>Transfer to Bank</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </Animated.View>

        {/* Linked Accounts */}
        <Animated.View entering={FadeInDown.duration(600).delay(200).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Linked Accounts</Text>
          
          <TouchableOpacity style={styles.methodCard}>
            <View style={styles.methodLeft}>
              <View style={[styles.methodIcon, { backgroundColor: '#e8f5e9' }]}>
                <Ionicons name="business" size={24} color="#4CAF50" />
              </View>
              <View>
                <Text style={styles.methodTitle}>Chase Checking</Text>
                <Text style={styles.methodSubtitle}>Acct ending in 8912</Text>
              </View>
            </View>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.addMethodBtn}>
            <Ionicons name="add-circle-outline" size={22} color="#1a1a2e" />
            <Text style={styles.addMethodText}>Link New Bank Account</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View entering={FadeInDown.duration(600).delay(400).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {transactions.map((t, index) => (
            <Animated.View 
              entering={FadeInDown.duration(500).delay(500 + index * 100).springify()} 
              key={t.id} 
              style={styles.transactionItem}
            >
              <View style={styles.transactionLeft}>
                <View style={[
                  styles.transactionIcon, 
                  t.type === 'credit' ? styles.iconCredit : styles.iconDebit
                ]}>
                  <Ionicons 
                    name={t.icon as any} 
                    size={22} 
                    color={t.type === 'credit' ? '#4CAF50' : '#f44336'} 
                  />
                </View>
                <View>
                  <Text style={styles.transactionTitle}>{t.title}</Text>
                  <Text style={styles.transactionDate}>{t.date}</Text>
                </View>
              </View>
              <Text style={[
                styles.transactionAmount, 
                t.type === 'credit' ? styles.amountCredit : styles.amountDebit
              ]}>
                {t.amount}
              </Text>
            </Animated.View>
          ))}
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  headerAction: {
    padding: 4,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  balanceCard: {
    backgroundColor: '#1a1a2e',
    margin: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '800',
    marginBottom: 24,
  },
  transferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 14,
    borderRadius: 12,
  },
  transferBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 16,
  },
  seeAllText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  methodSubtitle: {
    fontSize: 13,
    color: '#888',
  },
  addMethodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#d0d7e5',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: 'rgba(26, 26, 46, 0.03)',
  },
  addMethodText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconCredit: {
    backgroundColor: '#e8f5e9',
  },
  iconDebit: {
    backgroundColor: '#ffebee',
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: '#888',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  amountCredit: {
    color: '#4CAF50',
  },
  amountDebit: {
    color: '#f44336',
  }
});

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform, RefreshControl, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { riderService } from '../../services/riderService';
import { RiderWalletData, PaymentAccount, RiderTransaction } from '../../services/types';

export default function WalletScreen() {
  const navigation = useNavigation<any>();
  const [wallet, setWallet] = useState<RiderWalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Link bank modal
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  // Cash out modal
  const [payoutModalVisible, setPayoutModalVisible] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('500');

  const fetchWallet = useCallback(async () => {
    try {
      const data = await riderService.getWallet();
      setWallet(data);
    } catch (err) {
      console.log('Failed to fetch wallet:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const handleCashOut = async () => {
    const amt = parseFloat(payoutAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payout amount');
      return;
    }
    if ((wallet?.balance || 0) < amt) {
      Alert.alert('Insufficient Balance', 'Payout amount exceeds available wallet balance');
      return;
    }

    try {
      setLoading(true);
      await riderService.requestPayout(amt);
      setPayoutModalVisible(false);
      Alert.alert('Payout Initiated', `₹${amt} has been successfully sent to your bank account!`);
      await fetchWallet();
    } catch (err: any) {
      Alert.alert('Payout Failed', err.response?.data?.message || 'Failed to process payout');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAccount = async () => {
    if (!bankName || !accountNumber) {
      Alert.alert('Missing Fields', 'Please enter bank name and account number');
      return;
    }

    try {
      setLoading(true);
      await riderService.linkAccount({
        provider: bankName,
        type: 'Bank Account',
        accountNumber,
        last4: accountNumber.slice(-4)
      });
      setLinkModalVisible(false);
      setBankName('');
      setAccountNumber('');
      Alert.alert('Success', 'Bank account linked successfully!');
      await fetchWallet();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to link account');
    } finally {
      setLoading(false);
    }
  };

  const transactions = wallet?.transactions || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <TouchableOpacity style={styles.headerAction} onPress={() => navigation.navigate('Support')}>
          <Ionicons name="help-circle-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchWallet(); }} colors={['#f72585']} />}
      >
        
        {/* Balance Card */}
        <Animated.View entering={ZoomIn.duration(500).springify()} style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>₹{wallet?.balance?.toFixed(2) || '3,450.00'}</Text>
          
          <TouchableOpacity style={styles.transferBtn} onPress={() => setPayoutModalVisible(true)}>
            <Text style={styles.transferBtnText}>Transfer to Bank</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </Animated.View>

        {/* Linked Accounts */}
        <Animated.View entering={FadeInDown.duration(600).delay(200).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Linked Accounts</Text>
          
          {(wallet?.linkedAccounts || []).map((acc, index) => (
            <TouchableOpacity key={acc._id || index} style={styles.methodCard}>
              <View style={styles.methodLeft}>
                <View style={[styles.methodIcon, { backgroundColor: '#e8f5e9' }]}>
                  <Ionicons name="business" size={24} color="#4CAF50" />
                </View>
                <View>
                  <Text style={styles.methodTitle}>{acc.provider}</Text>
                  <Text style={styles.methodSubtitle}>Acct ending in {acc.last4 || '8912'}</Text>
                </View>
              </View>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity style={styles.addMethodBtn} onPress={() => setLinkModalVisible(true)}>
            <Ionicons name="add-circle-outline" size={22} color="#1a1a2e" />
            <Text style={styles.addMethodText}>Link New Bank Account</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View entering={FadeInDown.duration(600).delay(400).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Earnings')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {transactions.map((t, index) => {
            const isCredit = t.type === 'credit';
            const dateStr = t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Today';
            return (
              <Animated.View 
                entering={FadeInDown.duration(500).delay(300 + index * 60).springify()} 
                key={t._id || index} 
                style={styles.transactionItem}
              >
                <View style={styles.transactionLeft}>
                  <View style={[
                    styles.transactionIcon, 
                    isCredit ? styles.iconCredit : styles.iconDebit
                  ]}>
                    <Ionicons 
                      name={isCredit ? 'car-outline' : 'business-outline'} 
                      size={22} 
                      color={isCredit ? '#4CAF50' : '#f44336'} 
                    />
                  </View>
                  <View>
                    <Text style={styles.transactionTitle}>{t.description}</Text>
                    <Text style={styles.transactionDate}>{dateStr}</Text>
                  </View>
                </View>
                <Text style={[
                  styles.transactionAmount, 
                  isCredit ? styles.amountCredit : styles.amountDebit
                ]}>
                  {isCredit ? `+₹${t.amount}` : `-₹${t.amount}`}
                </Text>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Cashout Modal */}
        <Modal visible={payoutModalVisible} transparent animationType="slide">
          <View style={modalStyles.overlay}>
            <View style={modalStyles.content}>
              <Text style={modalStyles.title}>Transfer to Bank</Text>
              <Text style={modalStyles.sub}>Available Balance: ₹{wallet?.balance?.toFixed(2) || '0.00'}</Text>
              
              <Text style={modalStyles.label}>Amount (₹)</Text>
              <TextInput
                style={modalStyles.input}
                keyboardType="numeric"
                value={payoutAmount}
                onChangeText={setPayoutAmount}
                placeholder="500"
              />

              <View style={modalStyles.btnRow}>
                <TouchableOpacity style={modalStyles.cancelBtn} onPress={() => setPayoutModalVisible(false)}>
                  <Text style={modalStyles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={modalStyles.confirmBtn} onPress={handleCashOut}>
                  <Text style={modalStyles.confirmText}>Confirm Payout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Link Account Modal */}
        <Modal visible={linkModalVisible} transparent animationType="slide">
          <View style={modalStyles.overlay}>
            <View style={modalStyles.content}>
              <Text style={modalStyles.title}>Link Bank Account</Text>
              <Text style={modalStyles.sub}>Enter your bank information for deposits</Text>

              <Text style={modalStyles.label}>Bank / Provider Name</Text>
              <TextInput
                style={modalStyles.input}
                value={bankName}
                onChangeText={setBankName}
                placeholder="e.g. HDFC Bank, Chase, SBI"
              />

              <Text style={modalStyles.label}>Account Number</Text>
              <TextInput
                style={modalStyles.input}
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="e.g. 123456789012"
                keyboardType="numeric"
              />

              <View style={modalStyles.btnRow}>
                <TouchableOpacity style={modalStyles.cancelBtn} onPress={() => setLinkModalVisible(false)}>
                  <Text style={modalStyles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={modalStyles.confirmBtn} onPress={handleLinkAccount}>
                  <Text style={modalStyles.confirmText}>Link Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  sub: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 16 },
  label: { fontSize: 13, color: '#444', fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
  btnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelText: { color: '#666', fontWeight: 'bold' },
  confirmBtn: { backgroundColor: '#f72585', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  confirmText: { color: '#fff', fontWeight: 'bold' },
});

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

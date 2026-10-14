import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, FlatList, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../../services/api';

export default function WalletScreen() {
  const navigation = useNavigation<any>();

  const transactions = [
    { id: '1', title: 'Ride to Airport', date: 'Oct 07, 2026', amount: '-$24.50', type: 'debit', icon: 'car-outline' },
    { id: '2', title: 'Added Funds', date: 'Oct 05, 2026', amount: '+$50.00', type: 'credit', icon: 'add-circle-outline' },
    { id: '3', title: 'Cashback', date: 'Oct 02, 2026', amount: '+$2.50', type: 'credit', icon: 'gift-outline' },
    { id: '4', title: 'Ride to Downtown', date: 'Sep 28, 2026', amount: '-$12.00', type: 'debit', icon: 'car-outline' },
  ];

  const handleAddMoney = async () => {
    try {
      // 1. Create order on the backend
      const { data } = await api.post('/payment/create-order', { amount: 500, currency: 'INR' });
      if (!data.success) {
        Alert.alert('Error', 'Failed to create order');
        return;
      }

      // 2. Open Razorpay Checkout
      const options = {
        description: 'Adding funds to Wallet',
        image: 'https://i.imgur.com/3g7nmJC.png',
        currency: 'INR',
        key: 'rzp_test_YourTestKeyIdHere', // Replace with dynamic key from backend if needed
        amount: data.order.amount,
        name: 'DriveMate Wallet',
        order_id: data.order.id,
        prefill: {
          email: 'customer@drivemate.com',
          contact: '9876543210',
          name: 'Customer Name'
        },
        theme: { color: '#3b5998' }
      };

      let RazorpayCheckout: any = null;
      try {
        RazorpayCheckout = require('react-native-razorpay').default;
      } catch (_) {
        RazorpayCheckout = null;
      }

      if (!RazorpayCheckout || typeof RazorpayCheckout.open !== 'function') {
        Alert.alert('Razorpay Preview', 'Online payment requires a native standalone build. Mock $50 added to your wallet for testing.');
        return;
      }

      RazorpayCheckout.open(options)
        .then(async (data: any) => {
          // 3. Verify payment signature on backend
          try {
            const verifyRes = await api.post('/payment/verify-payment', {
              razorpay_order_id: data.razorpay_order_id,
              razorpay_payment_id: data.razorpay_payment_id,
              razorpay_signature: data.razorpay_signature,
            });
            if (verifyRes.data.success) {
              Alert.alert('Success', 'Money added to wallet successfully!');
            }
          } catch (e) {
            Alert.alert('Error', 'Payment verification failed');
          }
        })
        .catch((error: any) => {
          Alert.alert('Payment Cancelled', `Error: ${error.description}`);
        });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to initiate payment');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="time-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>$150.00</Text>
          
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.cardBtn} onPress={handleAddMoney}>
              <View style={styles.cardBtnIcon}>
                <Ionicons name="add" size={24} color="#fff" />
              </View>
              <Text style={styles.cardBtnText}>Add Money</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cardBtn}>
              <View style={[styles.cardBtnIcon, styles.sendBtnIcon]}>
                <Ionicons name="arrow-up" size={24} color="#3b5998" />
              </View>
              <Text style={styles.cardBtnText}>Send</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cardBtn}>
              <View style={[styles.cardBtnIcon, styles.requestBtnIcon]}>
                <Ionicons name="arrow-down" size={24} color="#3b5998" />
              </View>
              <Text style={styles.cardBtnText}>Request</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          
          <TouchableOpacity style={styles.methodCard}>
            <View style={styles.methodLeft}>
              <View style={[styles.methodIcon, { backgroundColor: '#e3f2fd' }]}>
                <Ionicons name="card" size={24} color="#1e88e5" />
              </View>
              <View>
                <Text style={styles.methodTitle}>Credit Card</Text>
                <Text style={styles.methodSubtitle}>**** **** **** 4242</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.addMethodBtn}>
            <Ionicons name="add-circle-outline" size={22} color="#3b5998" />
            <Text style={styles.addMethodText}>Add New Payment Method</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          
          {transactions.map((t) => (
            <View 
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
                    color={t.type === 'credit' ? '#4CAF50' : '#3b5998'} 
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
            </View>
          ))}
        </View>

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
    backgroundColor: '#f9fafc',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  balanceCard: {
    backgroundColor: '#3b5998',
    margin: 20,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#3b5998',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 30,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardBtn: {
    alignItems: 'center',
  },
  cardBtnIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  sendBtnIcon: {
    backgroundColor: '#fff',
  },
  requestBtnIcon: {
    backgroundColor: '#fff',
  },
  cardBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: 'rgba(59, 89, 152, 0.05)',
  },
  addMethodText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#3b5998',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
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
    backgroundColor: '#f0f4f8',
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
    color: '#333',
  }
});

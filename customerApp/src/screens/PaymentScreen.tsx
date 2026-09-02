import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentScreen() {
  const paymentMethods = [
    { id: 1, name: 'Paytm UPI', type: 'UPI', icon: 'logo-usd' },
    { id: 2, name: 'Amazon Pay', type: 'Wallet', icon: 'wallet-outline' },
    { id: 3, name: 'HDFC Bank **** 1234', type: 'Credit Card', icon: 'card-outline' },
    { id: 4, name: 'Cash', type: 'Cash', icon: 'cash-outline' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Wallet Balance Card */}
      <View style={styles.balanceCard}>
        <View>
          <Text style={styles.balanceTitle}>DriveMate Cash</Text>
          <Text style={styles.balanceAmount}>₹ 450.00</Text>
        </View>
        <TouchableOpacity style={styles.addMoneyBtn}>
          <Text style={styles.addMoneyText}>+ Add Money</Text>
        </TouchableOpacity>
      </View>

      {/* Payment Methods */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Linked Payment Methods</Text>
        {paymentMethods.map((method) => (
          <TouchableOpacity key={method.id} style={styles.methodRow}>
            <View style={styles.methodLeft}>
              <View style={styles.iconBox}>
                <Ionicons name={method.icon as any} size={24} color="#3b5998" />
              </View>
              <View>
                <Text style={styles.methodName}>{method.name}</Text>
                <Text style={styles.methodType}>{method.type}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Add New Method */}
      <TouchableOpacity style={styles.addNewBtn}>
        <Ionicons name="add-circle-outline" size={24} color="#f72585" />
        <Text style={styles.addNewText}>Add New Payment Method</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  balanceCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  balanceTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  addMoneyBtn: {
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addMoneyText: {
    color: '#3b5998',
    fontWeight: '700',
    fontSize: 14,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginVertical: 16,
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  methodType: {
    fontSize: 13,
    color: '#888',
  },
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
  },
  addNewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f72585',
    marginLeft: 10,
  }
});

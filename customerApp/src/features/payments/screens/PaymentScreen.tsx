import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function PaymentScreen() {
  const navigation = useNavigation<any>();
  const [selectedMethod, setSelectedMethod] = useState('wallet');

  const paymentMethods = [
    {
      id: 'wallet',
      title: 'DriveMate Wallet',
      subtitle: 'Balance: ₹500.00',
      icon: 'wallet',
      color: '#f72585',
      badge: 'Fastest',
    },
    {
      id: 'upi',
      title: 'Google Pay / PhonePe / UPI',
      subtitle: 'Instant UPI Intent Payment',
      icon: 'phone-portrait-outline',
      color: '#4361ee',
    },
    {
      id: 'card',
      title: 'Credit / Debit Card',
      subtitle: 'Visa, Mastercard, RuPay',
      icon: 'card-outline',
      color: '#7209b7',
    },
    {
      id: 'cash',
      title: 'Cash Payment',
      subtitle: 'Pay directly to your driver after ride',
      icon: 'cash-outline',
      color: '#06d6a0',
    },
  ];

  const handleAddPaymentMethod = () => {
    Alert.alert(
      'Add Payment Method',
      'UPI and Card linking is available in the DriveMate standalone app. Wallet is currently active.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Wallet')}>
          <Text style={styles.walletLink}>Wallet</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionHeader}>Saved Payment Options</Text>

        <View style={styles.methodsList}>
          {paymentMethods.map((method) => {
            const isSelected = selectedMethod === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                style={[styles.methodCard, isSelected && styles.selectedMethodCard]}
                activeOpacity={0.7}
                onPress={() => setSelectedMethod(method.id)}
              >
                <View style={[styles.iconCircle, { backgroundColor: `${method.color}15` }]}>
                  <Ionicons name={method.icon as any} size={22} color={method.color} />
                </View>

                <View style={styles.details}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.methodTitle}>{method.title}</Text>
                    {method.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{method.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.methodSub}>{method.subtitle}</Text>
                </View>

                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={isSelected ? '#f72585' : '#ccc'}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Add New Method Button */}
        <TouchableOpacity style={styles.addBtn} onPress={handleAddPaymentMethod}>
          <Ionicons name="add-circle-outline" size={20} color="#f72585" />
          <Text style={styles.addBtnText}>Link New UPI ID or Card</Text>
        </TouchableOpacity>

        {/* Manage Wallet Promo Card */}
        <View style={styles.walletPromoCard}>
          <View style={styles.promoLeft}>
            <Text style={styles.promoTitle}>Auto-Pay with Wallet</Text>
            <Text style={styles.promoDesc}>
              Never wait to scan QR codes. Rides are paid automatically upon trip completion.
            </Text>
            <TouchableOpacity
              style={styles.topUpBtn}
              onPress={() => navigation.navigate('Wallet')}
            >
              <Text style={styles.topUpText}>Manage Wallet →</Text>
            </TouchableOpacity>
          </View>
          <Ionicons name="shield-checkmark-outline" size={48} color="#f72585" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'android' ? 36 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  walletLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f72585',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  methodsList: {
    gap: 12,
    marginBottom: 20,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  selectedMethodCard: {
    borderColor: '#f72585',
    backgroundColor: '#fffbfc',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  details: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  methodSub: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#fff0f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffd6e7',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f72585',
  },
  addBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#ffd6e7',
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f72585',
  },
  walletPromoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  promoLeft: {
    flex: 1,
    marginRight: 12,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  promoDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    lineHeight: 16,
  },
  topUpBtn: {
    marginTop: 10,
  },
  topUpText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f72585',
  },
});

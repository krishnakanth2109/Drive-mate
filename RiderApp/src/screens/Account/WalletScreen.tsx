import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { riderService } from '../../services/riderService';
import { socket } from '../../services/api';
import { RiderWalletData, RiderProfile } from '../../services/types';
import RazorpayCheckoutModal, {
  RazorpayOrderPayload,
  RazorpaySuccessPayload,
} from '../../components/RazorpayCheckoutModal';

const { width } = Dimensions.get('window');

export default function WalletScreen() {
  const navigation = useNavigation<any>();
  const [wallet, setWallet] = useState<RiderWalletData | null>(null);
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add Money (Razorpay Top-Up) Modal
  const [topupModalVisible, setTopupModalVisible] = useState(false);
  const [topupAmount, setTopupAmount] = useState('500');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [checkoutOrder, setCheckoutOrder] = useState<RazorpayOrderPayload | null>(null);
  const [razorpayModalVisible, setRazorpayModalVisible] = useState(false);

  // Feedback Modal (works identically on Android, iOS, and Web)
  const [feedback, setFeedback] = useState<{
    visible: boolean;
    status: 'success' | 'failed' | 'cancelled';
    title: string;
    message: string;
    reference?: string;
  }>({
    visible: false,
    status: 'success',
    title: '',
    message: '',
  });

  // Link bank modal
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  // Cash out modal
  const [payoutModalVisible, setPayoutModalVisible] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('500');

  const formatCurrency = (amount: number | string | undefined | null) => {
    const num = Number(amount);
    if (amount === undefined || amount === null || isNaN(num)) return '₹0.00';
    return `₹${num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const fetchWallet = useCallback(async () => {
    try {
      const [walletData, profileData] = await Promise.all([
        riderService.getWallet(),
        riderService.getProfile().catch(() => null),
      ]);
      setWallet(walletData);
      if (profileData) setProfile(profileData);
    } catch (err) {
      console.log('Failed to fetch wallet:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();

    const handleWalletUpdate = (payload: any) => {
      if (payload?.balance !== undefined) {
        setWallet((prev) => (prev ? { ...prev, balance: Number(payload.balance) } : prev));
      }
      fetchWallet();
    };

    socket.on('wallet:updated', handleWalletUpdate);
    return () => {
      socket.off('wallet:updated', handleWalletUpdate);
    };
  }, [fetchWallet]);

  // Step 1: Create Razorpay Order on Backend & Launch Razorpay Checkout
  const handleProceedTopup = async (customAmount?: number) => {
    const numericAmount = customAmount ?? parseFloat(topupAmount);

    if (isNaN(numericAmount) || numericAmount < 10) {
      setFeedback({
        visible: true,
        status: 'failed',
        title: 'Invalid Amount',
        message: 'Minimum wallet top-up amount is ₹10.00.',
      });
      return;
    }
    if (numericAmount > 50000) {
      setFeedback({
        visible: true,
        status: 'failed',
        title: 'Limit Exceeded',
        message: 'Maximum single transaction limit is ₹50,000.00.',
      });
      return;
    }

    try {
      setIsProcessingPayment(true);
      const orderData = await riderService.createTopupOrder(numericAmount);
      if (!orderData || !orderData.orderId) {
        throw new Error('Could not generate Razorpay order');
      }

      setTopupModalVisible(false);
      setCheckoutOrder({
        orderId: orderData.orderId,
        amount: Number(orderData.amount || numericAmount),
        amountPaise: orderData.amountPaise || Math.round(numericAmount * 100),
        currency: orderData.currency || 'INR',
        keyId: orderData.keyId || process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '',
        description: 'DriveMate Partner Wallet Top-Up',
        prefill: {
          name: profile?.name || 'DriveMate Partner',
          email: profile?.email || 'driver@drivemate.com',
          contact: profile?.phone || '9876543210',
        },
      });
      setIsProcessingPayment(false);
      setTimeout(() => {
        setRazorpayModalVisible(true);
      }, Platform.OS === 'web' ? 50 : 320);
    } catch (err: any) {
      setIsProcessingPayment(false);
      setTopupModalVisible(false);
      setTimeout(() => {
        setFeedback({
          visible: true,
          status: 'failed',
          title: 'Order Creation Failed',
          message: err?.response?.data?.message || err?.message || 'Could not initiate Razorpay order.',
        });
      }, Platform.OS === 'web' ? 50 : 280);
    }
  };

  // Step 2: Verify Signature on Backend & Credit Wallet
  const handleVerifyRazorpayPayment = async (
    resp: RazorpaySuccessPayload,
    paidAmount: number
  ) => {
    try {
      setIsProcessingPayment(true);
      await riderService.verifyTopupPayment(resp);

      setIsProcessingPayment(false);
      setRazorpayModalVisible(false);
      setCheckoutOrder(null);

      setTimeout(() => {
        setFeedback({
          visible: true,
          status: 'success',
          title: 'Wallet Recharged!',
          message: `₹${paidAmount.toFixed(2)} has been verified by Razorpay and added to your partner wallet.`,
          reference: resp.razorpay_payment_id,
        });
      }, Platform.OS === 'web' ? 50 : 280);

      await fetchWallet();
    } catch (err: any) {
      setIsProcessingPayment(false);
      setRazorpayModalVisible(false);
      setTimeout(() => {
        setFeedback({
          visible: true,
          status: 'failed',
          title: 'Verification Failed',
          message: err?.response?.data?.message || 'Payment verification failed.',
        });
      }, Platform.OS === 'web' ? 50 : 280);
    }
  };

  // Fallback Test Simulator if offline
  const handleSimulateOfflineTest = async (orderId: string) => {
    const amt = checkoutOrder?.amount || parseFloat(topupAmount) || 500;
    try {
      setIsProcessingPayment(true);
      const simRes = await riderService.simulateTopupPayment(orderId);
      setIsProcessingPayment(false);
      setRazorpayModalVisible(false);
      setCheckoutOrder(null);
      setTimeout(() => {
        setFeedback({
          visible: true,
          status: 'success',
          title: 'Test Payment Credited!',
          message: `₹${amt.toFixed(2)} added to your partner wallet.`,
          reference: simRes?.paymentId || orderId,
        });
      }, Platform.OS === 'web' ? 50 : 280);
      await fetchWallet();
    } catch (err: any) {
      setIsProcessingPayment(false);
      setRazorpayModalVisible(false);
      setTimeout(() => {
        setFeedback({
          visible: true,
          status: 'failed',
          title: 'Top-Up Failed',
          message: err?.response?.data?.message || 'Could not simulate test payment.',
        });
      }, Platform.OS === 'web' ? 50 : 280);
    }
  };

  const handleCashOut = async () => {
    const amt = parseFloat(payoutAmount);
    if (isNaN(amt) || amt <= 0) {
      setFeedback({
        visible: true,
        status: 'failed',
        title: 'Invalid Amount',
        message: 'Please enter a valid payout amount.',
      });
      return;
    }
    const currentBalance = Number(wallet?.balance) || 0;
    if (currentBalance < amt) {
      setFeedback({
        visible: true,
        status: 'failed',
        title: 'Insufficient Balance',
        message: `Payout amount exceeds available balance (${formatCurrency(currentBalance)}).`,
      });
      return;
    }

    try {
      setLoading(true);
      await riderService.requestPayout(amt);
      setPayoutModalVisible(false);
      setFeedback({
        visible: true,
        status: 'success',
        title: 'Payout Initiated!',
        message: `${formatCurrency(amt)} has been transferred to your primary bank account.`,
      });
      await fetchWallet();
    } catch (err: any) {
      setFeedback({
        visible: true,
        status: 'failed',
        title: 'Payout Failed',
        message: err?.response?.data?.message || 'Failed to process payout.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAccount = async () => {
    if (!bankName || !accountNumber) {
      setFeedback({
        visible: true,
        status: 'failed',
        title: 'Missing Fields',
        message: 'Please enter bank name and account number.',
      });
      return;
    }

    try {
      setLoading(true);
      await riderService.linkAccount({
        provider: bankName,
        type: 'Bank Account',
        accountNumber,
        last4: accountNumber.slice(-4),
      });
      setLinkModalVisible(false);
      setBankName('');
      setAccountNumber('');
      setFeedback({
        visible: true,
        status: 'success',
        title: 'Account Linked!',
        message: `${bankName} ending in ${accountNumber.slice(-4)} has been linked.`,
      });
      await fetchWallet();
    } catch (err: any) {
      setFeedback({
        visible: true,
        status: 'failed',
        title: 'Link Failed',
        message: err?.response?.data?.message || 'Failed to link bank account.',
      });
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
        <Text style={styles.headerTitle}>Partner Wallet</Text>
        <TouchableOpacity style={styles.headerAction} onPress={() => navigation.navigate('Support')}>
          <Ionicons name="help-circle-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchWallet();
            }}
            colors={['#f72585']}
          />
        }
      >
        {/* Balance Card */}
        <Animated.View entering={ZoomIn.duration(500).springify()} style={styles.balanceCard}>
          <View style={styles.balanceTopRow}>
            <View>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              {loading && !wallet ? (
                <ActivityIndicator color="#fff" style={{ marginVertical: 14, alignSelf: 'flex-start' }} />
              ) : (
                <Text style={styles.balanceAmount}>{formatCurrency(wallet?.balance ?? 0)}</Text>
              )}
            </View>
            <View style={styles.rzpPill}>
              <Ionicons name="shield-checkmark" size={14} color="#06d6a0" />
              <Text style={styles.rzpPillText}>Razorpay Enabled</Text>
            </View>
          </View>

          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              style={styles.addMoneyBtn}
              onPress={() => setTopupModalVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle" size={18} color="#fff" />
              <Text style={styles.addMoneyBtnText}>Add Money</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.transferBtn}
              onPress={() => setPayoutModalVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="business-outline" size={18} color="#fff" />
              <Text style={styles.transferBtnText}>Cash Out</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Quick Razorpay Recharge Chips */}
        <View style={styles.quickSection}>
          <Text style={styles.quickTitle}>QUICK RAZORPAY TOP-UP</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {[100, 250, 500, 1000, 2000].map((amt) => (
              <TouchableOpacity
                key={amt}
                style={styles.quickChip}
                onPress={() => {
                  setTopupAmount(amt.toString());
                  setTopupModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.quickChipText}>+ ₹{amt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Linked Accounts */}
        <Animated.View entering={FadeInDown.duration(600).delay(200).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Linked Payout Accounts</Text>

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
        <Animated.View entering={FadeInDown.duration(600).delay(350).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Wallet Ledger</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Earnings')}>
              <Text style={styles.seeAllText}>Earnings</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="receipt-outline" size={32} color="#94a3b8" />
              <Text style={styles.emptyText}>No wallet transactions recorded yet.</Text>
            </View>
          ) : (
            transactions.map((t, index) => {
              const isCredit = t.type === 'credit';
              const dateStr = t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN') : 'Today';
              return (
                <Animated.View
                  entering={FadeInDown.duration(400).delay(100 + index * 40).springify()}
                  key={t._id || index}
                  style={styles.transactionItem}
                >
                  <View style={styles.transactionLeft}>
                    <View
                      style={[
                        styles.transactionIcon,
                        isCredit ? styles.iconCredit : styles.iconDebit,
                      ]}
                    >
                      <Ionicons
                        name={isCredit ? 'wallet-outline' : 'business-outline'}
                        size={22}
                        color={isCredit ? '#4CAF50' : '#f44336'}
                      />
                    </View>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.transactionTitle} numberOfLines={1}>
                        {t.description}
                      </Text>
                      <Text style={styles.transactionDate}>{dateStr}</Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      isCredit ? styles.amountCredit : styles.amountDebit,
                    ]}
                  >
                    {isCredit ? `+₹${Number(t.amount).toFixed(2)}` : `-₹${Number(t.amount).toFixed(2)}`}
                  </Text>
                </Animated.View>
              );
            })
          )}
        </Animated.View>
      </ScrollView>

      {/* MODAL 1: Add Money via Razorpay */}
        <Modal visible={topupModalVisible} transparent animationType="slide">
          <View style={modalStyles.overlay}>
            <View style={modalStyles.content}>
              <Text style={modalStyles.title}>Add Money to Wallet</Text>
              <Text style={modalStyles.sub}>
                Recharge via Razorpay using UPI, Debit/Credit Card, or Netbanking.
              </Text>

              <Text style={modalStyles.label}>Amount (₹)</Text>
              <TextInput
                style={modalStyles.input}
                keyboardType="numeric"
                value={topupAmount}
                onChangeText={setTopupAmount}
                placeholder="500"
              />

              <View style={modalStyles.chipRow}>
                {[100, 250, 500, 1000].map((amt) => {
                  const selected = topupAmount === amt.toString();
                  return (
                    <TouchableOpacity
                      key={amt}
                      style={[modalStyles.amtChip, selected && modalStyles.amtChipActive]}
                      onPress={() => setTopupAmount(amt.toString())}
                    >
                      <Text
                        style={[modalStyles.amtChipText, selected && modalStyles.amtChipTextActive]}
                      >
                        ₹{amt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={modalStyles.btnRow}>
                <TouchableOpacity
                  style={modalStyles.cancelBtn}
                  onPress={() => setTopupModalVisible(false)}
                >
                  <Text style={modalStyles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={modalStyles.confirmBtn}
                  onPress={() => handleProceedTopup()}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={modalStyles.confirmText}>
                      Pay {formatCurrency(parseFloat(topupAmount) || 0)}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL 2: Cashout Modal */}
        <Modal visible={payoutModalVisible} transparent animationType="slide">
          <View style={modalStyles.overlay}>
            <View style={modalStyles.content}>
              <Text style={modalStyles.title}>Transfer to Bank</Text>
              <Text style={modalStyles.sub}>
                Available Balance: {formatCurrency(wallet?.balance ?? 0)}
              </Text>

              <Text style={modalStyles.label}>Amount (₹)</Text>
              <TextInput
                style={modalStyles.input}
                keyboardType="numeric"
                value={payoutAmount}
                onChangeText={setPayoutAmount}
                placeholder="500"
              />

              <View style={modalStyles.btnRow}>
                <TouchableOpacity
                  style={modalStyles.cancelBtn}
                  onPress={() => setPayoutModalVisible(false)}
                >
                  <Text style={modalStyles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={modalStyles.confirmBtn} onPress={handleCashOut}>
                  <Text style={modalStyles.confirmText}>Confirm Payout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL 3: Link Account Modal */}
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
                placeholder="e.g. HDFC Bank, ICICI, SBI"
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
                <TouchableOpacity
                  style={modalStyles.cancelBtn}
                  onPress={() => setLinkModalVisible(false)}
                >
                  <Text style={modalStyles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={modalStyles.confirmBtn} onPress={handleLinkAccount}>
                  <Text style={modalStyles.confirmText}>Link Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL 4: Payment / Action Feedback */}
        <Modal visible={feedback.visible} transparent animationType="fade">
          <View style={modalStyles.overlay}>
            <View style={[modalStyles.content, { alignItems: 'center' }]}>
              <View
                style={[
                  modalStyles.feedbackCircle,
                  {
                    backgroundColor:
                      feedback.status === 'success'
                        ? '#06d6a0'
                        : feedback.status === 'cancelled'
                        ? '#ffd166'
                        : '#ef476f',
                  },
                ]}
              >
                <Ionicons
                  name={
                    feedback.status === 'success'
                      ? 'checkmark'
                      : feedback.status === 'cancelled'
                      ? 'alert'
                      : 'close'
                  }
                  size={34}
                  color="#fff"
                />
              </View>
              <Text style={[modalStyles.title, { textAlign: 'center', marginTop: 12 }]}>
                {feedback.title}
              </Text>
              <Text style={[modalStyles.sub, { textAlign: 'center' }]}>{feedback.message}</Text>
              {feedback.reference && (
                <Text style={modalStyles.refText}>Ref: {feedback.reference}</Text>
              )}
              <TouchableOpacity
                style={[modalStyles.confirmBtn, { width: '100%', alignItems: 'center', marginTop: 8 }]}
                onPress={() => setFeedback((prev) => ({ ...prev, visible: false }))}
              >
                <Text style={modalStyles.confirmText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL 5: Real Razorpay Checkout */}
        <RazorpayCheckoutModal
          visible={razorpayModalVisible}
          order={checkoutOrder}
          onSuccess={(resp) =>
            handleVerifyRazorpayPayment(
              resp,
              checkoutOrder?.amount || parseFloat(topupAmount) || 0
            )
          }
          onCancel={(reason) => {
            setRazorpayModalVisible(false);
            setCheckoutOrder(null);
            setIsProcessingPayment(false);
            setTimeout(() => {
              setFeedback({
                visible: true,
                status: 'cancelled',
                title: 'Payment Cancelled',
                message: reason || 'Payment was cancelled before completion.',
              });
            }, Platform.OS === 'web' ? 50 : 280);
          }}
          onError={(errMsg) => {
            setRazorpayModalVisible(false);
            setCheckoutOrder(null);
            setIsProcessingPayment(false);
            setTimeout(() => {
              setFeedback({
                visible: true,
                status: 'failed',
                title: 'Payment Failed',
                message: errMsg || 'Gateway payment could not be completed.',
              });
            }, Platform.OS === 'web' ? 50 : 280);
          }}
          onSimulateTestPayment={handleSimulateOfflineTest}
        />
    </SafeAreaView>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { backgroundColor: '#fff', borderRadius: 18, padding: 24, width: '100%', maxWidth: Math.min(400, width - 32) },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  sub: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 16 },
  label: { fontSize: 13, color: '#444', fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 16 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  amtChip: { flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  amtChipActive: { backgroundColor: '#1a1a2e' },
  amtChipText: { fontSize: 13, fontWeight: '700', color: '#334155' },
  amtChipTextActive: { color: '#fff' },
  btnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelText: { color: '#666', fontWeight: 'bold' },
  confirmBtn: { backgroundColor: '#f72585', paddingVertical: 11, paddingHorizontal: 20, borderRadius: 10 },
  confirmText: { color: '#fff', fontWeight: 'bold' },
  feedbackCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  refText: { fontSize: 11, color: '#64748b', marginBottom: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
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
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  headerAction: { padding: 4 },
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  scrollContent: { paddingBottom: 40 },
  balanceCard: {
    backgroundColor: '#1a1a2e',
    margin: 20,
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  balanceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 20,
  },
  rzpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(6, 214, 160, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  rzpPillText: {
    color: '#06d6a0',
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addMoneyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f72585',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 6,
  },
  addMoneyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  transferBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 6,
  },
  transferBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  quickSection: { paddingHorizontal: 20, marginBottom: 20 },
  quickTitle: { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 8, letterSpacing: 0.6 },
  quickChip: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickChipText: { fontSize: 13, fontWeight: '700', color: '#1a1a2e' },
  section: { paddingHorizontal: 20, marginBottom: 28 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 14 },
  seeAllText: { color: '#4CAF50', fontSize: 14, fontWeight: '600', marginBottom: 14 },
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
  methodLeft: { flexDirection: 'row', alignItems: 'center' },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  methodSubtitle: { fontSize: 13, color: '#888' },
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
  addMethodText: { marginLeft: 8, fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  emptyBox: {
    backgroundColor: '#fff',
    padding: 28,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    gap: 8,
  },
  emptyText: { fontSize: 13, color: '#64748b' },
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
  transactionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconCredit: { backgroundColor: '#e8f5e9' },
  iconDebit: { backgroundColor: '#ffebee' },
  transactionTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  transactionDate: { fontSize: 12, color: '#888' },
  transactionAmount: { fontSize: 15, fontWeight: '700' },
  amountCredit: { color: '#4CAF50' },
  amountDebit: { color: '#f44336' },
});

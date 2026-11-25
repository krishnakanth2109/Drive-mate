import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  FlatList,
  Platform,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  NativeModules,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { api, socket } from '../../../services/api';
import { useCustomer } from '../../../context/CustomerContext';
import RazorpayCheckoutModal, {
  RazorpayOrderPayload,
  RazorpaySuccessPayload,
} from '../../../components/payment/RazorpayCheckoutModal';

const { width } = Dimensions.get('window');

interface WalletData {
  walletId: string;
  balance: number;
  lockedBalance: number;
  availableBalance: number;
  currency: string;
  status: string;
}

interface TransactionItem {
  id: string;
  walletId: string;
  type: string; // 'TOPUP' | 'RIDE_FARE' | 'REFUND' | 'CASHBACK'
  amount: number;
  direction: 'CREDIT' | 'DEBIT';
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  status: string;
  referenceId?: string;
  referenceType?: string;
  description: string;
  metadata?: any;
  failureReason?: string;
  createdAt: string;
}

export default function WalletScreen() {
  const navigation = useNavigation<any>();
  const { currentUser, setCurrentUser } = useCustomer();

  // Authoritative State
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Status & Loaders
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'TOPUP' | 'RIDE_FARE' | 'REFUND'>('ALL');

  // Top-Up Modal & Razorpay Checkout State
  const [topupModalVisible, setTopupModalVisible] = useState(false);
  const [topupAmount, setTopupAmount] = useState('500');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [checkoutOrder, setCheckoutOrder] = useState<RazorpayOrderPayload | null>(null);
  const [razorpayModalVisible, setRazorpayModalVisible] = useState(false);
  const [paymentFeedback, setPaymentFeedback] = useState<{
    visible: boolean;
    status: 'success' | 'failed' | 'cancelled';
    title: string;
    message: string;
    amount?: number;
    reference?: string;
  }>({
    visible: false,
    status: 'success',
    title: '',
    message: '',
  });

  // Transaction Detail Modal
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);

  // Format currency consistently as Indian Rupee (INR)
  const formatCurrency = (amount: number | string | undefined | null) => {
    const num = Number(amount);
    if (amount === undefined || amount === null || isNaN(num)) return '₹0.00';
    return `₹${num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Format date helper
  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Fetch Authoritative Wallet Balance
  const fetchWallet = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/wallet');
      const data = res.data?.data !== undefined ? res.data.data : res.data;
      if (data) {
        setWallet(data);
        if (currentUser && setCurrentUser && data.balance !== undefined && data.balance !== null) {
          setCurrentUser({ ...currentUser, walletBalance: Number(data.balance) });
        }
      }
    } catch (err: any) {
      console.error('Error fetching wallet:', err);
      setError(err?.response?.data?.message || 'Could not connect to wallet service');
    }
  }, []);

  // Fetch Transactions with pagination
  const fetchTransactions = useCallback(
    async (targetPage = 1, filterType = activeFilter, append = false) => {
      try {
        const typeQuery = filterType === 'ALL' ? '' : `&type=${filterType}`;
        const res = await api.get(`/wallet/transactions?page=${targetPage}&limit=10${typeQuery}`);
        const data = res.data?.data !== undefined ? res.data.data : res.data;

        if (data && data.items) {
          if (append) {
            setTransactions((prev) => [...prev, ...data.items]);
          } else {
            setTransactions(data.items);
          }
          setPage(data.pagination?.currentPage || targetPage);
          setHasMore(Boolean(data.pagination?.hasMore));
          setTotalCount(data.pagination?.totalCount || 0);
        }
      } catch (err: any) {
        console.error('Error fetching transactions:', err);
      }
    },
    [activeFilter]
  );

  // Initial Load & Socket.IO real-time balance updates
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchWallet(), fetchTransactions(1, activeFilter, false)]);
      setLoading(false);
    };
    loadAll();

    const handleWalletUpdated = (payload: any) => {
      if (payload?.balance !== undefined) {
        setWallet((prev) =>
          prev
            ? {
                ...prev,
                balance: Number(payload.balance),
                availableBalance: Number(payload.balance) - Number(prev.lockedBalance || 0),
              }
            : prev
        );
      }
      fetchWallet();
      fetchTransactions(1, activeFilter, false);
    };

    socket.on('wallet:updated', handleWalletUpdated);
    return () => {
      socket.off('wallet:updated', handleWalletUpdated);
    };
  }, [fetchWallet, fetchTransactions, activeFilter]);

  // Pull to refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchWallet(), fetchTransactions(1, activeFilter, false)]);
    setRefreshing(false);
  };

  // Load more transactions
  const handleLoadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    await fetchTransactions(page + 1, activeFilter, true);
    setLoadingMore(false);
  };

  // Switch Filter
  const handleSelectFilter = (filter: 'ALL' | 'TOPUP' | 'RIDE_FARE' | 'REFUND') => {
    setActiveFilter(filter);
    fetchTransactions(1, filter, false);
  };

  // Preset Top-Up chip selector
  const selectPresetAmount = (amt: number) => {
    setTopupAmount(amt.toString());
  };

  // Verify Razorpay Payment Signature & Credit Wallet on Backend
  const verifyRazorpayPaymentOnBackend = async (
    response: RazorpaySuccessPayload,
    paidAmount: number
  ) => {
    try {
      setIsProcessingPayment(true);
      await api.post('/wallet/topup/verify', {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });

      setIsProcessingPayment(false);
      setRazorpayModalVisible(false);
      setCheckoutOrder(null);

      setPaymentFeedback({
        visible: true,
        status: 'success',
        title: 'Payment Successful!',
        message: `₹${paidAmount.toFixed(2)} has been credited to your DriveMate Wallet.`,
        amount: paidAmount,
        reference: response.razorpay_payment_id,
      });

      await fetchWallet();
      await fetchTransactions(1, activeFilter, false);
    } catch (vErr: any) {
      setIsProcessingPayment(false);
      setRazorpayModalVisible(false);
      setPaymentFeedback({
        visible: true,
        status: 'failed',
        title: 'Verification Failed',
        message:
          vErr?.response?.data?.message ||
          vErr?.message ||
          'Payment signature could not be verified.',
      });
    }
  };

  // Fallback Test Simulator (only triggered manually if gateway is unreachable offline)
  const handleSimulateOfflineTest = async (orderId: string) => {
    const numericAmount = checkoutOrder?.amount || parseFloat(topupAmount) || 500;
    try {
      setIsProcessingPayment(true);
      const simRes = await api.post('/wallet/topup/simulate-test-payment', { orderId });
      const simData = simRes.data?.data !== undefined ? simRes.data.data : simRes.data;

      setIsProcessingPayment(false);
      setRazorpayModalVisible(false);
      setCheckoutOrder(null);

      setPaymentFeedback({
        visible: true,
        status: 'success',
        title: 'Money Added Successfully!',
        message: `₹${numericAmount.toFixed(2)} added to your wallet.`,
        amount: numericAmount,
        reference: simData?.paymentId || orderId,
      });

      await fetchWallet();
      await fetchTransactions(1, activeFilter, false);
    } catch (simErr: any) {
      setIsProcessingPayment(false);
      setRazorpayModalVisible(false);
      setPaymentFeedback({
        visible: true,
        status: 'failed',
        title: 'Top-Up Failed',
        message: simErr?.response?.data?.message || 'Failed to complete test payment.',
      });
    }
  };

  // Handle Top-Up Execution via Razorpay (Native SDK, Expo Go WebView, or Web Standard Checkout)
  const handleProceedTopup = async () => {
    const numericAmount = parseFloat(topupAmount);

    if (isNaN(numericAmount) || numericAmount < 10) {
      setPaymentFeedback({
        visible: true,
        status: 'failed',
        title: 'Invalid Amount',
        message: 'Please enter a minimum top-up amount of ₹10.00',
      });
      return;
    }
    if (numericAmount > 50000) {
      setPaymentFeedback({
        visible: true,
        status: 'failed',
        title: 'Limit Exceeded',
        message: 'Maximum single top-up limit is ₹50,000.00',
      });
      return;
    }

    setIsProcessingPayment(true);

    try {
      // 1. Create authoritative Razorpay payment order on backend
      const res = await api.post('/wallet/topup/order', {
        amount: numericAmount,
        currency: 'INR',
      });

      const orderData = res.data?.data !== undefined ? res.data.data : res.data;
      if (!orderData || !orderData.orderId) {
        throw new Error('Failed to create payment order on backend');
      }

      setTopupModalVisible(false);

      const prefillEmail = currentUser?.email || 'commuter@drivemate.com';
      const prefillPhone = currentUser?.phone || '9876543210';
      const prefillName = currentUser?.name || 'DriveMate Commuter';

      // 2. Check if compiled Native Razorpay SDK is available (custom dev client / standalone APK)
      const hasNativeRazorpay =
        Platform.OS !== 'web' &&
        Boolean(NativeModules?.RNRazorpayCheckout);

      let RazorpayCheckout: any = null;
      if (hasNativeRazorpay) {
        try {
          RazorpayCheckout =
            require('react-native-razorpay').default || require('react-native-razorpay');
        } catch (_) {
          RazorpayCheckout = null;
        }
      }

      if (hasNativeRazorpay && RazorpayCheckout && typeof RazorpayCheckout.open === 'function') {
        const nativeOptions = {
          description: 'DriveMate Wallet Recharge',
          image: 'https://cdn-icons-png.flaticon.com/512/3258/3258446.png',
          currency: orderData.currency || 'INR',
          key: orderData.keyId,
          amount: orderData.amountPaise || Math.round(numericAmount * 100),
          name: 'DriveMate',
          order_id: orderData.orderId,
          prefill: {
            email: prefillEmail,
            contact: prefillPhone,
            name: prefillName,
          },
          theme: { color: '#f72585' },
        };

        RazorpayCheckout.open(nativeOptions)
          .then((response: any) => verifyRazorpayPaymentOnBackend(response, numericAmount))
          .catch((err: any) => {
            setIsProcessingPayment(false);
            const isCancelled = err?.code === 0 || err?.description?.includes('cancelled');
            setPaymentFeedback({
              visible: true,
              status: isCancelled ? 'cancelled' : 'failed',
              title: isCancelled ? 'Payment Cancelled' : 'Payment Failed',
              message: err?.description || 'The payment process was interrupted or cancelled.',
            });
          });
      } else {
        // 3. Open Real Razorpay Standard Checkout (Expo Go WebView on mobile, checkout.js on Web)
        setCheckoutOrder({
          orderId: orderData.orderId,
          amount: Number(orderData.amount || numericAmount),
          amountPaise: orderData.amountPaise || Math.round(numericAmount * 100),
          currency: orderData.currency || 'INR',
          keyId: orderData.keyId,
          description: 'DriveMate Wallet Recharge',
          prefill: {
            name: prefillName,
            email: prefillEmail,
            contact: prefillPhone,
          },
        });
        setIsProcessingPayment(false);
        setRazorpayModalVisible(true);
      }
    } catch (err: any) {
      setIsProcessingPayment(false);
      setPaymentFeedback({
        visible: true,
        status: 'failed',
        title: 'Top-Up Error',
        message: err?.response?.data?.message || err.message || 'Failed to initiate payment',
      });
    }
  };

  // Helper for transaction icon and color
  const getTransactionVisuals = (item: TransactionItem) => {
    switch (item.type) {
      case 'TOPUP':
        return {
          icon: 'wallet-outline',
          iconBg: '#e8f5e9',
          iconColor: '#2e7d32',
          sign: '+',
          amountColor: '#2e7d32',
        };
      case 'RIDE_FARE':
        return {
          icon: 'car-outline',
          iconBg: '#ffebee',
          iconColor: '#c62828',
          sign: '-',
          amountColor: '#1a1a2e',
        };
      case 'REFUND':
        return {
          icon: 'refresh-outline',
          iconBg: '#e3f2fd',
          iconColor: '#1565c0',
          sign: '+',
          amountColor: '#1565c0',
        };
      default:
        return {
          icon: item.direction === 'CREDIT' ? 'arrow-down-outline' : 'arrow-up-outline',
          iconBg: item.direction === 'CREDIT' ? '#e8f5e9' : '#f5f5f5',
          iconColor: item.direction === 'CREDIT' ? '#2e7d32' : '#616161',
          sign: item.direction === 'CREDIT' ? '+' : '-',
          amountColor: item.direction === 'CREDIT' ? '#2e7d32' : '#1a1a2e',
        };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DriveMate Wallet</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Help')}
          style={styles.headerBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="help-circle-outline" size={24} color="#1a1a2e" />
        </TouchableOpacity>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#f72585']}
            tintColor="#f72585"
          />
        }
      >
        {/* Error Notice */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color="#c62828" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={handleRefresh} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Balance Hero Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View>
              <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
              {loading ? (
                <ActivityIndicator color="#fff" style={{ marginTop: 8, alignSelf: 'flex-start' }} />
              ) : (
                <Text style={styles.balanceAmount}>{formatCurrency(wallet?.balance)}</Text>
              )}
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusBadgeText}>Active • 1-Click Pay</Text>
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.cardActionRow}>
            <TouchableOpacity
              style={styles.addMoneyBtn}
              activeOpacity={0.85}
              onPress={() => setTopupModalVisible(true)}
            >
              <Ionicons name="add-circle" size={22} color="#fff" />
              <Text style={styles.addMoneyBtnText}>Add Money</Text>
            </TouchableOpacity>

            <View style={styles.perkContainer}>
              <Ionicons name="shield-checkmark" size={16} color="#06d6a0" />
              <Text style={styles.perkText}>Zero payment fees on rides</Text>
            </View>
          </View>
        </View>

        {/* Quick Top-Up Bar */}
        <View style={styles.quickBar}>
          <Text style={styles.quickBarTitle}>Quick Recharge:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickChips}>
            {[100, 250, 500, 1000].map((amt) => (
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

        {/* Transaction History Section */}
        <View style={styles.historySection}>
          <View style={styles.historySectionHeader}>
            <Text style={styles.historySectionTitle}>Transaction History</Text>
            <Text style={styles.txCountText}>({totalCount} transactions)</Text>
          </View>

          {/* Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {[
              { id: 'ALL', label: 'All Activity' },
              { id: 'TOPUP', label: 'Recharges (+)' },
              { id: 'RIDE_FARE', label: 'Ride Fares (-)' },
              { id: 'REFUND', label: 'Refunds (+)' },
            ].map((f) => {
              const isSelected = activeFilter === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.filterChip, isSelected && styles.filterChipActive]}
                  onPress={() => handleSelectFilter(f.id as any)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* List of transactions */}
          {loading && transactions.length === 0 ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color="#f72585" />
              <Text style={styles.loadingText}>Fetching authoritative ledger...</Text>
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="receipt-outline" size={36} color="#9e9e9e" />
              </View>
              <Text style={styles.emptyTitle}>No Transactions Yet</Text>
              <Text style={styles.emptySub}>
                {activeFilter === 'ALL'
                  ? 'Add funds to your wallet to enjoy fast, automated checkout on every ride.'
                  : `No ${activeFilter.toLowerCase()} transactions found for this filter.`}
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => setTopupModalVisible(true)}
              >
                <Text style={styles.emptyAddBtnText}>Add Money Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            transactions.map((item) => {
              const visuals = getTransactionVisuals(item);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.txCard}
                  activeOpacity={0.7}
                  onPress={() => setSelectedTx(item)}
                >
                  <View style={styles.txLeft}>
                    <View style={[styles.txIconBox, { backgroundColor: visuals.iconBg }]}>
                      <Ionicons name={visuals.icon as any} size={22} color={visuals.iconColor} />
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txTitle} numberOfLines={1}>
                        {item.description}
                      </Text>
                      <Text style={styles.txDate}>{formatDateTime(item.createdAt)}</Text>
                    </View>
                  </View>

                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, { color: visuals.amountColor }]}>
                      {visuals.sign}
                      {formatCurrency(item.amount)}
                    </Text>
                    <View
                      style={[
                        styles.statusPill,
                        item.status === 'SUCCESS' ? styles.statusSuccess : styles.statusPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          item.status === 'SUCCESS' ? styles.statusSuccessText : styles.statusPendingText,
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* Load More Button */}
          {hasMore && (
            <TouchableOpacity
              style={styles.loadMoreBtn}
              onPress={handleLoadMore}
              disabled={loadingMore}
              activeOpacity={0.7}
            >
              {loadingMore ? (
                <ActivityIndicator color="#f72585" />
              ) : (
                <Text style={styles.loadMoreText}>Load More Transactions</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* MODAL 1: Add Money Top-Up Bottom Sheet */}
      <Modal visible={topupModalVisible} transparent animationType="slide">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.sheetHeader}>
              <Text style={modalStyles.sheetTitle}>Add Money to Wallet</Text>
              <TouchableOpacity
                onPress={() => setTopupModalVisible(false)}
                style={modalStyles.closeBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={modalStyles.sheetSub}>
              Top up your balance instantly using UPI, Debit/Credit Card, or Netbanking via Razorpay.
            </Text>

            {/* Amount Input */}
            <Text style={modalStyles.inputLabel}>ENTER AMOUNT</Text>
            <View style={modalStyles.inputWrapper}>
              <Text style={modalStyles.currencyPrefix}>₹</Text>
              <TextInput
                style={modalStyles.amountInput}
                keyboardType="numeric"
                value={topupAmount}
                onChangeText={setTopupAmount}
                placeholder="500"
                placeholderTextColor="#aaa"
                maxLength={6}
              />
              {topupAmount.length > 0 && (
                <TouchableOpacity onPress={() => setTopupAmount('')}>
                  <Ionicons name="close-circle" size={20} color="#bbb" />
                </TouchableOpacity>
              )}
            </View>

            {/* Quick Chips */}
            <Text style={modalStyles.chipsLabel}>POPULAR AMOUNTS</Text>
            <View style={modalStyles.chipsRow}>
              {[100, 250, 500, 1000].map((amt) => {
                const isSelected = topupAmount === amt.toString();
                return (
                  <TouchableOpacity
                    key={amt}
                    style={[modalStyles.amountChip, isSelected && modalStyles.amountChipActive]}
                    onPress={() => selectPresetAmount(amt)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        modalStyles.amountChipText,
                        isSelected && modalStyles.amountChipTextActive,
                      ]}
                    >
                      ₹{amt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Trust Banner */}
            <View style={modalStyles.trustBadge}>
              <Ionicons name="lock-closed" size={16} color="#4361ee" />
              <Text style={modalStyles.trustText}>
                Secured by Razorpay • 256-bit Bank Grade Encryption
              </Text>
            </View>

            {/* Pay Button */}
            <TouchableOpacity
              style={modalStyles.payBtn}
              onPress={handleProceedTopup}
              disabled={isProcessingPayment}
              activeOpacity={0.85}
            >
              {isProcessingPayment ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={modalStyles.payBtnText}>
                  Proceed to Pay {formatCurrency(parseFloat(topupAmount) || 0)}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Payment Feedback (Success / Failed / Cancelled) */}
      <Modal visible={paymentFeedback.visible} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.feedbackCard}>
            <View
              style={[
                modalStyles.feedbackIconCircle,
                paymentFeedback.status === 'success'
                  ? modalStyles.bgSuccess
                  : paymentFeedback.status === 'cancelled'
                  ? modalStyles.bgCancelled
                  : modalStyles.bgFailed,
              ]}
            >
              <Ionicons
                name={
                  paymentFeedback.status === 'success'
                    ? 'checkmark'
                    : paymentFeedback.status === 'cancelled'
                    ? 'alert'
                    : 'close'
                }
                size={36}
                color="#fff"
              />
            </View>

            <Text style={modalStyles.feedbackTitle}>{paymentFeedback.title}</Text>
            <Text style={modalStyles.feedbackMessage}>{paymentFeedback.message}</Text>

            {paymentFeedback.reference && (
              <View style={modalStyles.refRow}>
                <Text style={modalStyles.refLabel}>Payment Ref:</Text>
                <Text style={modalStyles.refValue}>{paymentFeedback.reference}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                modalStyles.feedbackActionBtn,
                paymentFeedback.status === 'success'
                  ? modalStyles.btnSuccess
                  : modalStyles.btnStandard,
              ]}
              onPress={() => setPaymentFeedback((p) => ({ ...p, visible: false }))}
              activeOpacity={0.8}
            >
              <Text style={modalStyles.feedbackActionText}>
                {paymentFeedback.status === 'success' ? 'Got It' : 'Close'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Transaction Detail Modal */}
      <Modal visible={Boolean(selectedTx)} transparent animationType="slide">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.detailCard}>
            <View style={modalStyles.detailHeader}>
              <Text style={modalStyles.detailHeaderTitle}>Transaction Details</Text>
              <TouchableOpacity onPress={() => setSelectedTx(null)} style={modalStyles.closeBtn}>
                <Ionicons name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedTx && (
              <ScrollView style={modalStyles.detailBody}>
                {/* Big Amount */}
                <View style={modalStyles.detailAmountBox}>
                  <Text style={modalStyles.detailAmountLabel}>{selectedTx.type} TRANSACTION</Text>
                  <Text
                    style={[
                      modalStyles.detailAmount,
                      {
                        color:
                          selectedTx.direction === 'CREDIT' ? '#2e7d32' : '#1a1a2e',
                      },
                    ]}
                  >
                    {selectedTx.direction === 'CREDIT' ? '+' : '-'}
                    {formatCurrency(selectedTx.amount)}
                  </Text>
                  <View style={modalStyles.statusBadgeSmall}>
                    <Text style={modalStyles.statusBadgeSmallText}>{selectedTx.status}</Text>
                  </View>
                </View>

                {/* Metadata Table */}
                <View style={modalStyles.metaRow}>
                  <Text style={modalStyles.metaKey}>Description</Text>
                  <Text style={modalStyles.metaVal}>{selectedTx.description}</Text>
                </View>

                <View style={modalStyles.metaRow}>
                  <Text style={modalStyles.metaKey}>Date & Time</Text>
                  <Text style={modalStyles.metaVal}>{formatDateTime(selectedTx.createdAt)}</Text>
                </View>

                <View style={modalStyles.metaRow}>
                  <Text style={modalStyles.metaKey}>Transaction ID</Text>
                  <Text style={modalStyles.metaValMonospace}>{selectedTx.id}</Text>
                </View>

                {selectedTx.referenceId && (
                  <View style={modalStyles.metaRow}>
                    <Text style={modalStyles.metaKey}>Reference</Text>
                    <Text style={modalStyles.metaValMonospace}>{selectedTx.referenceId}</Text>
                  </View>
                )}

                <View style={modalStyles.metaRow}>
                  <Text style={modalStyles.metaKey}>Balance Before</Text>
                  <Text style={modalStyles.metaVal}>{formatCurrency(selectedTx.balanceBefore)}</Text>
                </View>

                <View style={modalStyles.metaRow}>
                  <Text style={modalStyles.metaKey}>Balance After</Text>
                  <Text style={[modalStyles.metaVal, { fontWeight: '700' }]}>
                    {formatCurrency(selectedTx.balanceAfter)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={modalStyles.supportHelpBtn}
                  onPress={() => {
                    setSelectedTx(null);
                    navigation.navigate('Help');
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chatbubbles-outline" size={18} color="#f72585" />
                  <Text style={modalStyles.supportHelpText}>Need Help with this Transaction?</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL 4: Real Razorpay Checkout (Expo Go WebView & Web JS SDK) */}
      <RazorpayCheckoutModal
        visible={razorpayModalVisible}
        order={checkoutOrder}
        onSuccess={(resp) =>
          verifyRazorpayPaymentOnBackend(
            resp,
            checkoutOrder?.amount || parseFloat(topupAmount) || 0
          )
        }
        onCancel={(reason) => {
          setRazorpayModalVisible(false);
          setCheckoutOrder(null);
          setIsProcessingPayment(false);
          setPaymentFeedback({
            visible: true,
            status: 'cancelled',
            title: 'Payment Cancelled',
            message: reason || 'Payment was cancelled before completion.',
          });
        }}
        onError={(errMsg) => {
          setRazorpayModalVisible(false);
          setCheckoutOrder(null);
          setIsProcessingPayment(false);
          setPaymentFeedback({
            visible: true,
            status: 'failed',
            title: 'Payment Failed',
            message: errMsg || 'Gateway payment could not be completed.',
          });
        }}
        onSimulateTestPayment={handleSimulateOfflineTest}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 32 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  headerBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: -0.3,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#c62828',
    marginLeft: 8,
  },
  retryBtn: {
    backgroundColor: '#c62828',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  balanceCard: {
    margin: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 22,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  balanceAmount: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 214, 160, 0.18)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(6, 214, 160, 0.3)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#06d6a0',
    marginRight: 6,
  },
  statusBadgeText: {
    color: '#06d6a0',
    fontSize: 11,
    fontWeight: '700',
  },
  cardActionRow: {
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
  },
  addMoneyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f72585',
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowColor: '#f72585',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addMoneyBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 6,
  },
  perkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  perkText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
  },
  quickBar: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  quickBarTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#777',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickChips: {
    flexDirection: 'row',
    gap: 10,
  },
  quickChip: {
    backgroundColor: '#fff',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  historySection: {
    paddingHorizontal: 16,
  },
  historySectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
    gap: 8,
  },
  historySectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  txCountText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  filterScroll: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  filterChip: {
    backgroundColor: '#fff',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#1a1a2e',
    borderColor: '#1a1a2e',
  },
  filterChipText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  centerLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#777',
  },
  emptyContainer: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#edf2f7',
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a1a2e',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  emptyAddBtn: {
    backgroundColor: '#f72585',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  emptyAddBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  txIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 3,
  },
  txDate: {
    fontSize: 12,
    color: '#888',
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  statusPill: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusSuccess: {
    backgroundColor: '#e8f5e9',
  },
  statusPending: {
    backgroundColor: '#fff8e1',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusSuccessText: {
    color: '#2e7d32',
  },
  statusPendingText: {
    color: '#f57f17',
  },
  loadMoreBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  loadMoreText: {
    color: '#f72585',
    fontWeight: '700',
    fontSize: 14,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  sheetSub: {
    fontSize: 13,
    color: '#666',
    marginBottom: 20,
    lineHeight: 18,
  },
  closeBtn: {
    padding: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
    backgroundColor: '#fafbfc',
  },
  currencyPrefix: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a1a2e',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '900',
    color: '#1a1a2e',
    padding: 0,
  },
  chipsLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  amountChip: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  amountChipActive: {
    backgroundColor: '#1a1a2e',
  },
  amountChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  amountChipTextActive: {
    color: '#fff',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  trustText: {
    fontSize: 11,
    color: '#4361ee',
    fontWeight: '600',
    marginLeft: 6,
  },
  payBtn: {
    backgroundColor: '#f72585',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#f72585',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },

  // Feedback Card
  feedbackCard: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginBottom: 40,
    borderRadius: 22,
    padding: 26,
    alignItems: 'center',
    alignSelf: 'center',
    width: width - 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  feedbackIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  bgSuccess: {
    backgroundColor: '#06d6a0',
  },
  bgFailed: {
    backgroundColor: '#ef476f',
  },
  bgCancelled: {
    backgroundColor: '#ffd166',
  },
  feedbackTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  feedbackMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
  },
  refLabel: {
    fontSize: 11,
    color: '#888',
    marginRight: 6,
  },
  refValue: {
    fontSize: 11,
    color: '#333',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  feedbackActionBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSuccess: {
    backgroundColor: '#06d6a0',
  },
  btnStandard: {
    backgroundColor: '#1a1a2e',
  },
  feedbackActionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },

  // Detail Modal
  detailCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 24,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  detailHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  detailBody: {
    marginBottom: 10,
  },
  detailAmountBox: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 18,
    marginBottom: 18,
  },
  detailAmountLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailAmount: {
    fontSize: 32,
    fontWeight: '900',
  },
  statusBadgeSmall: {
    marginTop: 6,
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeSmallText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2e7d32',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  metaKey: {
    fontSize: 13,
    color: '#666',
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a2e',
    maxWidth: '60%',
    textAlign: 'right',
  },
  metaValMonospace: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#333',
    maxWidth: '60%',
  },
  supportHelpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#f72585',
    borderRadius: 12,
  },
  supportHelpText: {
    color: '#f72585',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { communityApi } from '../../api/communityApi';
import { API_BASE_URL } from '../../api/client';
import {
  Wallet,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  CreditCard,
  Receipt,
  Sparkles,
} from 'lucide-react';

interface WalletData {
  walletId: string;
  userId: string;
  userType: string;
  currency: string;
  balance: number;
  lockedBalance: number;
  availableBalance: number;
  status: string;
  updatedAt: string;
}

interface WalletTx {
  id: string;
  type: string;
  amount: number;
  direction: 'CREDIT' | 'DEBIT';
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  status: string;
  referenceId?: string;
  description: string;
  metadata?: any;
  createdAt: string;
}

interface WalletViewProps {
  userProfile?: any;
  API_URL?: string;
  theme?: string;
  socket?: any;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export function WalletView({
  userProfile,
  API_URL = API_BASE_URL,
  theme = 'dark',
  socket,
}: WalletViewProps) {
  const isDark = theme === 'dark';

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'TOPUP' | 'RIDE_FARE' | 'REFUND'>('ALL');

  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState<string>('500');
  const [processing, setProcessing] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    ref?: string;
  } | null>(null);

  const getAuthHeaders = () => {
    const token =
      sessionStorage.getItem('dm_user_token') ||
      sessionStorage.getItem('vlt_master_token') ||
      localStorage.getItem('token');
    return token
      ? {
          Authorization: `Bearer ${token}`,
          'x-auth-token': token,
        }
      : {};
  };

  const formatINR = (val: number | string | undefined | null) => {
    const num = Number(val);
    if (val === undefined || val === null || isNaN(num)) return '₹0.00';
    return `₹${num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const fetchWallet = useCallback(async () => {
    try {
      const data = await communityApi.getWallet();
      if (data) setWallet(data);
    } catch (err: any) {
      console.error('Failed to load wallet:', err);
    }
  }, []);

  const fetchTransactions = useCallback(
    async (targetPage = 1, filter = activeFilter, append = false) => {
      try {
        const params: Record<string, string> = { page: String(targetPage), limit: '12' };
        if (filter !== 'ALL') params.type = filter;
        const data = await communityApi.getWalletTransactions(params);
        if (data?.items) {
          setTransactions((prev) => (append ? [...prev, ...data.items] : data.items));
          setPage(data.pagination?.currentPage || targetPage);
          setHasMore(Boolean(data.pagination?.hasMore));
          setTotalCount(data.pagination?.totalCount || 0);
        }
      } catch (err) {
        console.error('Failed to load transactions:', err);
      }
    },
    [activeFilter]
  );

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchWallet(), fetchTransactions(1, activeFilter, false)]);
    setLoading(false);
  }, [fetchWallet, fetchTransactions, activeFilter]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Subscribe to real-time Socket.IO wallet updates
  useEffect(() => {
    if (!socket) return;
    const handleWalletUpdated = () => {
      fetchWallet();
      fetchTransactions(1, activeFilter, false);
    };
    socket.on('wallet:updated', handleWalletUpdated);
    return () => {
      socket.off('wallet:updated', handleWalletUpdated);
    };
  }, [socket, fetchWallet, fetchTransactions, activeFilter]);

  // Dynamically load Razorpay script if not already available
  const ensureRazorpayLoaded = (): Promise<void> => {
    if (window.Razorpay) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay Checkout script'));
      document.body.appendChild(script);
    });
  };

  // Trigger Razorpay Payment Flow
  const handleRazorpayTopup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const numericAmount = parseFloat(topupAmount);

    if (isNaN(numericAmount) || numericAmount < 10) {
      setStatusBanner({
        type: 'error',
        title: 'Invalid Amount',
        message: 'Minimum wallet top-up amount is ₹10.00.',
      });
      return;
    }
    if (numericAmount > 50000) {
      setStatusBanner({
        type: 'error',
        title: 'Limit Exceeded',
        message: 'Maximum single top-up amount is ₹50,000.00.',
      });
      return;
    }

    setProcessing(true);
    setStatusBanner(null);

    try {
      const orderData = await communityApi.createTopupOrder(numericAmount);

      if (!orderData?.orderId) {
        throw new Error('Could not create Razorpay payment order.');
      }

      await ensureRazorpayLoaded();

      const options = {
        key: orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amountPaise || Math.round(numericAmount * 100),
        currency: orderData.currency || 'INR',
        name: 'DriveMate',
        description: 'DriveMate Wallet Recharge',
        order_id: orderData.orderId,
        prefill: {
          name: userProfile?.name || 'DriveMate Member',
          email: userProfile?.email || '',
          contact: userProfile?.phone || '',
        },
        theme: {
          color: '#38c6ec',
        },
        handler: async (response: any) => {
          try {
            const verifyData = await communityApi.verifyTopupPayment({
              razorpay_order_id: response.razorpay_order_id || orderData.orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setStatusBanner({
              type: 'success',
              title: 'Wallet Recharged Successfully!',
              message: `${formatINR(numericAmount)} has been verified by Razorpay and credited to your wallet. New Balance: ${formatINR(verifyData?.newBalance ?? (wallet?.balance || 0) + numericAmount)}`,
              ref: response.razorpay_payment_id,
            });
            await Promise.all([fetchWallet(), fetchTransactions(1, activeFilter, false)]);
          } catch (vErr: any) {
            setStatusBanner({
              type: 'error',
              title: 'Verification Failed',
              message:
                vErr?.response?.data?.message ||
                vErr?.message ||
                'Payment verification failed on server.',
            });
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            setStatusBanner({
              type: 'info',
              title: 'Checkout Cancelled',
              message: 'Razorpay payment modal was closed before completing payment.',
            });
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (failResp: any) => {
        setProcessing(false);
        setStatusBanner({
          type: 'error',
          title: 'Payment Failed',
          message:
            failResp?.error?.description ||
            failResp?.error?.reason ||
            'Payment declined by gateway.',
        });
      });
      rzp.open();
    } catch (err: any) {
      setProcessing(false);
      setStatusBanner({
        type: 'error',
        title: 'Payment Initiation Error',
        message: err?.response?.data?.message || err?.message || 'Unable to start Razorpay checkout.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#38c6ec]/10 border border-[#38c6ec]/30 text-[#38c6ec] text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Powered by Razorpay Secure Checkout</span>
          </div>
          <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            DriveMate Digital Wallet
          </h1>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Add funds seamlessly via UPI, Cards, or Netbanking for 1-click instant ride settlements.
          </p>
        </div>

        <button
          onClick={refreshAll}
          disabled={loading}
          className={`self-start sm:self-auto px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            isDark
              ? 'bg-slate-900 border-white/10 text-white hover:bg-slate-800'
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Balance</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {statusBanner && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border flex items-start gap-3 ${
            statusBanner.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : statusBanner.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
          }`}
        >
          {statusBanner.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          ) : statusBanner.type === 'error' ? (
            <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs sm:text-sm">
            <p className="font-bold">{statusBanner.title}</p>
            <p className="opacity-90 mt-0.5">{statusBanner.message}</p>
            {statusBanner.ref && (
              <p className="font-mono text-[11px] opacity-80 mt-1">
                Razorpay Ref: {statusBanner.ref}
              </p>
            )}
          </div>
          <button
            onClick={() => setStatusBanner(null)}
            className="text-xs font-bold opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Top Grid: Balance Hero + Add Money Razorpay Card */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Balance Card */}
        <div className="lg:col-span-2 rounded-3xl p-6 bg-gradient-to-br from-[#0f172a] via-[#131d36] to-[#0b1120] border border-white/10 text-white shadow-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#38c6ec]/15 blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Wallet className="w-4 h-4 text-[#38c6ec]" />
                <span>Available Balance</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            </div>

            <div className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              {loading && !wallet ? '...' : formatINR(wallet?.balance ?? 0)}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Currency: INR • Locked / Pending: {formatINR(wallet?.lockedBalance ?? 0)}
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-slate-400 text-[10px] uppercase font-bold">Total Transactions</p>
              <p className="text-white font-bold text-base mt-0.5">{totalCount}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-slate-400 text-[10px] uppercase font-bold">Gateway Security</p>
              <p className="text-[#38c6ec] font-bold text-xs mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> HMAC SHA-256
              </p>
            </div>
          </div>
        </div>

        {/* Add Money via Razorpay Card */}
        <form
          onSubmit={handleRazorpayTopup}
          className={`lg:col-span-3 rounded-3xl p-6 border shadow-xl flex flex-col justify-between ${
            isDark
              ? 'bg-[#0b1120]/90 border-white/10 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-extrabold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#38c6ec]" />
                <span>Instant Wallet Top-Up (Razorpay)</span>
              </h2>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#38c6ec]/10 text-[#38c6ec]">
                UPI / Cards / Netbanking
              </span>
            </div>
            <p className={`text-xs mb-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Enter amount below (₹10 – ₹50,000) to launch Razorpay Standard Checkout.
            </p>

            {/* Amount Input */}
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Top-Up Amount (INR)
            </label>
            <div
              className={`flex items-center rounded-2xl border px-4 py-3 mb-4 transition-all ${
                isDark
                  ? 'bg-slate-900/90 border-white/10 focus-within:border-[#38c6ec]'
                  : 'bg-slate-50 border-slate-200 focus-within:border-sky-500'
              }`}
            >
              <span className="text-2xl font-black text-[#38c6ec] mr-2">₹</span>
              <input
                type="number"
                min={10}
                max={50000}
                step="1"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                placeholder="500"
                className="w-full bg-transparent text-2xl font-black focus:outline-none"
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[100, 250, 500, 1000, 2000].map((amt) => {
                const selected = Number(topupAmount) === amt;
                return (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => setTopupAmount(amt.toString())}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      selected
                        ? 'bg-[#38c6ec] text-black border-[#38c6ec] shadow-md'
                        : isDark
                        ? 'bg-slate-900 text-slate-300 border-white/10 hover:border-white/30'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    + ₹{amt}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={processing}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#38c6ec] to-blue-600 hover:brightness-110 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-60"
          >
            {processing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Initializing Razorpay Gateway...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Add {formatINR(parseFloat(topupAmount) || 0)} via Razorpay</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Authoritative Transaction Ledger */}
      <div
        className={`rounded-3xl p-6 border shadow-xl ${
          isDark
            ? 'bg-[#0b1120]/90 border-white/10 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-[#38c6ec]" />
            <h2 className="text-lg font-extrabold">Transaction Ledger</h2>
            <span className="text-xs text-slate-400">({totalCount} records)</span>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'TOPUP', label: 'Razorpay Recharges' },
              { id: 'RIDE_FARE', label: 'Ride Fares' },
              { id: 'REFUND', label: 'Refunds' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  activeFilter === f.id
                    ? 'bg-[#38c6ec]/15 text-[#38c6ec] border-[#38c6ec]/40'
                    : isDark
                    ? 'bg-slate-900 text-slate-400 border-white/10 hover:text-white'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading && transactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Loading wallet transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-700/50 rounded-2xl">
            <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-bold">No transactions yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Top up your wallet using Razorpay above to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const isCredit = tx.direction === 'CREDIT';
              return (
                <div
                  key={tx.id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDark
                      ? 'bg-slate-900/60 border-white/5 hover:border-white/15'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isCredit
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-rose-500/15 text-rose-400'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{tx.description}</p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{new Date(tx.createdAt).toLocaleString('en-IN')}</span>
                        {tx.referenceId && (
                          <span className="font-mono px-1.5 py-0.5 rounded bg-black/20">
                            Ref: {tx.referenceId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1">
                    <span
                      className={`text-base font-black ${
                        isCredit ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isCredit ? '+' : '-'}
                      {formatINR(tx.amount)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Bal: {formatINR(tx.balanceAfter)}
                    </span>
                  </div>
                </div>
              );
            })}

            {hasMore && (
              <button
                onClick={() => fetchTransactions(page + 1, activeFilter, true)}
                className="w-full py-2.5 text-xs font-bold text-[#38c6ec] hover:underline cursor-pointer"
              >
                Load More Transactions
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default WalletView;

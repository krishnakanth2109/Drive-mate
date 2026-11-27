import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../../services/api';

// Lazy-load react-native-webview only on native platforms (Android / iOS)
const NativeWebView: any =
  Platform.OS !== 'web' ? require('react-native-webview').WebView : null;

export interface RazorpayOrderPayload {
  orderId: string;
  amount: number;
  amountPaise: number;
  currency: string;
  keyId: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

export interface RazorpaySuccessPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckoutModalProps {
  visible: boolean;
  order: RazorpayOrderPayload | null;
  onSuccess: (response: RazorpaySuccessPayload) => void;
  onCancel: (reason?: string) => void;
  onError: (errorMessage: string) => void;
  onSimulateTestPayment?: (orderId: string) => void;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

const sanitizeContact = (contact?: string): string => {
  const digits = String(contact || '').replace(/[^\d]/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return '9876543210';
};

export default function RazorpayCheckoutModal({
  visible,
  order,
  onSuccess,
  onCancel,
  onError,
  onSimulateTestPayment,
}: RazorpayCheckoutModalProps) {
  const [loading, setLoading] = useState(true);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const settledRef = useRef(false);

  // Reset state whenever modal opens
  useEffect(() => {
    if (visible) {
      setLoading(true);
      setGatewayError(null);
      settledRef.current = false;
    }
  }, [visible, order?.orderId]);

  // Web Browser Checkout using official https://checkout.razorpay.com/v1/checkout.js
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible || !order) return;

    let cancelled = false;

    const launchWebRazorpay = async () => {
      try {
        if (!order.keyId) {
          throw new Error('Razorpay Key ID is missing. Check environment configuration.');
        }

        if (!window.Razorpay) {
          await new Promise<void>((resolve, reject) => {
            const existingScript = document.querySelector(
              'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
            ) as HTMLScriptElement | null;

            if (existingScript) {
              if (window.Razorpay) {
                resolve();
                return;
              }
              existingScript.addEventListener('load', () => resolve());
              existingScript.addEventListener('error', () =>
                reject(new Error('Failed to load Razorpay Checkout script'))
              );
              return;
            }

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () =>
              reject(new Error('Could not connect to Razorpay gateway'));
            document.body.appendChild(script);
          });
        }

        if (cancelled) return;
        setLoading(false);

        const options = {
          key: order.keyId,
          amount: Math.round(Number(order.amountPaise || Number(order.amount) * 100)),
          currency: order.currency || 'INR',
          name: 'DriveMate',
          description: order.description || 'DriveMate Wallet Recharge',
          image: 'https://cdn-icons-png.flaticon.com/512/3258/3258446.png',
          order_id: order.orderId,
          prefill: {
            name: order.prefill?.name || 'DriveMate User',
            email: order.prefill?.email || 'user@drivemate.com',
            contact: sanitizeContact(order.prefill?.contact),
          },
          theme: { color: '#f72585' },
          handler: (response: RazorpaySuccessPayload) => {
            if (settledRef.current) return;
            settledRef.current = true;
            onSuccess({
              razorpay_order_id: response.razorpay_order_id || order.orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: () => {
              if (!settledRef.current) {
                settledRef.current = true;
                onCancel('Payment checkout was closed before completion.');
              }
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (resp: any) => {
          if (settledRef.current) return;
          settledRef.current = true;
          onError(
            resp?.error?.description ||
              resp?.error?.reason ||
              'Payment failed on Razorpay gateway.'
          );
        });
        rzp.open();
      } catch (err: any) {
        if (!cancelled) {
          setLoading(false);
          setGatewayError(err?.message || 'Unable to load Razorpay Checkout');
        }
      }
    };

    launchWebRazorpay();

    return () => {
      cancelled = true;
    };
  }, [visible, order]);

  if (!visible || !order) return null;

  // On Web, Razorpay mounts its own native browser overlay when checkout.js opens.
  if (Platform.OS === 'web') {
    if (!loading && !gatewayError) return null;
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.webBackdrop}>
          <View style={styles.webCard}>
            <Ionicons
              name={gatewayError ? 'alert-circle' : 'shield-checkmark'}
              size={36}
              color={gatewayError ? '#ef476f' : '#f72585'}
            />
            <Text style={styles.webTitle}>
              {gatewayError ? 'Gateway Connection Issue' : 'Opening Razorpay Checkout...'}
            </Text>
            <Text style={styles.webSub}>
              {gatewayError || `Order ${order.orderId} • ₹${Number(order.amount).toFixed(2)}`}
            </Text>
            {loading && <ActivityIndicator color="#f72585" style={{ marginVertical: 12 }} />}
            {gatewayError && onSimulateTestPayment && (
              <TouchableOpacity
                style={styles.simBtn}
                onPress={() => onSimulateTestPayment(order.orderId)}
              >
                <Text style={styles.simBtnText}>Use Sandbox Instant Test Pay</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.webCloseBtn} onPress={() => onCancel()}>
              <Text style={styles.webCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const amountPaiseInt = Math.round(Number(order.amountPaise || Number(order.amount) * 100));
  const cleanContact = sanitizeContact(order.prefill?.contact);
  const callbackUrl = `${BASE_URL}/api/wallet/topup/callback`;

  // Native (Expo Go Android / iOS): Hosted Razorpay Standard Checkout inside WebView
  const razorpayHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Razorpay Secure Checkout</title>
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body {
      margin: 0; padding: 24px; min-height: 100vh;
      background: #f8f9fc; color: #1a1a2e;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .card {
      background: #fff; border-radius: 18px; padding: 24px; width: 100%; max-width: 380px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08); text-align: center;
    }
    .badge {
      display: inline-block; background: #fdf2f8; color: #f72585; font-weight: 700;
      font-size: 11px; padding: 6px 12px; border-radius: 20px; margin-bottom: 14px;
    }
    .amount { font-size: 32px; font-weight: 900; color: #1a1a2e; margin: 6px 0; }
    .sub { font-size: 13px; color: #64748b; margin-bottom: 18px; }
    .spinner {
      width: 34px; height: 34px; border: 3px solid #f1f5f9; border-top-color: #f72585;
      border-radius: 50%; animation: spin 0.8s linear infinite; margin: 14px auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .btn {
      width: 100%; background: #f72585; color: #fff; border: none; border-radius: 12px;
      padding: 14px; font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 14px;
    }
    .err { color: #e11d48; font-size: 13px; margin-top: 10px; display: none; word-break: break-word; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">RAZORPAY SECURE GATEWAY</div>
    <div class="amount">₹${Number(order.amount).toFixed(2)}</div>
    <div class="sub">${(order.description || 'DriveMate Wallet Recharge').replace(/</g, '&lt;')}</div>
    <div class="spinner" id="loader"></div>
    <div id="statusText" style="font-size:13px;color:#475569;">Connecting to Razorpay Checkout...</div>
    <div class="err" id="errorBox"></div>
    <button class="btn" id="reopenBtn" onclick="launchCheckout(true)">Pay with Razorpay</button>
  </div>

  <script>
    var hasOpenedOnce = false;
    var settled = false;

    function postMsg(obj) {
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(obj));
        }
      } catch (e) {}
    }

    window.onerror = function(msg) {
      showError('Checkout error: ' + msg);
      postMsg({ event: 'SCRIPT_ERROR', message: String(msg) });
    };

    function showError(text) {
      var loader = document.getElementById('loader');
      var status = document.getElementById('statusText');
      var errEl = document.getElementById('errorBox');
      if (loader) loader.style.display = 'none';
      if (status) status.style.display = 'none';
      if (errEl) {
        errEl.style.display = 'block';
        errEl.innerText = text;
      }
    }

    function handleScriptError() {
      showError('Could not load Razorpay Checkout script. Check internet connectivity.');
      postMsg({ event: 'SCRIPT_ERROR', message: 'Failed to load Razorpay Checkout JS' });
    }

    var options = {
      key: ${JSON.stringify(order.keyId)},
      amount: ${JSON.stringify(amountPaiseInt)},
      currency: ${JSON.stringify(order.currency || 'INR')},
      name: 'DriveMate',
      description: ${JSON.stringify(order.description || 'DriveMate Wallet Recharge')},
      image: 'https://cdn-icons-png.flaticon.com/512/3258/3258446.png',
      order_id: ${JSON.stringify(order.orderId)},
      callback_url: ${JSON.stringify(callbackUrl)},
      prefill: {
        name: ${JSON.stringify(order.prefill?.name || 'DriveMate User')},
        email: ${JSON.stringify(order.prefill?.email || 'user@drivemate.com')},
        contact: ${JSON.stringify(cleanContact)}
      },
      theme: { color: '#f72585' },
      handler: function(response) {
        if (settled) return;
        settled = true;
        postMsg({
          event: 'PAYMENT_SUCCESS',
          payload: {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id || ${JSON.stringify(order.orderId)},
            razorpay_signature: response.razorpay_signature
          }
        });
      },
      modal: {
        ondismiss: function() {
          if (settled) return;
          settled = true;
          postMsg({ event: 'PAYMENT_CANCELLED' });
        }
      }
    };

    function launchCheckout(force) {
      if (!force && hasOpenedOnce) return;
      if (!options.key) {
        showError('Razorpay Key ID is missing.');
        postMsg({ event: 'SCRIPT_ERROR', message: 'Razorpay Key ID is missing' });
        return;
      }
      if (typeof Razorpay === 'undefined') {
        if (force) {
          handleScriptError();
        }
        return;
      }
      hasOpenedOnce = true;
      try {
        var rzp = new Razorpay(options);
        rzp.on('payment.failed', function(resp) {
          if (settled) return;
          settled = true;
          postMsg({
            event: 'PAYMENT_FAILED',
            message: (resp && resp.error && (resp.error.description || resp.error.reason)) || 'Payment failed'
          });
        });
        var loader = document.getElementById('loader');
        var status = document.getElementById('statusText');
        if (loader) loader.style.display = 'none';
        if (status) status.innerText = 'Razorpay Checkout Ready';
        rzp.open();
      } catch (e) {
        showError(e.message || 'Checkout init error');
        postMsg({ event: 'PAYMENT_FAILED', message: e.message || 'Checkout init error' });
      }
    }
  </script>
  <script src="https://checkout.razorpay.com/v1/checkout.js" onload="launchCheckout(false)" onerror="handleScriptError()"></script>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { launchCheckout(false); }, 350);
    });
  </script>
</body>
</html>`;

  const handleWebViewMessage = (event: any) => {
    if (settledRef.current) return;
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.event === 'PAYMENT_SUCCESS' && msg.payload) {
        settledRef.current = true;
        onSuccess(msg.payload);
      } else if (msg.event === 'PAYMENT_CANCELLED') {
        settledRef.current = true;
        onCancel('Payment checkout was cancelled.');
      } else if (msg.event === 'PAYMENT_FAILED') {
        settledRef.current = true;
        onError(msg.message || 'Payment failed on Razorpay.');
      } else if (msg.event === 'SCRIPT_ERROR') {
        setGatewayError(msg.message || 'Unable to connect to Razorpay gateway.');
      }
    } catch (_) {}
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => onCancel()}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="lock-closed" size={18} color="#06d6a0" />
            <Text style={styles.headerTitle}>Razorpay Secure Checkout</Text>
          </View>
          <TouchableOpacity onPress={() => onCancel()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#1a1a2e" />
          </TouchableOpacity>
        </View>

        {NativeWebView ? (
          <NativeWebView
            source={{ html: razorpayHtml, baseUrl: 'https://drivemate.in' }}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            javaScriptCanOpenWindowsAutomatically
            setSupportMultipleWindows={false}
            thirdPartyCookiesEnabled
            sharedCookiesEnabled
            allowsInlineMediaPlayback
            mixedContentMode="always"
            startInLoadingState
            onLoadEnd={() => setLoading(false)}
            onError={(e: any) =>
              setGatewayError(e?.nativeEvent?.description || 'Failed to load payment view')
            }
            onHttpError={(e: any) => {
              if (e?.nativeEvent?.statusCode >= 500) {
                setGatewayError(`Gateway HTTP error ${e.nativeEvent.statusCode}`);
              }
            }}
            onMessage={handleWebViewMessage}
            onShouldStartLoadWithRequest={(req: any) => {
              const url = req.url || '';
              if (
                url.startsWith('upi://') ||
                url.startsWith('tez://') ||
                url.startsWith('phonepe://') ||
                url.startsWith('paytmmp://') ||
                url.startsWith('gpay://')
              ) {
                Linking.openURL(url).catch(() => {});
                return false;
              }
              return true;
            }}
            style={styles.webview}
          />
        ) : (
          <View style={styles.center}>
            <Text>WebView not available on this platform.</Text>
          </View>
        )}

        {gatewayError && onSimulateTestPayment && (
          <View style={styles.fallbackBar}>
            <Text style={styles.fallbackText}>{gatewayError}</Text>
            <TouchableOpacity
              style={styles.simBtn}
              onPress={() => onSimulateTestPayment(order.orderId)}
            >
              <Text style={styles.simBtnText}>Use Sandbox Instant Test Pay</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 28 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  closeBtn: {
    padding: 4,
  },
  webview: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackBar: {
    padding: 16,
    backgroundColor: '#fff1f2',
    borderTopWidth: 1,
    borderTopColor: '#fecdd3',
    alignItems: 'center',
    gap: 10,
  },
  fallbackText: {
    fontSize: 12,
    color: '#be123c',
    textAlign: 'center',
  },
  simBtn: {
    backgroundColor: '#1a1a2e',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  simBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  webBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    maxWidth: 380,
    width: '100%',
    alignItems: 'center',
  },
  webTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a2e',
    marginTop: 12,
    textAlign: 'center',
  },
  webSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center',
  },
  webCloseBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  webCloseText: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 14,
  },
});

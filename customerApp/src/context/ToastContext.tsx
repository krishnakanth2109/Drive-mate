import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions | string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  hideToast: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<any>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [translateY, opacity]);

  const showToast = useCallback(
    (options: ToastOptions | string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      const normalized: ToastOptions =
        typeof options === 'string'
          ? { title: options, type: 'info' }
          : { type: 'info', duration: 3500, ...options };

      setToast(normalized);

      translateY.setValue(-120);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const duration = normalized.duration || 3500;
      timerRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [translateY, opacity, hideToast]
  );

  const getTheme = (type?: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          color: '#10b981',
          bg: '#064e3b',
          border: '#059669',
        };
      case 'error':
        return {
          icon: 'close-circle' as const,
          color: '#ef4444',
          bg: '#7f1d1d',
          border: '#dc2626',
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          color: '#f59e0b',
          bg: '#78350f',
          border: '#d97706',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle' as const,
          color: '#00f2fe',
          bg: '#1e293b',
          border: '#f72585',
        };
    }
  };

  const theme = getTheme(toast?.type);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <SafeAreaView pointerEvents="box-none" style={styles.toastContainer}>
          <Animated.View
            style={[
              styles.toastCard,
              {
                borderColor: theme.border,
                transform: [{ translateY }],
                opacity,
              },
            ]}
          >
            <View style={[styles.iconBox, { backgroundColor: `${theme.color}22` }]}>
              <Ionicons name={theme.icon} size={24} color={theme.color} />
            </View>

            <View style={styles.textBox}>
              <Text style={styles.toastTitle} numberOfLines={1}>
                {toast.title}
              </Text>
              {toast.message ? (
                <Text style={styles.toastMessage} numberOfLines={2}>
                  {toast.message}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={hideToast}
              style={styles.closeBtn}
              activeOpacity={0.7}
              accessibilityLabel="Dismiss toast"
            >
              <Ionicons name="close" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 24 : 10,
    left: 0,
    right: 0,
    zIndex: 99999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  toastCard: {
    width: width - 32,
    maxWidth: 460,
    backgroundColor: '#1E1E2C',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textBox: {
    flex: 1,
    justifyContent: 'center',
  },
  toastTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  toastMessage: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 6,
    marginLeft: 8,
  },
});

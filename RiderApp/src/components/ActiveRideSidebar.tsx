import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  Modal, 
  TouchableWithoutFeedback,
  Linking,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export type ActiveRideSidebarProps = {
  visible: boolean;
  onClose: () => void;
  onBack?: () => void;
  ride?: any;
  customerName?: string;
  customerPhone?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  fare?: string | number;
  paymentMethod?: string;
  rideStatus?: string;
  onOptionSelect?: (option: string) => void;
};

export default function ActiveRideSidebar({ 
  visible, 
  onClose, 
  onBack,
  ride,
  customerName, 
  customerPhone,
  pickupLocation, 
  dropoffLocation,
  fare,
  paymentMethod,
  rideStatus,
  onOptionSelect 
}: ActiveRideSidebarProps) {
  const slideAnim = useRef(new Animated.Value(-width * 0.85)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Derive dynamic properties safely with fallbacks
  const displayName = customerName || ride?.customer?.name || ride?.customerName || 'Customer';
  const displayPhone = customerPhone || ride?.customer?.phone || ride?.customerPhone || '';
  const displayPickup = pickupLocation || ride?.pickup?.address || ride?.pickupAddress || 'Pickup Location';
  const displayDropoff = dropoffLocation || ride?.drop?.address || ride?.dropAddress || 'Dropoff Location';
  const displayFare = fare !== undefined ? fare : (ride?.fare || '0');
  const displayPayment = paymentMethod || ride?.paymentMethod || 'Cash / Wallet';
  const displayStatus = (rideStatus || ride?.status || 'ongoing').toUpperCase();

  const handleBack = onBack || onClose;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -width * 0.85,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleOptionPress = (action: string) => {
    if (action === 'contact' && displayPhone) {
      Linking.openURL(`tel:${displayPhone}`).catch(() => {
        Alert.alert('Calling unavailable', `Customer phone: ${displayPhone}`);
      });
      return;
    }
    if (action === 'navigate' && displayDropoff) {
      const query = encodeURIComponent(displayDropoff);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {
        Alert.alert('Navigation error', 'Unable to launch Google Maps');
      });
      return;
    }
    if (onOptionSelect) {
      onOptionSelect(action);
    }
    onClose();
  };

  const options = [
    { id: 'navigate', title: 'Open in Google Maps', icon: 'navigate-circle-outline', color: '#10b981', sub: 'Turn-by-turn road navigation' },
    { id: 'contact', title: 'Call Customer', icon: 'call-outline', color: '#3b82f6', sub: displayPhone ? displayPhone : 'Direct voice line' },
    { id: 'details', title: 'Fare & Toll Breakdown', icon: 'receipt-outline', color: '#8b5cf6', sub: `₹${displayFare} • ${displayPayment}` },
    { id: 'support', title: 'Driver Support & SOS', icon: 'shield-checkmark-outline', color: '#f59e0b', sub: '24/7 dedicated assistance' },
    { id: 'cancel', title: 'Cancel Trip', icon: 'close-circle-outline', color: '#ef4444', sub: 'Dispute or emergency cancellation' },
  ];

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleBack}>
      <View style={styles.overlayContainer}>
        {/* Backdrop for closing */}
        <TouchableWithoutFeedback onPress={handleBack}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Sidebar Content */}
        <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
          {/* Header with Navigation Back Button */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={handleBack} 
              style={styles.backButton}
              activeOpacity={0.7}
              accessibilityLabel="Navigate back"
            >
              <Ionicons name="arrow-back" size={22} color="#111827" />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerSub}>ACTIVE TRIP</Text>
              <Text style={styles.customerName} numberOfLines={1}>{displayName}</Text>
            </View>

            <TouchableOpacity 
              onPress={onClose} 
              style={styles.closeBtn}
              activeOpacity={0.7}
              accessibilityLabel="Close sidebar"
            >
              <Ionicons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Status & Fare Pill */}
          <View style={styles.fareStatusRow}>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusPillText}>{displayStatus}</Text>
            </View>
            <View style={styles.farePill}>
              <Text style={styles.farePillLabel}>Estimated Fare:</Text>
              <Text style={styles.farePillValue}>₹{displayFare}</Text>
            </View>
          </View>

          {/* Route Journey Card */}
          <View style={styles.routeCard}>
            <View style={styles.locationRow}>
              <View style={[styles.pinCircle, { backgroundColor: '#e6fdf4' }]}>
                <Ionicons name="radio-button-on" size={14} color="#10b981" />
              </View>
              <View style={styles.addressWrapper}>
                <Text style={styles.addressLabel}>PICKUP</Text>
                <Text style={styles.addressText} numberOfLines={2}>{displayPickup}</Text>
              </View>
            </View>
            
            <View style={styles.connectorContainer}>
              <View style={styles.connectorLine} />
            </View>

            <View style={styles.locationRow}>
              <View style={[styles.pinCircle, { backgroundColor: '#fdf2f8' }]}>
                <Ionicons name="location" size={14} color="#f72585" />
              </View>
              <View style={styles.addressWrapper}>
                <Text style={styles.addressLabel}>DESTINATION</Text>
                <Text style={styles.addressText} numberOfLines={2}>{displayDropoff}</Text>
              </View>
            </View>
          </View>

          {/* Options Menu */}
          <View style={styles.optionsContainer}>
            <Text style={styles.sectionTitle}>Trip Management</Text>
            {options.map((option) => (
              <TouchableOpacity 
                key={option.id} 
                style={styles.optionRow} 
                onPress={() => handleOptionPress(option.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${option.color}15` }]}>
                  <Ionicons name={option.icon as any} size={20} color={option.color} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, { color: option.color === '#ef4444' ? '#ef4444' : '#111827' }]}>
                    {option.title}
                  </Text>
                  <Text style={styles.optionSub}>{option.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Footer Branding */}
          <View style={styles.footer}>
            <View style={styles.footerBrandRow}>
              <Ionicons name="car-sport" size={16} color="#f72585" />
              <Text style={styles.footerText}>DriveMate Partner Support</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  sidebar: {
    width: '84%',
    height: '100%',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    paddingTop: 45,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f72585',
    letterSpacing: 1.2,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fareStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  farePill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farePillLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 4,
  },
  farePillValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  routeCard: {
    margin: 16,
    padding: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pinCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  addressWrapper: {
    marginLeft: 10,
    flex: 1,
  },
  addressLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#9ca3af',
    letterSpacing: 0.8,
  },
  addressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 1,
    lineHeight: 18,
  },
  connectorContainer: {
    paddingLeft: 11,
    height: 18,
    justifyContent: 'center',
  },
  connectorLine: {
    width: 2,
    height: 14,
    backgroundColor: '#d1d5db',
  },
  optionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionSub: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 1,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'center',
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },
});

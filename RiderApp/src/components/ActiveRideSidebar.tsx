import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  Modal, 
  TouchableWithoutFeedback 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type ActiveRideSidebarProps = {
  visible: boolean;
  onClose: () => void;
  customerName?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  onOptionSelect?: (option: string) => void;
};

export default function ActiveRideSidebar({ 
  visible, 
  onClose, 
  customerName = "Customer", 
  pickupLocation = "Pickup Location", 
  dropoffLocation = "Dropoff Location",
  onOptionSelect 
}: ActiveRideSidebarProps) {
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Safe way to check animation value
  const slideValue = (slideAnim as any)._value;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -width * 0.8,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleOptionPress = (action: string) => {
    if (onOptionSelect) {
      onOptionSelect(action);
    }
    onClose();
  };

  const options = [
    { id: 'navigate', title: 'Navigation', icon: 'navigate-outline', color: '#4CAF50' },
    { id: 'contact', title: 'Contact Customer', icon: 'call-outline', color: '#333' },
    { id: 'details', title: 'Fare & Ride Info', icon: 'information-circle-outline', color: '#333' },
    { id: 'support', title: 'Help / Support', icon: 'help-buoy-outline', color: '#333' },
    { id: 'cancel', title: 'Cancel Ride', icon: 'close-circle-outline', color: '#f72585' },
  ];

  if (!visible && slideValue <= -width * 0.8) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlayContainer}>
        {/* Backdrop for closing */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Sidebar Content */}
        <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Active Ride</Text>
              <Text style={styles.customerName}>{customerName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.rideDetailsContainer}>
            <View style={styles.locationRow}>
              <Ionicons name="radio-button-on" size={16} color="#4CAF50" />
              <Text style={styles.locationText} numberOfLines={1}>{pickupLocation}</Text>
            </View>
            <View style={styles.connector} />
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color="#f72585" />
              <Text style={styles.locationText} numberOfLines={1}>{dropoffLocation}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.optionsContainer}>
            <Text style={styles.sectionTitle}>Rider Options</Text>
            {options.map((option) => (
              <TouchableOpacity 
                key={option.id} 
                style={styles.optionRow} 
                onPress={() => handleOptionPress(option.id)}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name={option.icon as any} size={22} color={option.color} />
                </View>
                <Text style={[styles.optionText, { color: option.color }]}>{option.title}</Text>
                <Ionicons name="chevron-forward" size={18} color="#ccc" style={styles.chevron} />
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>DriveMate Provider</Text>
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sidebar: {
    width: '80%',
    height: '100%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    paddingTop: 50, // for safe area
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 14,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  closeBtn: {
    padding: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  rideDetailsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  connector: {
    width: 2,
    height: 15,
    backgroundColor: '#ddd',
    marginLeft: 7,
    marginVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    width: '100%',
  },
  optionsContainer: {
    flex: 1,
    paddingTop: 15,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    paddingHorizontal: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  chevron: {
    marginLeft: 'auto',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerText: {
    fontSize: 12,
    color: '#bbb',
    fontWeight: '500',
  }
});

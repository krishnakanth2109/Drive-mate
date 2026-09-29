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

type RideSidebarOptionsProps = {
  visible: boolean;
  onClose: () => void;
  onOptionSelect?: (option: string) => void;
};

export default function RideSidebarOptions({ visible, onClose, onOptionSelect }: RideSidebarOptionsProps) {
  const slideAnim = useRef(new Animated.Value(-width * 0.75)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Type assertion for animation values to access internal values for checking
  // Not strictly recommended but safe here for conditionally unmounting
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
          toValue: -width * 0.75,
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
    { id: 'contact', title: 'Contact Driver', icon: 'call-outline', color: '#333' },
    { id: 'share', title: 'Share Trip Status', icon: 'share-social-outline', color: '#333' },
    { id: 'edit', title: 'Change Destination', icon: 'location-outline', color: '#333' },
    { id: 'safety', title: 'Safety / SOS', icon: 'shield-checkmark-outline', color: '#4CAF50' },
    { id: 'cancel', title: 'Cancel Ride', icon: 'close-circle-outline', color: '#f72585' },
  ];

  if (!visible && slideValue <= -width * 0.75) return null;

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
            <Text style={styles.headerTitle}>Ride Options</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsContainer}>
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
            <Text style={styles.footerText}>DriveMate Secure</Text>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sidebar: {
    width: '75%',
    height: '100%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    paddingTop: 50, // for safe area
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  closeBtn: {
    padding: 4,
  },
  optionsContainer: {
    flex: 1,
    paddingTop: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
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
    color: '#999',
    fontWeight: '500',
  }
});

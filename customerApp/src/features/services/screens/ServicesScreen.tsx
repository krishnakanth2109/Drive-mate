import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Platform,
  Dimensions,
  Alert,
  Linking,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCustomer } from '../../../context/CustomerContext';

const { width } = Dimensions.get('window');

interface ServiceItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'rides' | 'delivery' | 'finance' | 'support';
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  badge?: string;
  route?: string;
  action?: () => void;
}

export default function ServicesScreen() {
  const navigation = useNavigation<any>();
  const { currentUser } = useCustomer();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'rides' | 'delivery' | 'finance' | 'support'>('all');

  const walletBalance = Math.max(0, Number(currentUser?.walletBalance) || 0);

  const categories = [
    { key: 'all', label: 'All Services', icon: 'grid-outline' },
    { key: 'rides', label: 'Rides', icon: 'car-sport-outline' },
    { key: 'delivery', label: 'Delivery', icon: 'cube-outline' },
    { key: 'finance', label: 'Wallet & Pay', icon: 'wallet-outline' },
    { key: 'support', label: 'Safety & Help', icon: 'shield-checkmark-outline' },
  ];

  const services: ServiceItem[] = [
    // --- Rides & Mobility ---
    {
      id: 'city-ride',
      title: 'City Rides',
      subtitle: 'Bike, Scooty, Auto & Cabs nearby',
      category: 'rides',
      icon: 'car-sport',
      color: '#f72585',
      badge: 'Popular',
      route: 'LocationSearch',
    },
    {
      id: 'power-pass',
      title: 'Power Pass',
      subtitle: 'Flat 20% off on daily commutes',
      category: 'rides',
      icon: 'flash',
      color: '#7209b7',
      badge: 'Save 20%',
      action: () => navigation.navigate('Profile'),
    },
    {
      id: 'airport-express',
      title: 'Airport Express',
      subtitle: 'Pre-scheduled rides with 0 surge',
      category: 'rides',
      icon: 'airplane',
      color: '#4361ee',
      badge: 'On-time',
      route: 'LocationSearch',
    },
    {
      id: 'rental-rides',
      title: 'Hourly Rental',
      subtitle: 'Hire cab & driver for 2, 4, 8 hours',
      category: 'rides',
      icon: 'time',
      color: '#3a0ca3',
      route: 'LocationSearch',
    },
    {
      id: 'intercity',
      title: 'Outstation',
      subtitle: 'Comfortable one-way & round trips',
      category: 'rides',
      icon: 'navigate-circle',
      color: '#4cc9f0',
      route: 'LocationSearch',
    },

    // --- Delivery & Logistics ---
    {
      id: 'parcel-send',
      title: 'DriveMate Parcel',
      subtitle: 'Send documents & boxes under 45 mins',
      category: 'delivery',
      icon: 'cube',
      color: '#06d6a0',
      badge: 'Fast',
      route: 'LocationSearch',
    },
    {
      id: 'store-pickup',
      title: 'Errands & Pickup',
      subtitle: 'Pickup keys, medicines, or lunchbox',
      category: 'delivery',
      icon: 'bag-handle',
      color: '#118ab2',
      route: 'LocationSearch',
    },

    // --- Finance & Wallet (replaces sidebar) ---
    {
      id: 'wallet',
      title: 'My Wallet',
      subtitle: `Balance: ₹${walletBalance.toFixed(0)} • Top-up instantly`,
      category: 'finance',
      icon: 'wallet',
      color: '#f72585',
      badge: `₹${walletBalance.toFixed(0)}`,
      route: 'Wallet',
    },
    {
      id: 'payments',
      title: 'Payment Methods',
      subtitle: 'Manage UPI, Debit/Credit Cards & Cash',
      category: 'finance',
      icon: 'card',
      color: '#7209b7',
      route: 'Payment',
    },
    {
      id: 'refer-earn',
      title: 'Refer & Earn',
      subtitle: 'Share code & earn ₹100 ride cashback',
      category: 'finance',
      icon: 'gift',
      color: '#ffd166',
      badge: '₹100',
      action: () => {
        Alert.alert(
          'Refer & Earn ₹100',
          `Share your referral code: DRIVEMATE${currentUser?.name?.slice(0, 3).toUpperCase() || 'PASS'}\n\nBoth you and your friend get ₹100 wallet credits after their first completed ride!`,
          [{ text: 'Copy Code', onPress: () => {} }, { text: 'Done' }]
        );
      },
    },

    // --- Support & Safety (replaces sidebar) ---
    {
      id: 'safety-center',
      title: 'Safety Center',
      subtitle: 'Live trip sharing, verified drivers & SOS',
      category: 'support',
      icon: 'shield-checkmark',
      color: '#06d6a0',
      badge: '24/7 Live',
      action: () => {
        Alert.alert(
          'Emergency SOS & Safety Center',
          'DriveMate 24/7 Safety Command Center is active on all your rides.\n\n• Live GPS trip sharing with family\n• 24x7 Dedicated Safety Helpline\n• Police emergency integration',
          [
            { text: 'Call Safety Desk (1800-DRIVEMATE)', onPress: () => Linking.openURL('tel:1800374836283') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      },
    },
    {
      id: 'help-support',
      title: 'Help & FAQs',
      subtitle: '24/7 Support tickets, disputes & live chat',
      category: 'support',
      icon: 'help-buoy',
      color: '#4361ee',
      route: 'Help',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Trip alerts, cashback & promotional offers',
      category: 'support',
      icon: 'notifications',
      color: '#f72585',
      route: 'Notifications',
    },
    {
      id: 'settings',
      title: 'App Settings',
      subtitle: 'Preferences, security & saved locations',
      category: 'support',
      icon: 'settings',
      color: '#555555',
      route: 'Settings',
    },
  ];

  const filteredServices = useMemo(() => {
    return services.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [services, selectedCategory, searchQuery]);

  const handleServicePress = (service: ServiceItem) => {
    if (service.action) {
      service.action();
    } else if (service.route) {
      navigation.navigate(service.route);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>All Services</Text>
          <Text style={styles.headerSubtitle}>Explore rides, deliveries, payments & care</Text>
        </View>
        <TouchableOpacity
          style={styles.walletPill}
          onPress={() => navigation.navigate('Wallet')}
          activeOpacity={0.8}
        >
          <Ionicons name="wallet-outline" size={16} color="#f72585" />
          <Text style={styles.walletPillText}>₹{walletBalance.toFixed(0)}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#888888" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search all services, passes, parcel..."
            placeholderTextColor="#999999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#999999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Featured Power Pass Banner */}
        <TouchableOpacity
          style={styles.promoBanner}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={styles.promoContent}>
            <View style={styles.promoTag}>
              <Ionicons name="flash" size={12} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.promoTagText}>POWER PASS</Text>
            </View>
            <Text style={styles.promoTitle}>Save Flat 20% on Every Commute</Text>
            <Text style={styles.promoDesc}>
              Daily priority matching and surge-free rides to and from IT Parks.
            </Text>
            <View style={styles.promoButton}>
              <Text style={styles.promoButtonText}>Explore Passes</Text>
              <Ionicons name="arrow-forward" size={14} color="#ffffff" />
            </View>
          </View>
          <View style={styles.promoDecor}>
            <Ionicons name="shield-checkmark" size={70} color="rgba(255, 255, 255, 0.15)" />
          </View>
        </TouchableOpacity>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.key as any)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={16}
                  color={isSelected ? '#ffffff' : '#495057'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Services Grid / Cards */}
        <View style={styles.gridContainer}>
          {filteredServices.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() => handleServicePress(service)}
              activeOpacity={0.7}
            >
              <View style={styles.serviceHeader}>
                <View style={[styles.iconCircle, { backgroundColor: `${service.color}15` }]}>
                  <Ionicons name={service.icon} size={24} color={service.color} />
                </View>
                {service.badge && (
                  <View style={[styles.badgePill, { backgroundColor: service.color }]}>
                    <Text style={styles.badgeText}>{service.badge}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceSubtitle} numberOfLines={2}>
                {service.subtitle}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={[styles.exploreText, { color: service.color }]}>Open</Text>
                <Ionicons name="chevron-forward" size={14} color={service.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {filteredServices.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#adb5bd" />
            <Text style={styles.emptyTitle}>No matching services found</Text>
            <Text style={styles.emptyDesc}>Try searching with different keywords like 'wallet' or 'cab'</Text>
          </View>
        )}

        {/* Quick Help & SOS Strip */}
        <View style={styles.safetyFooter}>
          <View style={styles.safetyIconContainer}>
            <Ionicons name="shield-checkmark" size={24} color="#06d6a0" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.safetyTitle}>DriveMate Safety Guarantee</Text>
            <Text style={styles.safetyText}>
              24/7 Dedicated passenger support, SOS tracking & live ride verification.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.sosButton}
            onPress={() => navigation.navigate('Help')}
            activeOpacity={0.8}
          >
            <Text style={styles.sosButtonText}>Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 2,
  },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff0f6',
    borderWidth: 1,
    borderColor: '#ffdeeb',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  walletPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f72585',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#212529',
    fontWeight: '500',
  },
  promoBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#7209b7',
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#7209b7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  promoContent: {
    zIndex: 2,
    maxWidth: '80%',
  },
  promoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  promoTagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  promoTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  promoDesc: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  promoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f72585',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  promoButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  promoDecor: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    zIndex: 1,
  },
  categoryScroll: {
    marginTop: 16,
  },
  categoryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categoryChipActive: {
    backgroundColor: '#1a1a2e',
    borderColor: '#1a1a2e',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495057',
  },
  categoryChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginTop: 16,
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: (width - 40) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'space-between',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgePill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  serviceSubtitle: {
    fontSize: 12,
    color: '#6c757d',
    lineHeight: 16,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exploreText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#343a40',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#868e96',
    marginTop: 4,
    textAlign: 'center',
  },
  safetyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6fcf5',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c3fae8',
    gap: 12,
  },
  safetyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safetyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#087f5b',
  },
  safetyText: {
    fontSize: 11,
    color: '#2b8a3e',
    marginTop: 2,
    lineHeight: 15,
  },
  sosButton: {
    backgroundColor: '#0ca678',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sosButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});

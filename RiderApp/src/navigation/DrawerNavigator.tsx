import React, { useEffect, useState, useCallback } from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import MainTabNavigator from './MainTabNavigator';
import EarningsScreen from '../screens/Earnings/Earnings';
import HistoryScreen from '../screens/Orders/OrderHistory';
import DocumentsScreen from '../screens/Account/Documents';
import VehicleScreen from '../screens/Account/Vehicle';
import SettingsScreen from '../screens/Account/Settings';
import SupportScreen from '../screens/Support/HelpCenter';
import WalletScreen from '../screens/Account/WalletScreen';
import PerformanceScreen from '../screens/Account/PerformanceScreen';
import GoToAreaScreen from '../screens/MainDashboard/GoToAreaScreen';
import NotificationsScreen from '../screens/Notifications/Notifications';
import { useRider } from '../context/RiderContext';
import { riderService } from '../services/riderService';
import { RiderProfile, VehicleInfo } from '../services/types';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: any) {
  const { logout, isOnline, toggleOnline } = useRider();
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDriverData = useCallback(async () => {
    try {
      // 1. Read immediate cached rider object for instantaneous UI render
      const cached = await AsyncStorage.getItem('rider') || await AsyncStorage.getItem('user');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setProfile(parsed);
        } catch (_) {}
      }

      // 2. Fetch fresh live profile & vehicle from backend
      const [liveProfile, liveVehicle] = await Promise.allSettled([
        riderService.getProfile(),
        riderService.getVehicle(),
      ]);

      if (liveProfile.status === 'fulfilled' && liveProfile.value) {
        setProfile(liveProfile.value);
        await AsyncStorage.setItem('rider', JSON.stringify(liveProfile.value));
      }
      if (liveVehicle.status === 'fulfilled' && liveVehicle.value) {
        setVehicle(liveVehicle.value);
      }
    } catch (e) {
      console.log('Drawer profile sync:', e);
    }
  }, []);

  useEffect(() => {
    loadDriverData();
  }, [loadDriverData]);

  // Compute initials safely
  const driverName = profile?.name?.trim() || 'Partner Driver';
  const nameInitials = driverName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join('') || 'DR';

  const driverPhone = profile?.phone || profile?.email || 'Verified Partner';
  const vehicleText = vehicle?.model 
    ? `${vehicle.model} • ${vehicle.plate || ''}`.trim()
    : (profile?.vehicleType ? `${profile.vehicleType.toUpperCase()} PARTNER` : 'DRIVE MATE PARTNER');

  const ratingDisplay = profile?.rating ? Number(profile.rating).toFixed(1) : '4.9';
  const todayEarningsDisplay = profile?.todayEarnings !== undefined ? `₹${profile.todayEarnings}` : '₹850';
  const totalRidesDisplay = profile?.totalRides ?? 24;

  const handleLogoutPress = () => {
    Alert.alert(
      'Logout Session',
      'Are you sure you want to log out of your driver account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive', 
          onPress: () => logout(props.navigation) 
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Header with Navigation Back Button */}
      <View style={styles.drawerTopBar}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => props.navigation.closeDrawer()}
          activeOpacity={0.7}
          accessibilityLabel="Go back and close sidebar"
        >
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        
        <Text style={styles.drawerTopTitle}>Driver Profile & Menu</Text>

        <TouchableOpacity 
          style={styles.closeIconButton}
          onPress={() => props.navigation.closeDrawer()}
          activeOpacity={0.7}
          accessibilityLabel="Close sidebar"
        >
          <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      <DrawerContentScrollView 
        {...props} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Dynamic Driver Profile Hero Card */}
        <View style={styles.profileHeroCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarInitials}>{nameInitials}</Text>
              <View style={[styles.avatarStatusBadge, isOnline ? styles.badgeOnline : styles.badgeOffline]}>
                <Ionicons name={isOnline ? "checkmark" : "power"} size={10} color="#fff" />
              </View>
            </View>

            <View style={styles.profileTextWrapper}>
              <View style={styles.nameRow}>
                <Text style={styles.driverName} numberOfLines={1}>{driverName}</Text>
                <Ionicons name="checkmark-circle" size={16} color="#00f2fe" style={{ marginLeft: 4 }} />
              </View>
              <Text style={styles.driverPhone} numberOfLines={1}>{driverPhone}</Text>
              <Text style={styles.vehicleTag} numberOfLines={1}>{vehicleText}</Text>
            </View>
          </View>

          {/* Duty Status & One-Tap Switch */}
          <View style={styles.dutySwitchContainer}>
            <View style={[styles.dutyPill, isOnline ? styles.dutyPillOnline : styles.dutyPillOffline]}>
              <View style={[styles.dutyDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
              <Text style={[styles.dutyStatusText, isOnline ? styles.dutyTextOnline : styles.dutyTextOffline]}>
                {isOnline ? 'DUTY ONLINE' : 'DUTY OFFLINE'}
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.dutyToggleBtn, isOnline ? styles.btnGoOffline : styles.btnGoOnline]}
              onPress={toggleOnline}
              activeOpacity={0.8}
            >
              <Ionicons name={isOnline ? "pause" : "flash"} size={13} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.dutyToggleBtnText}>{isOnline ? 'Go Offline' : 'Go Online'}</Text>
            </TouchableOpacity>
          </View>

          {/* Driver Metrics Summary Bar */}
          <View style={styles.metricsBar}>
            <View style={styles.metricItem}>
              <View style={styles.metricIconValRow}>
                <Ionicons name="star" size={13} color="#FFD700" />
                <Text style={styles.metricVal}>{ratingDisplay}</Text>
              </View>
              <Text style={styles.metricSub}>Rating</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: '#00f2fe' }]}>{todayEarningsDisplay}</Text>
              <Text style={styles.metricSub}>Today</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{totalRidesDisplay}</Text>
              <Text style={styles.metricSub}>Trips</Text>
            </View>
          </View>
        </View>

        {/* 3. Navigation Items */}
        <View style={styles.drawerItemsWrapper}>
          <Text style={styles.navSectionTitle}>NAVIGATION</Text>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      {/* 4. Footer Section */}
      <View style={styles.footerSection}>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogoutPress}
          activeOpacity={0.7}
        >
          <View style={styles.logoutIconCircle}>
            <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          </View>
          <Text style={styles.logoutText}>Logout Session</Text>
          <Ionicons name="chevron-forward" size={16} color="#ef4444" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <View style={styles.appVersionRow}>
          <Ionicons name="shield-checkmark" size={13} color="#10b981" />
          <Text style={styles.appVersionText}>DriveMate Partner • v2.4.0 (Secure)</Text>
        </View>
      </View>
    </View>
  );
}

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: '#f72585',
        drawerActiveTintColor: '#ffffff',
        drawerInactiveTintColor: '#475569',
        drawerLabelStyle: { fontSize: 14, fontWeight: '600', marginLeft: -6 },
        drawerItemStyle: {
          borderRadius: 12,
          marginHorizontal: 12,
          marginVertical: 3,
          paddingHorizontal: 8,
        },
        drawerStyle: {
          backgroundColor: '#ffffff',
          width: '84%',
        },
      }}
    >
      <Drawer.Screen 
        name="DashboardRoot" 
        component={MainTabNavigator} 
        options={{
          title: 'Dashboard & Rides',
          drawerIcon: ({ color }) => <Ionicons name="speedometer-outline" size={21} color={color} />
        }} 
      />

      <Drawer.Screen 
        name="GoToArea" 
        component={GoToAreaScreen} 
        options={{
          title: 'Go To Area (Corridor)',
          drawerIcon: ({ color }) => <Ionicons name="navigate-circle-outline" size={21} color={color} />
        }} 
      />

      <Drawer.Screen 
        name="Performance" 
        component={PerformanceScreen} 
        options={{
          title: 'Performance & Quality',
          drawerIcon: ({ color }) => <Ionicons name="trophy-outline" size={21} color={color} />
        }} 
      />

      <Drawer.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{
          title: 'Notifications',
          drawerIcon: ({ color }) => <Ionicons name="notifications-outline" size={21} color={color} />
        }} 
      />
      
      <Drawer.Screen 
        name="MyEarnings" 
        component={EarningsScreen} 
        options={{
          title: 'My Earnings',
          drawerIcon: ({ color }) => <Ionicons name="cash-outline" size={21} color={color} />
        }} 
      />

      <Drawer.Screen 
        name="MyWallet" 
        component={WalletScreen} 
        options={{
          title: 'My Wallet',
          drawerIcon: ({ color }) => <Ionicons name="wallet-outline" size={21} color={color} />
        }} 
      />

      <Drawer.Screen 
        name="RideHistory" 
        component={HistoryScreen} 
        options={{
          title: 'Trip History',
          drawerIcon: ({ color }) => <Ionicons name="time-outline" size={21} color={color} />
        }} 
      />

      <Drawer.Screen 
        name="MyVehicle" 
        component={VehicleScreen} 
        options={{
          title: 'Vehicle Details',
          drawerIcon: ({ color }) => <Ionicons name="car-sport-outline" size={21} color={color} />
        }} 
      />

      <Drawer.Screen 
        name="MyDocuments" 
        component={DocumentsScreen} 
        options={{
          title: 'Partner Documents',
          drawerIcon: ({ color }) => <Ionicons name="document-text-outline" size={21} color={color} />
        }} 
      />

      <Drawer.Screen 
        name="AppSettings" 
        component={SettingsScreen} 
        options={{
          title: 'App Settings',
          drawerIcon: ({ color }) => <Ionicons name="settings-outline" size={21} color={color} />
        }} 
      />
      
      <Drawer.Screen 
        name="HelpSupport" 
        component={SupportScreen} 
        options={{
          title: 'Help & FAQs',
          drawerIcon: ({ color }) => <Ionicons name="help-buoy-outline" size={21} color={color} />
        }} 
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  drawerTopBar: {
    backgroundColor: '#1E1E2C',
    paddingTop: 45,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerTopTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  closeIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingTop: 0,
    backgroundColor: '#f8fafc',
  },
  profileHeroCard: {
    backgroundColor: '#1E1E2C',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2a2a3e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#f72585',
    position: 'relative',
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  avatarStatusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1E1E2C',
  },
  badgeOnline: {
    backgroundColor: '#10b981',
  },
  badgeOffline: {
    backgroundColor: '#64748b',
  },
  profileTextWrapper: {
    marginLeft: 14,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  driverPhone: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  vehicleTag: {
    color: '#f72585',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 0.5,
  },
  dutySwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    marginTop: 14,
  },
  dutyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dutyPillOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  dutyPillOffline: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
  },
  dutyDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  dotOnline: {
    backgroundColor: '#10b981',
  },
  dotOffline: {
    backgroundColor: '#94a3b8',
  },
  dutyStatusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  dutyTextOnline: {
    color: '#10b981',
  },
  dutyTextOffline: {
    color: '#94a3b8',
  },
  dutyToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  btnGoOffline: {
    backgroundColor: '#ef4444',
  },
  btnGoOnline: {
    backgroundColor: '#10b981',
  },
  dutyToggleBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 14,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricIconValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metricVal: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  metricSub: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  metricDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  drawerItemsWrapper: {
    backgroundColor: '#ffffff',
    paddingTop: 12,
    paddingBottom: 20,
  },
  navSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.2,
    marginLeft: 20,
    marginBottom: 6,
    marginTop: 4,
  },
  footerSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
  },
  logoutIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
  appVersionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  appVersionText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
});

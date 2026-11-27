import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useCustomer } from '../../../context/CustomerContext';
import { profileService } from '../services/profileService';

export default function MyAccountScreen({ navigation }: any) {
  const { logout, currentUser } = useCustomer();
  const [userData, setUserData] = useState<any>(currentUser);
  const [balances, setBalances] = useState<{ walletBalance: number; coinBalance: number; powerPass: any } | null>(null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const [meRes, balRes, rewardsRes] = await Promise.allSettled([
        profileService.getMe(),
        profileService.getBalances(),
        profileService.getRewards(),
      ]);

      if (meRes.status === 'fulfilled' && meRes.value) {
        setUserData(meRes.value);
        await AsyncStorage.setItem('user', JSON.stringify(meRes.value));
      } else {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) setUserData(JSON.parse(userStr));
      }

      if (balRes.status === 'fulfilled' && balRes.value) {
        setBalances(balRes.value);
      }
      if (rewardsRes.status === 'fulfilled' && Array.isArray(rewardsRes.value)) {
        setRewards(rewardsRes.value);
      }
    } catch (err) {
      console.error('Failed to load profile data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your DriveMate account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => logout(navigation) },
      ]
    );
  };

  const menuItems = [
    { id: '1', title: 'My Wallet', icon: 'wallet-outline', screen: 'Wallet' },
    { id: '2', title: 'My Rides', icon: 'time-outline', screen: 'MyRides' },
    { id: '3', title: 'Payment Methods', icon: 'card-outline', screen: 'Payment' },
    { id: '4', title: 'Notifications', icon: 'notifications-outline', screen: 'Notifications' },
    { id: '5', title: 'Refer and Earn', icon: 'gift-outline', screen: 'ReferAndEarn' },
    { id: '6', title: 'My Rewards', icon: 'medal-outline', screen: 'MyRewards' },
    { id: '7', title: 'Settings', icon: 'settings-outline', screen: 'Settings' },
    { id: '8', title: 'Help & Support', icon: 'help-circle-outline', screen: 'Help' },
  ];

  const displayName = userData?.name || currentUser?.name || 'DriveMate Passenger';
  const displayPhone = userData?.phone || currentUser?.phone || userData?.email || 'No contact on file';
  const displayInitial = (displayName || 'P')[0].toUpperCase();
  const coinBalance = balances?.coinBalance ?? userData?.coinBalance ?? 0;

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
      <ScrollView
        style={[styles.container, isDark && styles.containerDark]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadProfile();
            }}
            colors={['#f72585']}
          />
        }
      >
        <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>Profile</Text>

        <TouchableOpacity
          style={[styles.profileCard, isDark && styles.profileCardDark]}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <View style={styles.profileLeft}>
            <View style={styles.avatarContainer}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#f72585' }}>{displayInitial}</Text>
            </View>
            <View style={styles.profileInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.profileName, isDark && styles.textDark]}>{displayName}</Text>
                {userData?.isEmailVerified ? <Ionicons name="checkmark-circle" size={16} color="#06d6a0" /> : null}
              </View>
              <Text style={styles.profilePhone}>{loading ? 'Loading profile...' : displayPhone}</Text>
              <Text style={{ fontSize: 11, color: '#f72585', fontWeight: '700', marginTop: 2 }}>
                {balances?.powerPass?.isActive ? `${balances.powerPass.planName} • ` : ''}
                Wallet: ₹{Number(balances?.walletBalance ?? userData?.walletBalance ?? 0).toFixed(0)}
              </Text>
            </View>
          </View>
          {loading ? (
            <ActivityIndicator size="small" color="#f72585" />
          ) : (
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#fff' : '#333'} />
          )}
        </TouchableOpacity>

        <View style={[styles.themeCard, isDark && styles.themeCardDark]}>
          <Text style={[styles.themeTitle, isDark && styles.textDark]}>App Theme</Text>
          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[styles.themeBtn, !isDark && styles.themeBtnActive]}
              onPress={() => setIsDark(false)}
            >
              <Ionicons name="sunny-outline" size={20} color={!isDark ? '#fff' : '#666'} />
              <Text style={[styles.themeBtnText, !isDark && styles.themeBtnTextActive]}>Light</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.themeBtn, isDark && styles.themeBtnActiveDark]}
              onPress={() => setIsDark(true)}
            >
              <Ionicons name="moon-outline" size={20} color={isDark ? '#fff' : '#666'} />
              <Text style={[styles.themeBtnText, isDark && styles.themeBtnTextActive]}>Dark</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                isDark && styles.menuItemDark,
                index === menuItems.length - 1 ? styles.menuItemLast : null,
              ]}
              onPress={() => {
                if (item.screen === 'MyRides') {
                  navigation.navigate('My Rides');
                } else if (item.screen === 'ReferAndEarn') {
                  const refId = userData?.id ? String(userData.id).slice(-6).toUpperCase() : '';
                  Alert.alert(
                    'Refer & Earn',
                    refId
                      ? `Share your personal account code DM-${refId} with friends when they join DriveMate.`
                      : 'Sign in to view your referral code.'
                  );
                } else if (item.screen === 'MyRewards') {
                  const activeTitles = rewards.map((r) => `• ${r.title}`).join('\n');
                  Alert.alert(
                    'DriveMate Rewards',
                    `Coin Balance: ${coinBalance} coins\nActive Rewards: ${rewards.length}${activeTitles ? `\n\n${activeTitles}` : ''}`
                  );
                } else {
                  navigation.navigate(item.screen);
                }
              }}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon as any} size={22} color="#3b5998" />
                </View>
                <Text style={[styles.menuItemText, isDark && styles.textDark]}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#666' : '#999'} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.logoutBtn, isDark && styles.logoutBtnDark]} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  safeAreaDark: {
    backgroundColor: '#111',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#111',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 20,
  },
  headerTitleDark: {
    color: '#fff',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 25,
  },
  profileCardDark: {
    backgroundColor: '#1c1c1e',
    borderColor: '#333',
  },
  textDark: {
    color: '#fff',
  },
  themeCard: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 25,
  },
  themeCardDark: {
    backgroundColor: '#1c1c1e',
    borderColor: '#333',
  },
  themeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  themeOptions: {
    flexDirection: 'row',
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    padding: 4,
  },
  themeOptionsDark: {
    backgroundColor: '#000',
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
  },
  themeBtnActive: {
    backgroundColor: '#3b5998',
  },
  themeBtnActiveDark: {
    backgroundColor: '#2c2c2e',
  },
  themeBtnText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  themeBtnTextActive: {
    color: '#fff',
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#3b5998',
  },
  profileInfo: {
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
    color: '#666',
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  menuItemDark: {
    borderBottomColor: '#333',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 30,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutBtnDark: {
    backgroundColor: '#1c1c1e',
    borderColor: '#333',
  },
  logoutText: {
    color: '#f72585',
    fontWeight: '700',
    fontSize: 16,
  },
});

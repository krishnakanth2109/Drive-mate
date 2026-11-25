import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'ride' | 'promo' | 'security';
  icon: any;
  color: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Ride Completed',
    message: 'Your trip with Suresh V. has ended. Total fare: ₹75. Thank you for riding with DriveMate!',
    time: '2 hours ago',
    read: false,
    type: 'ride',
    icon: 'checkmark-circle',
    color: '#06d6a0',
  },
  {
    id: '2',
    title: '50% Off On Your Next 3 Rides!',
    message: 'Use code DRIVEMATE50 to get up to ₹50 off on auto and car bookings this weekend.',
    time: 'Yesterday',
    read: false,
    type: 'promo',
    icon: 'pricetag',
    color: '#f72585',
  },
  {
    id: '3',
    title: 'Security Alert',
    message: 'New login detected from Android device in Hyderabad. If this was not you, please secure your account.',
    time: '3 days ago',
    read: true,
    type: 'security',
    icon: 'shield-checkmark',
    color: '#4361ee',
  },
  {
    id: '4',
    title: 'Wallet Recharged',
    message: '₹500.00 successfully credited to your DriveMate Wallet via UPI.',
    time: '5 days ago',
    read: true,
    type: 'promo',
    icon: 'wallet',
    color: '#7209b7',
  },
];

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <View style={[styles.notificationCard, !item.read && styles.unreadCard]}>
      <View style={[styles.iconBox, { backgroundColor: `${item.color}15` }]}>
        <Ionicons name={item.icon} size={22} color={item.color} />
      </View>
      <View style={styles.contentBox}>
        <View style={styles.cardHeader}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.timeText}>{item.time}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.markReadText}>Read All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySub}>You are all caught up!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'android' ? 36 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  markReadText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f72585',
  },
  listContent: {
    padding: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: '#fffbfc',
    borderColor: '#ffe6f0',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contentBox: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f72585',
  },
  notificationMessage: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 11,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 13,
    color: '#888',
    marginTop: 6,
  },
});

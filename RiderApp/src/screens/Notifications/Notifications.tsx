import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { riderService } from '../../services/riderService';
import { RiderNotification } from '../../services/types';
import { useToast } from '../../context/ToastContext';
import { extractApiErrorMessage, socket } from '../../services/api';

type FilterTab = 'all' | 'ride' | 'payout' | 'system';

export default function NotificationsScreen({ navigation }: any) {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<RiderNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const fetchNotifs = useCallback(async () => {
    try {
      setError(null);
      const data = await riderService.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(extractApiErrorMessage(err, 'Unable to load notifications.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
    const handleIncoming = () => fetchNotifs();
    socket.on('notification', handleIncoming);
    socket.on('incentive_broadcast', handleIncoming);
    return () => {
      socket.off('notification', handleIncoming);
      socket.off('incentive_broadcast', handleIncoming);
    };
  }, [fetchNotifs]);

  const handleMarkAllRead = async () => {
    try {
      await riderService.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast({
        title: 'All Caught Up',
        message: 'All notifications marked as read.',
        type: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Action Failed',
        message: 'Could not mark notifications as read.',
        type: 'error',
      });
    }
  };

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications;
    if (activeTab === 'ride') return notifications.filter((n) => n.type === 'ride');
    if (activeTab === 'payout') return notifications.filter((n) => n.type === 'payout' || n.type === 'bonus');
    if (activeTab === 'system') return notifications.filter((n) => n.type === 'system' || n.type === 'claim');
    return notifications;
  }, [notifications, activeTab]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'ride':
        return { name: 'car-sport' as const, color: '#3b82f6', bg: '#eff6ff' };
      case 'bonus':
        return { name: 'gift' as const, color: '#f72585', bg: '#fdf2f8' };
      case 'payout':
        return { name: 'cash' as const, color: '#10b981', bg: '#ecfdf5' };
      case 'claim':
        return { name: 'help-circle' as const, color: '#f59e0b', bg: '#fffbeb' };
      default:
        return { name: 'notifications' as const, color: '#8b5cf6', bg: '#f5f3ff' };
    }
  };

  const handleNotificationPress = (item: RiderNotification) => {
    // Mark as read locally
    setNotifications((prev) =>
      prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
    );

    // Deep link appropriately
    if (item.type === 'payout' || item.type === 'bonus') {
      navigation?.navigate('Wallet');
    } else if (item.type === 'ride') {
      navigation?.navigate('RideHistory');
    } else if (item.type === 'claim') {
      navigation?.navigate('Support');
    }
  };

  const renderItem = ({ item }: { item: RiderNotification }) => {
    const icon = getIcon(item.type);
    const timeFormatted = item.createdAt
      ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Just now';

    return (
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconBox, { backgroundColor: icon.bg }]}>
          <Ionicons name={icon.name} size={22} color={icon.color} />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.title, !item.isRead && styles.unreadTitle]}>{item.title}</Text>
            <Text style={styles.time}>{timeFormatted}</Text>
          </View>
          <Text style={styles.body}>{item.body}</Text>
        </View>

        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>{unreadCount} New</Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7}>
          <Text style={styles.markReadText}>Mark read</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        {(
          [
            { key: 'all', label: 'All' },
            { key: 'ride', label: 'Trips' },
            { key: 'payout', label: 'Earnings' },
            { key: 'system', label: 'Alerts' },
          ] as const
        ).map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, isSelected && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#f72585" style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color="#ef4444" />
          <Text style={styles.emptyTitle}>Connection Error</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity
            onPress={() => {
              setLoading(true);
              fetchNotifs();
            }}
            style={{ marginTop: 14, backgroundColor: '#f72585', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item._id || String(Math.random())}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchNotifs();
              }}
              colors={['#f72585']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-off-outline" size={44} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptyText}>
                {activeTab === 'all'
                  ? "You are all caught up! New ride requests and wallet updates will appear here."
                  : `No ${activeTab} notifications right now.`}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  badgePill: {
    backgroundColor: '#f72585',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  markReadText: { fontSize: 13, color: '#f72585', fontWeight: '700' },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  tabButtonActive: {
    backgroundColor: '#1E1E2C',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  unreadCard: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#f72585',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  cardContent: { flex: 1 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 14, fontWeight: '600', color: '#111827' },
  unreadTitle: { fontWeight: '800', color: '#111827' },
  time: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  body: { fontSize: 12, color: '#64748b', lineHeight: 17 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f72585',
    alignSelf: 'center',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});

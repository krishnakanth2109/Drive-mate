import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { notificationService, NotificationItem as ApiNotificationItem } from '../services/notificationService';
import { extractApiErrorMessage, socket } from '../../../services/api';

const getNotificationMeta = (type: string) => {
  switch (type) {
    case 'ride':
      return { icon: 'checkmark-circle', color: '#06d6a0' };
    case 'promo':
    case 'bonus':
      return { icon: 'pricetag', color: '#f72585' };
    case 'payout':
      return { icon: 'wallet', color: '#7209b7' };
    case 'claim':
      return { icon: 'shield-checkmark', color: '#4361ee' };
    default:
      return { icon: 'notifications', color: '#3b82f6' };
  }
};

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<ApiNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);
      const list = await notificationService.getNotifications();
      setNotifications(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(extractApiErrorMessage(err, 'Unable to load notifications.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const handleIncoming = () => fetchNotifications();
    socket.on('notification', handleIncoming);
    socket.on('ride_status_update', handleIncoming);
    return () => {
      socket.off('notification', handleIncoming);
      socket.off('ride_status_update', handleIncoming);
    };
  }, [fetchNotifications]);

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await notificationService.markAllRead();
    } catch (err) {
      fetchNotifications();
    }
  };

  const renderItem = ({ item }: { item: ApiNotificationItem }) => {
    const meta = getNotificationMeta(item.type);
    const timeText = item.createdAt
      ? new Date(item.createdAt).toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    return (
      <View style={[styles.notificationCard, !item.isRead && styles.unreadCard]}>
        <View style={[styles.iconBox, { backgroundColor: `${meta.color}15` }]}>
          <Ionicons name={meta.icon as any} size={22} color={meta.color} />
        </View>
        <View style={styles.contentBox}>
          <View style={styles.cardHeader}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationMessage}>{item.body}</Text>
          {timeText ? <Text style={styles.timeText}>{timeText}</Text> : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead} disabled={notifications.length === 0}>
          <Text style={[styles.markReadText, notifications.length === 0 && { opacity: 0.4 }]}>Read All</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#f72585" />
          <Text style={styles.emptySub}>Loading notifications...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cloud-offline-outline" size={54} color="#ef4444" />
          <Text style={styles.emptyTitle}>Connection Error</Text>
          <Text style={styles.emptySub}>{error}</Text>
          <TouchableOpacity
            style={{ marginTop: 14, backgroundColor: '#f72585', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}
            onPress={() => {
              setLoading(true);
              fetchNotifications();
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id || item.id || String(item.createdAt)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchNotifications();
              }}
              colors={['#f72585']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptySub}>You are all caught up!</Text>
            </View>
          }
        />
      )}
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

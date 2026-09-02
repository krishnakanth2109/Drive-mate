import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen() {
  const notifications = [
    { id: '1', title: '50% off on your next ride!', body: 'Use code DRIVE50 to get a discount on your next auto booking.', time: '2 hours ago', read: false },
    { id: '2', title: 'Ride Completed', body: 'Your ride to Hitech City was completed successfully. Hope you had a great trip!', time: 'Yesterday', read: true },
    { id: '3', title: 'Welcome to DriveMate!', body: 'Start booking affordable rides today.', time: '3 days ago', read: true },
  ];

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={[styles.notificationCard, !item.read && styles.unreadCard]}>
      <View style={styles.iconContainer}>
        <Ionicons name={item.read ? 'notifications-outline' : 'notifications'} size={24} color={item.read ? '#999' : '#f72585'} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !item.read && styles.unreadText]}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList 
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  unreadCard: {
    backgroundColor: '#fff',
    borderColor: '#ffe5f1',
    borderWidth: 1,
  },
  iconContainer: {
    marginRight: 16,
    marginTop: 2,
  },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  unreadText: { fontWeight: '800', color: '#000' },
  body: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 8 },
  time: { fontSize: 12, color: '#aaa' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#f72585', marginTop: 6 }
});

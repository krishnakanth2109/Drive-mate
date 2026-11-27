import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRider } from '../../context/RiderContext';

export default function ContactCustomerScreen({ navigation, route }: any) {
  const { activeRide } = useRider();
  const customerName = route?.params?.customerName || activeRide?.customer?.name || 'Passenger';
  const customerPhone = route?.params?.customerPhone || activeRide?.customer?.phone || '';

  const handleCall = () => {
    if (!customerPhone) {
      Alert.alert('Unavailable', 'Customer phone number is not available for this ride.');
      return;
    }
    Linking.openURL(`tel:${customerPhone}`);
  };

  const handleChat = () => {
    navigation.navigate('ChatScreen', { customerName, customerPhone });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Customer</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle-outline" size={100} color="#ccc" />
          <Text style={styles.name}>{customerName}</Text>
          <Text style={styles.status}>Waiting at pickup location</Text>
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={handleCall}>
            <Ionicons name="call" size={24} color="#fff" />
            <Text style={styles.btnText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.msgBtn]} onPress={handleChat}>
            <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
            <Text style={styles.btnText}>Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  status: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  callBtn: {
    backgroundColor: '#4CAF50',
  },
  msgBtn: {
    backgroundColor: '#2196F3',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

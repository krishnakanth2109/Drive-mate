import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type DriverCardProps = {
  name: string;
  rating: number;
  totalTrips: string;
  vehicleModel: string;
  vehiclePlate: string;
  imageUrl: string;
  onCallPress?: () => void;
  onChatPress?: () => void;
};

export default function DriverCard({ name, rating, totalTrips, vehicleModel, vehiclePlate, imageUrl, onCallPress, onChatPress }: DriverCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.driverInfoRow}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: imageUrl }} style={styles.avatar} />
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>{rating}</Text>
            <Ionicons name="star" size={10} color="#fff" />
          </View>
        </View>
        
        <View style={styles.detailsContainer}>
          <Text style={styles.driverName}>{name}</Text>
          <Text style={styles.tripsText}>{totalTrips} trips</Text>
        </View>

        <View style={styles.vehicleContainer}>
          <View style={styles.plateBox}>
            <Text style={styles.plateText}>{vehiclePlate}</Text>
          </View>
          <Text style={styles.vehicleModel}>{vehicleModel}</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={onChatPress}>
          <Ionicons name="chatbubble-outline" size={20} color="#333" />
          <Text style={styles.actionText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={onCallPress}>
          <Ionicons name="call" size={20} color="#fff" />
          <Text style={[styles.actionText, {color: '#fff'}]}>Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  driverInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eee',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: -5,
    alignSelf: 'center',
    backgroundColor: '#f72585',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
  },
  ratingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 2,
  },
  detailsContainer: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  tripsText: {
    fontSize: 13,
    color: '#666',
  },
  vehicleContainer: {
    alignItems: 'flex-end',
  },
  plateBox: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 4,
  },
  plateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  vehicleModel: {
    fontSize: 12,
    color: '#888',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  callBtn: {
    backgroundColor: '#4CAF50',
  },
  actionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  }
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

type RideStatusCardProps = {
  status: 'searching' | 'arriving' | 'arrived' | 'on_trip' | 'drop_arrived';
  etaMinutes?: number;
  message?: string;
};
import RideSidebarOptions from './RideSidebarOptions';
import { useCustomer } from '../../context/CustomerContext';

export default function RideStatusCard({ status, etaMinutes, message }: RideStatusCardProps) {
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const navigation = useNavigation<any>();
  const { activeRide, driver } = useCustomer();
  
  const getStatusConfig = () => {
    switch(status) {
      case 'searching':
        return { title: 'Finding your ride...', color: '#666', icon: 'search' };
      case 'arriving':
        return { title: 'Driver approaching pickup', color: '#f72585', icon: 'car-sport' };
      case 'arrived':
        return { title: 'Driver has arrived', color: '#10b981', icon: 'checkmark-circle' };
      case 'on_trip':
        return { title: 'Ride in progress', color: '#2563eb', icon: 'navigate' };
      case 'drop_arrived':
        return { title: 'Driver has reached destination', color: '#10b981', icon: 'flag' };
    }
  };

  const config = getStatusConfig();

  const handleOptionSelect = async (option: string) => {
    const driverPhone = driver?.phone || (activeRide as any)?.rider?.phone;
    const rideId = activeRide?._id || (activeRide as any)?.id || '';

    switch(option) {
      case 'contact':
        if (!driverPhone) {
          Alert.alert('Not Available', 'Driver phone number will appear once a driver accepts.');
          return;
        }
        Linking.openURL(`tel:${driverPhone}`);
        break;
      case 'share':
        try {
          const dropAddr = activeRide?.drop?.address || (activeRide as any)?.dropAddress || 'my destination';
          await Share.share({
            message: `I am on a DriveMate trip${rideId ? ` (#${String(rideId).slice(-6).toUpperCase()})` : ''} heading to ${dropAddr}.`,
          });
        } catch (error) {
          console.error(error);
        }
        break;
      case 'edit':
        Alert.alert('Change Destination', 'Would you like to update your drop-off location?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Update', onPress: () => console.log('Update destination tapped') }
        ]);
        break;
      case 'safety':
        Alert.alert('Emergency Assistance', 'Call emergency services?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call 911', style: 'destructive', onPress: () => Linking.openURL('tel:911') }
        ]);
        break;
      case 'cancel':
        // Close sidebar first, then navigate
        setSidebarVisible(false);
        navigation.navigate('CancelRide');
        break;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.iconBox, { backgroundColor: `${config.color}20` }]}>
        <Ionicons name={config.icon as any} size={28} color={config.color} />
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.title}>{config.title}</Text>
        {message ? (
          <Text style={styles.message}>{message}</Text>
        ) : etaMinutes ? (
          <Text style={styles.etaText}>Arriving in <Text style={{color: config.color, fontWeight: 'bold'}}>{etaMinutes} mins</Text></Text>
        ) : null}
      </View>

      <TouchableOpacity style={styles.optionsBtn} onPress={() => setSidebarVisible(true)}>
        <Ionicons name="ellipsis-vertical" size={24} color="#666" />
      </TouchableOpacity>

      <RideSidebarOptions 
        visible={isSidebarVisible} 
        onClose={() => setSidebarVisible(false)}
        onOptionSelect={handleOptionSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#666',
  },
  etaText: {
    fontSize: 15,
    color: '#666',
  },
  optionsBtn: {
    padding: 8,
    marginLeft: 10,
  }
});

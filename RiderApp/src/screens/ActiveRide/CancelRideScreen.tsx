import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRider } from '../../context/RiderContext';
import { riderService } from '../../services/riderService';

export default function CancelRideScreen({ navigation, route }: any) {
  const { activeRide } = useRider();
  const rideId = route?.params?.rideId || activeRide?._id;

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherReason, setOtherReason] = useState('');
  const [loading, setLoading] = useState(false);

  const reasons = [
    'Rider no-show',
    'Vehicle broke down',
    'Traffic / Road blocked',
    'Too far away',
    'Other'
  ];

  const handleCancelTrip = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for cancellation.');
      return;
    }

    const reasonFinal = selectedReason === 'Other' ? otherReason : selectedReason;

    if (!rideId) {
      Alert.alert('Notice', 'No active ride to cancel.');
      navigation.goBack();
      return;
    }

    setLoading(true);
    try {
      await riderService.cancelRide(rideId, reasonFinal);
      Alert.alert(
        'Ride Cancelled',
        'This trip has been cancelled successfully.',
        [{ text: 'OK', onPress: () => navigation.navigate('MainTabs') }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to cancel ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cancel Ride</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.warningText}>
          Are you sure you want to cancel this ride? Frequent cancellations may affect your provider rating.
        </Text>

        <Text style={styles.title}>Why are you cancelling?</Text>

        <View style={styles.reasonsContainer}>
          {reasons.map((reason, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.reasonBtn, selectedReason === reason && styles.reasonBtnSelected]}
              onPress={() => setSelectedReason(reason)}
            >
              <Text style={[styles.reasonText, selectedReason === reason && styles.reasonTextSelected]}>
                {reason}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedReason === 'Other' && (
          <TextInput
            style={styles.input}
            placeholder="Please specify..."
            value={otherReason}
            onChangeText={setOtherReason}
            multiline
          />
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelTrip}>
          <Text style={styles.cancelBtnText}>Confirm Cancellation</Text>
        </TouchableOpacity>
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
  },
  warningText: {
    fontSize: 14,
    color: '#e74c3c',
    backgroundColor: '#fadbd8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  reasonsContainer: {
    gap: 12,
  },
  reasonBtn: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  reasonBtnSelected: {
    borderColor: '#f72585',
    backgroundColor: '#fff0f5',
  },
  reasonText: {
    fontSize: 16,
    color: '#555',
  },
  reasonTextSelected: {
    color: '#f72585',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelBtn: {
    backgroundColor: '#f72585',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

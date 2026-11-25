import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function CancelRideScreen() {
  const navigation = useNavigation<any>();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherReason, setOtherReason] = useState('');

  const reasons = [
    'Driver is taking too long',
    'Driver asked me to cancel',
    'I changed my mind',
    'Selected wrong pickup/dropoff',
    'Other'
  ];

  const handleCancelTrip = () => {
    if (!selectedReason) {
      Alert.alert('Selection Required', 'Please select a reason for cancelling your ride.');
      return;
    }
    
    // API call to cancel the ride from customer side
    Alert.alert(
      'Ride Cancelled',
      'Your ride has been successfully cancelled. A cancellation fee may apply depending on how long it has been since booking.',
      [{ text: 'OK', onPress: () => navigation.navigate('Home' as never) }] // Assumes a Home screen exists
    );
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
          Are you sure you want to cancel? If the driver has already made significant progress, you might be charged a small cancellation fee.
        </Text>

        <Text style={styles.title}>Reason for cancellation</Text>

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
            placeholder="Please specify why you're cancelling..."
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
    color: '#e67e22',
    backgroundColor: '#fcf3cf',
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
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e9',
  },
  reasonText: {
    fontSize: 16,
    color: '#555',
  },
  reasonTextSelected: {
    color: '#4CAF50',
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

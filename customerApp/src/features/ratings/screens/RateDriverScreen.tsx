import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ratingService } from '../services/ratingService';
import { extractApiErrorMessage } from '../../../services/api';

export default function RateDriverScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const rideId = route?.params?.rideId || '';
  const driverName = route?.params?.driverName || 'your driver';

  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rideId) {
      Alert.alert('Missing Ride', 'No completed ride selected to rate.');
      return;
    }
    try {
      setSubmitting(true);
      await ratingService.rateRide(String(rideId), rating, review);
      Alert.alert('Thank You!', 'Your rating has been submitted.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', extractApiErrorMessage(err, 'Failed to submit rating.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Driver</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.prompt}>How was your ride with {driverName}?</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((num) => (
            <TouchableOpacity key={num} onPress={() => setRating(num)} style={styles.starBtn}>
              <Ionicons name={num <= rating ? 'star' : 'star-outline'} size={38} color="#f59e0b" />
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.input}
          placeholder="Optional feedback about your trip..."
          value={review}
          onChangeText={setReview}
          multiline
        />
        <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Rating</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingTop: Platform.OS === 'android' ? 36 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  content: { padding: 24 },
  prompt: { fontSize: 20, fontWeight: '700', color: '#0f172a', textAlign: 'center', marginBottom: 20 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 24 },
  starBtn: { padding: 4 },
  input: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, minHeight: 100, textAlignVertical: 'top', fontSize: 15 },
  submitBtn: { marginTop: 22, backgroundColor: '#f72585', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

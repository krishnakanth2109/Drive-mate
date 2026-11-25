import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { riderService } from '../../services/riderService';
import { SupportTicket } from '../../services/types';

const CATEGORIES = [
  { id: 'fare_issue', label: 'Fare Issue' },
  { id: 'lost_item', label: 'Lost Item' },
  { id: 'dispute', label: 'Customer Dispute' },
  { id: 'vehicle_issue', label: 'Vehicle Problem' },
  { id: 'account_issue', label: 'Account Issue' },
  { id: 'other', label: 'Other' },
];

export default function RaiseTicketScreen({ navigation, route }: any) {
  const initialRideId = route?.params?.rideId || '';
  const initialType = route?.params?.type || 'fare_issue';

  const [selectedType, setSelectedType] = useState(initialType);
  const [description, setDescription] = useState('');
  const [rideId, setRideId] = useState(initialRideId);
  const [submitting, setSubmitting] = useState(false);
  const [pastTickets, setPastTickets] = useState<SupportTicket[]>([]);

  const fetchTickets = useCallback(async () => {
    try {
      const tickets = await riderService.getTickets();
      setPastTickets(tickets);
    } catch (err) {
      console.log('Failed to fetch tickets:', err);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Required', 'Please describe the issue in detail.');
      return;
    }

    setSubmitting(true);
    try {
      await riderService.raiseTicket({
        type: selectedType,
        description: description.trim(),
        rideId: rideId || undefined
      });
      setDescription('');
      Alert.alert('Ticket Submitted', 'Our support team will review your request and get back shortly.');
      await fetchTickets();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return '#2ecc71';
      case 'in_progress': return '#f39c12';
      default: return '#3498db';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support Ticket</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Select Issue Type</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryBtn, selectedType === cat.id && styles.categoryBtnActive]}
              onPress={() => setSelectedType(cat.id)}
            >
              <Text style={[styles.categoryText, selectedType === cat.id && styles.categoryTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {rideId ? (
          <View style={styles.rideBadge}>
            <Ionicons name="car-outline" size={16} color="#f72585" />
            <Text style={styles.rideBadgeText}>Linked to Ride #{rideId.slice(-6).toUpperCase()}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Describe the Problem</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Please explain what happened. Include dates, locations or amounts if applicable..."
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Support Request</Text>
          )}
        </TouchableOpacity>

        {pastTickets.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Your Previous Tickets</Text>
            {pastTickets.map(t => (
              <View key={t._id} style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketType}>{t.type.replace('_', ' ').toUpperCase()}</Text>
                  <Text style={[styles.ticketStatus, { color: getStatusColor(t.status) }]}>
                    {t.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.ticketDesc}>{t.description}</Text>
                <Text style={styles.ticketDate}>
                  {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Recent'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 12, marginTop: 10 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  categoryBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  categoryBtnActive: { backgroundColor: '#f72585', borderColor: '#f72585' },
  categoryText: { color: '#555', fontSize: 13, fontWeight: '600' },
  categoryTextActive: { color: '#fff' },
  rideBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdeef4', padding: 10, borderRadius: 8, marginBottom: 16, alignSelf: 'flex-start' },
  rideBadgeText: { color: '#f72585', fontSize: 13, fontWeight: 'bold', marginLeft: 6 },
  textArea: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14, fontSize: 15, textAlignVertical: 'top', minHeight: 120, marginBottom: 20 },
  submitBtn: { backgroundColor: '#f72585', paddingVertical: 16, borderRadius: 12, alignItems: 'center', elevation: 2 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  historySection: { marginTop: 30 },
  ticketCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  ticketType: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  ticketStatus: { fontWeight: 'bold', fontSize: 13 },
  ticketDesc: { fontSize: 14, color: '#666', lineHeight: 20 },
  ticketDate: { fontSize: 12, color: '#999', marginTop: 8 }
});

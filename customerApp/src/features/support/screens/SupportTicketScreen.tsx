import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supportService, ClaimItem } from '../services/supportService';
import { extractApiErrorMessage } from '../../../services/api';

export default function SupportTicketScreen() {
  const navigation = useNavigation<any>();
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [type, setType] = useState('ride_issue');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadClaims = useCallback(async () => {
    try {
      const list = await supportService.getClaims();
      setClaims(Array.isArray(list) ? list : []);
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Validation', 'Please enter issue details.');
      return;
    }
    try {
      setSubmitting(true);
      await supportService.addClaim({ type, description: description.trim() });
      setDescription('');
      await loadClaims();
      Alert.alert('Submitted', 'Your support ticket has been created.');
    } catch (err: any) {
      Alert.alert('Error', extractApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support Tickets</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Raise New Issue</Text>
          <View style={styles.chipRow}>
            {['ride_issue', 'payment', 'lost_item', 'safety'].map((t) => (
              <TouchableOpacity key={t} style={[styles.chip, type === t && styles.chipActive]} onPress={() => setType(t)}>
                <Text style={[styles.chipText, type === t && { color: '#fff' }]}>{t.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Describe your issue..."
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Ticket</Text>}
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 18, marginBottom: 10 }]}>Your Tickets</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#f72585" style={{ marginTop: 20 }} />
        ) : claims.length === 0 ? (
          <Text style={{ color: '#64748b' }}>No support tickets submitted yet.</Text>
        ) : (
          claims.map((c) => (
            <View key={c._id} style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', fontSize: 12 }}>{c.type}</Text>
                <Text style={{ fontWeight: '700', color: '#f72585', fontSize: 12 }}>{String(c.status).toUpperCase()}</Text>
              </View>
              <Text style={{ color: '#334155', fontSize: 14 }}>{c.description}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingTop: Platform.OS === 'android' ? 36 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, elevation: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f1f5f9' },
  chipActive: { backgroundColor: '#f72585' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#475569', textTransform: 'capitalize' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, minHeight: 88, textAlignVertical: 'top', marginBottom: 12 },
  btn: { backgroundColor: '#f72585', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});

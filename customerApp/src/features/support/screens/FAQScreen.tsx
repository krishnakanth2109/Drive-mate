import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supportService, FaqItem } from '../services/supportService';
import { extractApiErrorMessage } from '../../../services/api';

export default function FAQScreen() {
  const navigation = useNavigation<any>();
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFaqs = useCallback(async () => {
    try {
      setError(null);
      const data = await supportService.getFaqs('customer');
      setFaqs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFaqs();
  }, [loadFaqs]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQs</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#f72585" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadFaqs}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {faqs.map((f) => {
            const open = expanded === f.id;
            return (
              <TouchableOpacity key={f.id} style={styles.card} onPress={() => setExpanded(open ? null : f.id)}>
                <View style={styles.row}>
                  <Text style={styles.q}>{f.question}</Text>
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
                </View>
                {open ? <Text style={styles.a}>{f.answer}</Text> : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingTop: Platform.OS === 'android' ? 36 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errText: { color: '#ef4444', marginBottom: 12 },
  retryBtn: { backgroundColor: '#f72585', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, elevation: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  q: { flex: 1, fontSize: 15, fontWeight: '600', color: '#0f172a', marginRight: 8 },
  a: { marginTop: 10, fontSize: 14, color: '#475569', lineHeight: 20 },
});

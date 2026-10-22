import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { riderService } from '../../services/riderService';
import { SupportFaq } from '../../services/types';

export default function FAQsScreen({ navigation }: any) {
  const [faqs, setFaqs] = useState<SupportFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>('1');

  const fetchFaqs = useCallback(async () => {
    try {
      const data = await riderService.getFaqs();
      setFaqs(data);
    } catch (err) {
      console.log('Failed to fetch FAQs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Driver FAQs</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#f72585" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchFaqs(); }}
              colors={['#f72585']}
            />
          }
        >
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <Text style={styles.subText}>Find quick answers to common driver partner questions.</Text>

          {faqs.map(item => {
            const isExpanded = expandedId === item.id;
            return (
              <View key={item.id} style={styles.faqCard}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  activeOpacity={0.8}
                  onPress={() => toggleExpand(item.id)}
                >
                  <Text style={styles.question}>{item.question}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#f72585"
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.answerBox}>
                    <Text style={styles.answer}>{item.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}

          <View style={styles.supportBox}>
            <Text style={styles.supportTitle}>Still have questions?</Text>
            <Text style={styles.supportSub}>Our driver support representatives are here 24/7.</Text>
            <TouchableOpacity
              style={styles.ticketBtn}
              onPress={() => navigation?.navigate('RaiseTicket')}
            >
              <Text style={styles.ticketBtnText}>Raise a Support Ticket</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4 },
  subText: { fontSize: 14, color: '#666', marginBottom: 20 },
  faqCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, overflow: 'hidden' },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  question: { fontSize: 15, fontWeight: '600', color: '#333', flex: 1, paddingRight: 10 },
  answerBox: { paddingHorizontal: 18, paddingBottom: 18, borderTopWidth: 1, borderColor: '#f0f0f0', paddingTop: 12 },
  answer: { fontSize: 14, color: '#555', lineHeight: 22 },
  supportBox: { backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center', marginTop: 24, elevation: 2 },
  supportTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 6 },
  supportSub: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16 },
  ticketBtn: { backgroundColor: '#f72585', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  ticketBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});

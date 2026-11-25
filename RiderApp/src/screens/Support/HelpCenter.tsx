import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { riderService } from '../../services/riderService';
import { SupportFaq } from '../../services/types';

export default function SupportScreen({ navigation }: any) {
  const [faqs, setFaqs] = useState<SupportFaq[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFaqs = useCallback(async () => {
    try {
      const data = await riderService.getFaqs();
      setFaqs(data);
    } catch (err) {
      console.log('Failed to fetch FAQs:', err);
    } finally {
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
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFaqs(); }} colors={['#e74c3c']} />}
    >
      <View style={styles.header}>
        <Ionicons name="headset" size={60} color="#fff" />
        <Text style={styles.headerTitle}>Driver Support</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL('tel:1800123456')}>
          <Ionicons name="call" size={24} color="#1a1a2e" />
          <Text style={styles.actionText}>Call Us</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation?.navigate('RaiseTicket')}
        >
          <Ionicons name="chatbubbles" size={24} color="#1a1a2e" />
          <Text style={styles.actionText}>Raise Ticket</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
      
      <View style={styles.faqList}>
        {faqs.map(item => {
          const isExpanded = expandedId === item.id;
          return (
            <View key={item.id} style={styles.faqItemContainer}>
              <TouchableOpacity
                style={styles.faqItem}
                onPress={() => toggleExpand(item.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.faqTitle}>{item.question}</Text>
                <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#999" />
              </TouchableOpacity>
              {isExpanded && (
                <View style={styles.faqAnswerBox}>
                  <Text style={styles.faqAnswer}>{item.answer}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: { backgroundColor: '#e74c3c', padding: 40, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 12 },
  quickActions: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: -25, paddingHorizontal: 20 },
  actionBtn: { backgroundColor: '#fff', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', width: '45%', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 4 },
  actionText: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginLeft: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', margin: 20, marginTop: 40 },
  faqList: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', marginBottom: 30 },
  faqItemContainer: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  faqItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  faqTitle: { fontSize: 15, color: '#333', fontWeight: '500', flex: 1, paddingRight: 8 },
  faqAnswerBox: { paddingHorizontal: 20, paddingBottom: 16 },
  faqAnswer: { fontSize: 14, color: '#666', lineHeight: 20 }
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supportService, FaqItem } from '../services/supportService';
import { extractApiErrorMessage } from '../../../services/api';

export default function HelpScreen() {
  const navigation = useNavigation<any>();
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFaqs = useCallback(async () => {
    try {
      setError(null);
      const list = await supportService.getFaqs('customer');
      setFaqs(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(extractApiErrorMessage(err, 'Unable to load FAQs.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFaqs();
  }, [loadFaqs]);

  const handleCallSupport = () => {
    Linking.openURL('tel:+918001234567').catch(() => {
      Alert.alert('Customer Care', 'Toll-free: 1800-123-4567\nAvailable 24x7.');
    });
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@drivemate.com?subject=Customer Support Request');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Quick Contact Cards */}
        <Text style={styles.sectionHeader}>Instant Assistance</Text>
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactCard} onPress={handleCallSupport}>
            <View style={[styles.iconCircle, { backgroundColor: '#e6fcf5' }]}>
              <Ionicons name="call" size={24} color="#0ca678" />
            </View>
            <Text style={styles.contactTitle}>Call Us</Text>
            <Text style={styles.contactSub}>24x7 Toll Free</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleEmailSupport}>
            <View style={[styles.iconCircle, { backgroundColor: '#fff0f6' }]}>
              <Ionicons name="mail" size={24} color="#f72585" />
            </View>
            <Text style={styles.contactTitle}>Email Support</Text>
            <Text style={styles.contactSub}>Replies in 2 hrs</Text>
          </TouchableOpacity>
        </View>

        {/* Safety Banner */}
        <View style={styles.safetyBanner}>
          <Ionicons name="shield-checkmark" size={28} color="#4361ee" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.safetyTitle}>DriveMate Safety Shield</Text>
            <Text style={styles.safetyDesc}>
              Every trip is GPS tracked with 24/7 SOS dispatch and emergency contacts.
            </Text>
          </View>
        </View>

        {/* FAQs */}
        <Text style={styles.sectionHeader}>Frequently Asked Questions</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#f72585" style={{ marginVertical: 20 }} />
        ) : error ? (
          <View style={{ paddingVertical: 12 }}>
            <Text style={{ color: '#ef4444', marginBottom: 8 }}>{error}</Text>
            <TouchableOpacity onPress={loadFaqs}>
              <Text style={{ color: '#f72585', fontWeight: '700' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.faqList}>
            {faqs.map((faq) => {
              const isExpanded = expandedFaq === faq.id;
              return (
                <TouchableOpacity
                  key={faq.id}
                  style={styles.faqItem}
                  activeOpacity={0.7}
                  onPress={() => setExpandedFaq(isExpanded ? null : faq.id)}
                >
                  <View style={styles.faqQuestionRow}>
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="#666"
                    />
                  </View>
                  {isExpanded && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          style={{ marginTop: 18, backgroundColor: '#1a1a2e', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
          onPress={() => navigation.navigate('SupportTicket')}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>View & Raise Support Tickets</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'android' ? 36 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a2e',
    marginBottom: 12,
    marginTop: 8,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  contactSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#edf2ff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#dbe4ff',
  },
  safetyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#364fc7',
  },
  safetyDesc: {
    fontSize: 12,
    color: '#495057',
    marginTop: 2,
    lineHeight: 16,
  },
  faqList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  faqItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#666',
    marginTop: 10,
    lineHeight: 18,
  },
});

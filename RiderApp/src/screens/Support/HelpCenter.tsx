import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SupportScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="headset" size={60} color="#fff" />
        <Text style={styles.headerTitle}>Driver Support</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="call" size={24} color="#1a1a2e" />
          <Text style={styles.actionText}>Call Us</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="chatbubbles" size={24} color="#1a1a2e" />
          <Text style={styles.actionText}>Chat</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
      
      <View style={styles.faqList}>
        <TouchableOpacity style={styles.faqItem}>
          <Text style={styles.faqTitle}>When will I receive my payout?</Text>
          <Ionicons name="chevron-down" size={20} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.faqItem}>
          <Text style={styles.faqTitle}>Customer refused to pay</Text>
          <Ionicons name="chevron-down" size={20} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.faqItem}>
          <Text style={styles.faqTitle}>My account is suspended</Text>
          <Ionicons name="chevron-down" size={20} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.faqItem}>
          <Text style={styles.faqTitle}>How do incentives work?</Text>
          <Ionicons name="chevron-down" size={20} color="#999" />
        </TouchableOpacity>
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
  faqList: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 16, overflow: 'hidden' },
  faqItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  faqTitle: { fontSize: 15, color: '#333', fontWeight: '500' }
});

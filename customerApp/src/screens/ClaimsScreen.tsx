import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ClaimsScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Ionicons name="shield-checkmark" size={60} color="#4cc9f0" />
          <Text style={styles.headerTitle}>Insurance & Claims</Text>
          <Text style={styles.headerSub}>Every ride on DriveMate is insured.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Claims</Text>
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={40} color="#ccc" />
            <Text style={styles.emptyText}>You have no active claims.</Text>
          </View>
        </View>

      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="bag-remove-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>Report Lost Item</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#1a1a2e', marginTop: 12 }]}>
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>File New Claim</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  scrollContent: { padding: 20, paddingBottom: 150 },
  header: { alignItems: 'center', marginVertical: 30 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', marginTop: 16 },
  headerSub: { fontSize: 15, color: '#666', marginTop: 8 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 16 },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  emptyText: { marginTop: 12, fontSize: 15, color: '#888' },
  bottomActions: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionBtn: {
    flexDirection: 'row', backgroundColor: '#3b5998', padding: 16,
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 10 }
});

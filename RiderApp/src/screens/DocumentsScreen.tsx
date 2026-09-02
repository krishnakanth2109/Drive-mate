import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DocumentsScreen() {
  const docs = [
    { id: '1', title: 'Driving License', status: 'Approved', color: '#2ecc71', icon: 'checkmark-circle' },
    { id: '2', title: 'Vehicle RC Book', status: 'Approved', color: '#2ecc71', icon: 'checkmark-circle' },
    { id: '3', title: 'Aadhar Card', status: 'Pending Review', color: '#f39c12', icon: 'time' },
    { id: '4', title: 'Background Check', status: 'Required', color: '#e74c3c', icon: 'alert-circle' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="document-text" size={48} color="#3b5998" />
        <Text style={styles.headerTitle}>Document Verification</Text>
        <Text style={styles.headerSub}>Upload clear photos of your original documents to activate your account fully.</Text>
      </View>

      <View style={styles.list}>
        {docs.map(doc => (
          <TouchableOpacity key={doc.id} style={styles.docCard}>
            <View style={styles.docLeft}>
              <Ionicons name="document-outline" size={24} color="#555" style={{ marginRight: 12 }} />
              <View>
                <Text style={styles.docTitle}>{doc.title}</Text>
                <View style={styles.statusRow}>
                  <Ionicons name={doc.icon as any} size={14} color={doc.color} />
                  <Text style={[styles.docStatus, { color: doc.color }]}>{doc.status}</Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: { padding: 30, alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e', marginTop: 12 },
  headerSub: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  list: { padding: 20 },
  docCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  docLeft: { flexDirection: 'row', alignItems: 'center' },
  docTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  docStatus: { fontSize: 13, fontWeight: '500', marginLeft: 4 }
});

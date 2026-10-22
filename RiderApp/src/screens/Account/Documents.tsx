import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { riderService } from '../../services/riderService';
import { RiderDocument } from '../../services/types';

export default function DocumentsScreen() {
  const [docs, setDocs] = useState<RiderDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<RiderDocument | null>(null);
  const [docNumber, setDocNumber] = useState('');

  const fetchDocs = useCallback(async () => {
    try {
      const data = await riderService.getDocuments();
      setDocs(data);
    } catch (err) {
      console.log('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleOpenDoc = (doc: RiderDocument) => {
    setSelectedDoc(doc);
    setDocNumber(doc.documentNumber || '');
  };

  const handleSubmitDoc = async () => {
    if (!selectedDoc) return;
    try {
      const updated = await riderService.updateDocument({
        id: selectedDoc.id,
        title: selectedDoc.title,
        documentNumber: docNumber,
        status: 'Pending Review'
      });
      setDocs(updated);
      setSelectedDoc(null);
      Alert.alert('Submitted', `${selectedDoc.title} has been submitted for review.`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit document');
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Approved') return '#2ecc71';
    if (status === 'Pending Review') return '#f39c12';
    return '#e74c3c';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Approved') return 'checkmark-circle';
    if (status === 'Pending Review') return 'time';
    return 'alert-circle';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDocs(); }} colors={['#f72585']} />}
    >
      <View style={styles.header}>
        <Ionicons name="document-text" size={48} color="#3b5998" />
        <Text style={styles.headerTitle}>Document Verification</Text>
        <Text style={styles.headerSub}>Upload clear photos of your original documents to activate your account fully.</Text>
      </View>

      <View style={styles.list}>
        {docs.map(doc => {
          const color = getStatusColor(doc.status);
          const icon = getStatusIcon(doc.status);
          return (
            <TouchableOpacity key={doc.id} style={styles.docCard} onPress={() => handleOpenDoc(doc)}>
              <View style={styles.docLeft}>
                <Ionicons name="document-outline" size={24} color="#555" style={{ marginRight: 12 }} />
                <View>
                  <Text style={styles.docTitle}>{doc.title}</Text>
                  {doc.documentNumber ? (
                    <Text style={styles.docSub}>{doc.documentNumber}</Text>
                  ) : null}
                  <View style={styles.statusRow}>
                    <Ionicons name={icon as any} size={14} color={color} />
                    <Text style={[styles.docStatus, { color }]}>{doc.status}</Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Document Edit Modal */}
      <Modal visible={!!selectedDoc} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedDoc?.title}</Text>
            <Text style={styles.modalSub}>Enter document ID/number for verification</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. DL-KA-2022-XXXX"
              value={docNumber}
              onChangeText={setDocNumber}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setSelectedDoc(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSubmitDoc}>
                <Text style={styles.modalSubmitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  docLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  docTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  docSub: { fontSize: 12, color: '#888', marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  docStatus: { fontSize: 13, fontWeight: '500', marginLeft: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  modalSub: { fontSize: 13, color: '#666', marginTop: 4, marginBottom: 16 },
  modalInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20 },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  modalCancelText: { color: '#666', fontWeight: 'bold' },
  modalSubmitBtn: { backgroundColor: '#f72585', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  modalSubmitText: { color: '#fff', fontWeight: 'bold' },
});

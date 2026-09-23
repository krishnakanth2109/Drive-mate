import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function OutstationOptInScreen({ navigation }: any) {
  const [agreed, setAgreed] = useState(false);

  const handleConfirm = () => {
    if (!agreed) {
      Alert.alert('Terms Required', 'Please agree to the outstation terms to proceed.');
      return;
    }
    Alert.alert('Success!', 'You are now opted in for Outstation Rides! You will start receiving longer trip requests.');
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="car" size={60} color="#3b5998" />
        <Text style={styles.title}>Outstation Program</Text>
        <Text style={styles.subtitle}>Review the requirements before opting in.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Requirements</Text>
        <View style={styles.bulletRow}>
          <Ionicons name="checkmark-circle" size={20} color="#2ecc71" />
          <Text style={styles.bulletText}>Vehicle must be less than 5 years old.</Text>
        </View>
        <View style={styles.bulletRow}>
          <Ionicons name="checkmark-circle" size={20} color="#2ecc71" />
          <Text style={styles.bulletText}>Valid interstate permit (if applicable).</Text>
        </View>
        <View style={styles.bulletRow}>
          <Ionicons name="checkmark-circle" size={20} color="#2ecc71" />
          <Text style={styles.bulletText}>Minimum driver rating of 4.5 ⭐</Text>
        </View>

        <TouchableOpacity 
          style={styles.checkboxRow} 
          activeOpacity={0.8}
          onPress={() => setAgreed(!agreed)}
        >
          <Ionicons 
            name={agreed ? "checkbox" : "square-outline"} 
            size={24} 
            color={agreed ? "#f72585" : "#ccc"} 
          />
          <Text style={styles.checkboxText}>I confirm my vehicle meets all requirements and I agree to the terms.</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.confirmBtn, !agreed && styles.confirmBtnDisabled]} 
        onPress={handleConfirm}
      >
        <Text style={styles.confirmBtnText}>Confirm Opt-In</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: { padding: 40, alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e', marginTop: 12 },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  card: { backgroundColor: '#fff', margin: 20, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 16 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  bulletText: { fontSize: 14, color: '#555', marginLeft: 10, flex: 1 },
  checkboxRow: { flexDirection: 'row', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  checkboxText: { fontSize: 13, color: '#333', marginLeft: 10, flex: 1, lineHeight: 20 },
  confirmBtn: { backgroundColor: '#f72585', marginHorizontal: 20, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 30 },
  confirmBtnDisabled: { backgroundColor: '#ccc' },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

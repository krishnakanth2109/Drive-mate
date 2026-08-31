import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';

export default function OfficeScreen() {
  const callSupport = () => Linking.openURL(`tel:1800123456`);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Help & Support</Text>

      {/* Online Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🟢 Online Support</Text>
        <Text style={styles.text}>Our team is available 24/7 to assist you with any ride-related issues.</Text>
        <TouchableOpacity style={styles.btn} onPress={callSupport}>
          <Text style={styles.btnText}>Call Customer Care</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.chatBtn]}>
          <Text style={styles.btnText}>Chat with Us</Text>
        </TouchableOpacity>
      </View>

      {/* Offline Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🏢 Offline Offices</Text>
        <Text style={styles.text}>Visit our physical centers for lost items or complaints.</Text>
        
        <View style={styles.officeItem}>
          <Text style={styles.officeName}>Main HQ - Bangalore</Text>
          <Text style={styles.officeAddr}>#123, Tech Park, Indiranagar, Bangalore - 560038</Text>
          <Text style={styles.officeTime}>Open: 9 AM - 6 PM (Mon-Sat)</Text>
        </View>

        <View style={styles.officeItem}>
          <Text style={styles.officeName}>City Hub - Mumbai</Text>
          <Text style={styles.officeAddr}>Andheri East, Near Metro Stn, Mumbai - 400069</Text>
          <Text style={styles.officeTime}>Open: 10 AM - 7 PM (Mon-Fri)</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 10, marginBottom: 20, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  text: { color: '#555', marginBottom: 15, lineHeight: 20 },
  btn: { backgroundColor: 'black', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  chatBtn: { backgroundColor: '#007AFF' },
  btnText: { color: 'white', fontWeight: 'bold' },
  officeItem: { marginTop: 15, borderTopWidth: 1, borderColor: '#eee', paddingTop: 10 },
  officeName: { fontWeight: 'bold', fontSize: 16 },
  officeAddr: { color: '#555', marginTop: 2 },
  officeTime: { color: 'green', fontSize: 12, marginTop: 2 }
});
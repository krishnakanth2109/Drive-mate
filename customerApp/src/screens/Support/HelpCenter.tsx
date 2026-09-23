import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HelpScreen() {
  return (
    <ScrollView style={styles.container}>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput 
          style={styles.searchInput}
          placeholder="How can we help you today?"
          placeholderTextColor="#999"
        />
      </View>

      <Text style={styles.sectionTitle}>Quick Help</Text>
      <View style={styles.grid}>
        <TouchableOpacity style={styles.gridItem}>
          <Ionicons name="car-outline" size={32} color="#3b5998" />
          <Text style={styles.gridText}>Ride Issues</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridItem}>
          <Ionicons name="wallet-outline" size={32} color="#3b5998" />
          <Text style={styles.gridText}>Payment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridItem}>
          <Ionicons name="person-outline" size={32} color="#3b5998" />
          <Text style={styles.gridText}>Account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridItem}>
          <Ionicons name="shield-outline" size={32} color="#3b5998" />
          <Text style={styles.gridText}>Safety</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Contact Us</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.row}>
          <Ionicons name="chatbubbles-outline" size={24} color="#1a1a2e" style={styles.rowIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Chat with Support</Text>
            <Text style={styles.rowSub}>Typically replies in 2 minutes</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
        
        <View style={styles.divider} />
        
        <TouchableOpacity style={styles.row}>
          <Ionicons name="call-outline" size={24} color="#1a1a2e" style={styles.rowIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Call Emergency (SOS)</Text>
            <Text style={styles.rowSub}>24/7 dedicated safety line</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8', padding: 16 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    padding: 14, borderRadius: 12, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#333' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30 },
  gridItem: {
    width: '48%', backgroundColor: '#fff', padding: 20, borderRadius: 12,
    alignItems: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  gridText: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  rowIcon: { marginRight: 16 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', marginBottom: 4 },
  rowSub: { fontSize: 13, color: '#888' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 }
});

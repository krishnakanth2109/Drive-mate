import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Clipboard, Alert } from 'react-native';

const OFFERS = [
  { id: '1', code: 'WELCOME50', desc: '50% off your first ride', valid: 'Valid until Dec 31' },
  { id: '2', code: 'FREERIDE', desc: 'Get 1 free ride up to ₹100', valid: 'Valid for new users' },
  { id: '3', code: 'WEEKEND20', desc: '20% off on weekends', valid: 'Sat-Sun only' },
];

export default function OffersScreen() {
  const copyToClipboard = (code: string) => {
    Clipboard.setString(code);
    Alert.alert('Copied', `${code} copied to clipboard!`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Offers</Text>
      <FlatList 
        data={OFFERS}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.code}>{item.code}</Text>
              <Text style={styles.desc}>{item.desc}</Text>
              <Text style={styles.valid}>{item.valid}</Text>
            </View>
            <TouchableOpacity style={styles.btn} onPress={() => copyToClipboard(item.code)}>
              <Text style={styles.btnText}>Copy</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 10, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 3 },
  code: { fontSize: 18, fontWeight: 'bold', color: '#2ecc71', marginBottom: 5 },
  desc: { fontSize: 14, color: '#333', marginBottom: 5 },
  valid: { fontSize: 12, color: 'gray' },
  btn: { backgroundColor: '#f0f0f0', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  btnText: { fontWeight: 'bold', color: '#333' }
});
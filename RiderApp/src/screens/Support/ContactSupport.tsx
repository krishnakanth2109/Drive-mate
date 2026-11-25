import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ContactSupportScreen({ navigation }: any) {
  const handleCallHotline = () => {
    Linking.openURL('tel:1800123456');
  };

  const handleCallSOS = () => {
    Linking.openURL('tel:112');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@drivemate.com?subject=Driver%20Support%20Request');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Emergency SOS Banner */}
        <TouchableOpacity style={styles.sosCard} onPress={handleCallSOS}>
          <Ionicons name="warning" size={32} color="#fff" />
          <View style={styles.sosTextContainer}>
            <Text style={styles.sosTitle}>Emergency SOS (Police)</Text>
            <Text style={styles.sosSub}>Immediate safety assistance for accidents or threats</Text>
          </View>
          <Ionicons name="call" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Get in Touch</Text>

        <TouchableOpacity style={styles.card} onPress={handleCallHotline}>
          <View style={[styles.iconBox, { backgroundColor: '#e8f8f0' }]}>
            <Ionicons name="call" size={24} color="#2ecc71" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>24/7 Driver Helpline</Text>
            <Text style={styles.cardSub}>Toll-free: 1800-123-456</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation?.navigate('RaiseTicket')}>
          <View style={[styles.iconBox, { backgroundColor: '#fdeef4' }]}>
            <Ionicons name="chatbubbles" size={24} color="#f72585" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Submit Support Ticket</Text>
            <Text style={styles.cardSub}>Report fare issues, disputes, or account help</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={handleEmail}>
          <View style={[styles.iconBox, { backgroundColor: '#ebf5fb' }]}>
            <Ionicons name="mail" size={24} color="#3498db" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Email Partner Support</Text>
            <Text style={styles.cardSub}>support@drivemate.com</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation?.navigate('FAQs')}>
          <View style={[styles.iconBox, { backgroundColor: '#fef5e7' }]}>
            <Ionicons name="help-circle" size={24} color="#f39c12" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Browse FAQs</Text>
            <Text style={styles.cardSub}>Quick answers to common questions</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  content: { padding: 20 },
  sosCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e74c3c', padding: 20, borderRadius: 16, marginBottom: 24, elevation: 3 },
  sosTextContainer: { flex: 1, marginLeft: 14, marginRight: 10 },
  sosTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  sosSub: { color: '#ffe5e5', fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 14 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 18, borderRadius: 14, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3 },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  cardTextContainer: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  cardSub: { fontSize: 13, color: '#888', marginTop: 2 }
});

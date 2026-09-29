import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

type Props = {
  navigation: StackNavigationProp<any, 'OrderDetails'>;
};

export default function OrderDetailsScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #8942</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>Completed</Text>
          <Text style={styles.dateText}>Today, 10:30 AM</Text>
        </View>

        <View style={styles.routeCard}>
          <View style={styles.routePoint}>
            <Ionicons name="radio-button-on" size={16} color="#4CAF50" />
            <Text style={styles.pointText}>123 Main St, Apartment 4B</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routePoint}>
            <Ionicons name="location" size={16} color="#f72585" />
            <Text style={styles.pointText}>City Airport, Terminal 1</Text>
          </View>
        </View>

        <View style={styles.earningsCard}>
          <Text style={styles.earningsTitle}>Trip Earnings</Text>
          
          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Base Fare</Text>
            <Text style={styles.earningsValue}>₹200</Text>
          </View>
          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Distance (15 km)</Text>
            <Text style={styles.earningsValue}>₹250</Text>
          </View>
          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Time (35 mins)</Text>
            <Text style={styles.earningsValue}>₹50</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.earningsRow}>
            <Text style={styles.totalLabel}>Total Earnings</Text>
            <Text style={styles.totalValue}>₹500</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.helpBtn}>
          <Ionicons name="help-circle-outline" size={20} color="#f72585" />
          <Text style={styles.helpText}>Get help with this trip</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E2C' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, backgroundColor: '#2a2a3c' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20, backgroundColor: '#1E1E2C' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  content: { padding: 20 },
  statusCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2a2a3c', padding: 20, borderRadius: 15, marginBottom: 20 },
  statusText: { color: '#4CAF50', fontSize: 18, fontWeight: 'bold' },
  dateText: { color: '#a0a0b0', fontSize: 14 },
  routeCard: { backgroundColor: '#2a2a3c', padding: 20, borderRadius: 15, marginBottom: 20 },
  routePoint: { flexDirection: 'row', alignItems: 'center' },
  pointText: { color: '#fff', marginLeft: 10, fontSize: 16 },
  routeLine: { width: 2, height: 20, backgroundColor: '#3b3b4f', marginLeft: 7, marginVertical: 5 },
  earningsCard: { backgroundColor: '#2a2a3c', padding: 20, borderRadius: 15, marginBottom: 20 },
  earningsTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  earningsLabel: { color: '#a0a0b0', fontSize: 15 },
  earningsValue: { color: '#fff', fontSize: 15 },
  divider: { height: 1, backgroundColor: '#3b3b4f', marginVertical: 15 },
  totalLabel: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  totalValue: { color: '#f72585', fontSize: 18, fontWeight: 'bold' },
  helpBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#3b3b4f' },
  helpText: { color: '#f72585', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
});

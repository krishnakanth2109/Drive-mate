import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PowerPassScreen() {
  const benefits = [
    'No Surge Pricing during peak hours',
    'Flat ₹30 off on 10 rides',
    'Priority customer support',
    'Zero cancellation fees',
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <Ionicons name="flash" size={60} color="#f7bc00" />
        <Text style={styles.heroTitle}>Power Pass</Text>
        <Text style={styles.heroSub}>Supercharge your daily commutes</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.planHeader}>
          <Text style={styles.planName}>Monthly Plan</Text>
          <Text style={styles.planPrice}>₹149<Text style={styles.planDuration}>/mo</Text></Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.benefitsTitle}>What you get:</Text>
        {benefits.map((benefit, index) => (
          <View key={index} style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={24} color="#4cc9f0" />
            <Text style={styles.benefitText}>{benefit}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.buyBtn}>
          <Text style={styles.buyText}>Buy Power Pass</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  hero: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginTop: 10,
    letterSpacing: 1,
  },
  heroSub: {
    fontSize: 16,
    color: '#a0a0b0',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 20,
    padding: 24,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '900',
    color: '#f72585',
  },
  planDuration: {
    fontSize: 14,
    color: '#888',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 20,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#555',
    marginBottom: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  buyBtn: {
    backgroundColor: '#3b5998',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});

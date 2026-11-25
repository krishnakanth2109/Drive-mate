import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function TermsScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Terms & Conditions</Text>

      <Text style={styles.section}>1. Acceptance of Terms</Text>
      <Text style={styles.body}>
        By using this application, you agree to be bound by these Terms and Conditions. Please read them carefully before using our services.
      </Text>

      <Text style={styles.section}>2. Use of Service</Text>
      <Text style={styles.body}>
        Our ride service connects riders with customers. As a rider, you agree to provide safe, professional, and timely service to all customers.
      </Text>

      <Text style={styles.section}>3. Rider Responsibilities</Text>
      <Text style={styles.body}>
        - Maintain a valid driving license at all times.{'\n'}
        - Keep your vehicle in good working condition.{'\n'}
        - Follow all traffic rules and regulations.{'\n'}
        - Treat customers with respect and professionalism.
      </Text>

      <Text style={styles.section}>4. Payments & Earnings</Text>
      <Text style={styles.body}>
        Fare calculations are based on distance and duration. Payments will be processed as per the agreed schedule. The platform may deduct a service fee from each ride.
      </Text>

      <Text style={styles.section}>5. Termination</Text>
      <Text style={styles.body}>
        We reserve the right to suspend or terminate your account if you violate these terms or engage in fraudulent or unsafe behaviour.
      </Text>

      <Text style={styles.section}>6. Changes to Terms</Text>
      <Text style={styles.body}>
        We may update these terms from time to time. Continued use of the app after changes constitutes your acceptance of the new terms.
      </Text>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#111' },
  section: { fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 6, color: '#333' },
  body: { fontSize: 14, color: '#555', lineHeight: 22 },
});

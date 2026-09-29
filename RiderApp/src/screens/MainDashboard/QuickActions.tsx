import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

type Props = {
  navigation: StackNavigationProp<any, 'QuickActions'>;
};

const actions = [
  { id: '1', title: 'Start Duty', icon: 'power', color: '#4CAF50', route: 'DashboardRoot' },
  { id: '2', title: 'Earnings', icon: 'wallet', color: '#f72585', route: 'MyEarnings' },
  { id: '3', title: 'Support', icon: 'headset', color: '#FF9800', route: 'HelpSupport' },
  { id: '4', title: 'Navigation', icon: 'navigate', color: '#2196F3', route: 'DashboardRoot' },
  { id: '5', title: 'Settings', icon: 'settings', color: '#9C27B0', route: 'AppSettings' },
  { id: '6', title: 'Documents', icon: 'document-text', color: '#607D8B', route: 'MyDocuments' },
];

export default function QuickActionsScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quick Actions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {actions.map((action) => (
            <TouchableOpacity 
              key={action.id} 
              style={styles.actionCard}
              onPress={() => {
                if (action.route) {
                  navigation.navigate(action.route);
                }
              }}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${action.color}20` }]}>
                <Ionicons name={action.icon as any} size={32} color={action.color} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.promoCard}>
          <Ionicons name="star" size={24} color="#FFD700" style={{ marginBottom: 10 }} />
          <Text style={styles.promoTitle}>Drive more, earn more!</Text>
          <Text style={styles.promoSubtitle}>Complete 10 rides today to earn a ₹500 bonus.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E2C',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#2a2a3c',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#1E1E2C',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#2a2a3c',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  actionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  promoCard: {
    backgroundColor: '#2a2a3c',
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#f72585',
  },
  promoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  promoSubtitle: {
    color: '#a0a0b0',
    fontSize: 14,
    lineHeight: 20,
  },
});

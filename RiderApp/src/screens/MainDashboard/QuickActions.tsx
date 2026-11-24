import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { riderService } from '../../services/riderService';
import { RiderIncentivesData } from '../../services/types';

type Props = {
  navigation: StackNavigationProp<any, 'QuickActions'>;
};

const actions = [
  { id: '1', title: 'Start Duty', icon: 'power', color: '#4CAF50', route: 'MainTabs' },
  { id: '2', title: 'Wallet & Payouts', icon: 'wallet', color: '#f72585', route: 'Wallet' },
  { id: '3', title: 'Earnings Report', icon: 'bar-chart', color: '#06d6a0', route: 'Earnings' },
  { id: '4', title: 'Trip History', icon: 'time', color: '#2196F3', route: 'History' },
  { id: '5', title: 'Help & Support', icon: 'headset', color: '#FF9800', route: 'Support' },
  { id: '6', title: 'My Vehicle', icon: 'car-sport', color: '#9C27B0', route: 'Vehicle' },
  { id: '7', title: 'Documents', icon: 'document-text', color: '#607D8B', route: 'Documents' },
  { id: '8', title: 'App Settings', icon: 'settings', color: '#E91E63', route: 'Settings' },
  { id: '9', title: 'Notifications', icon: 'notifications', color: '#FF5722', route: 'Notifications' },
  { id: '10', title: 'Offers & Promos', icon: 'gift', color: '#00BCD4', route: 'Offers' },
  { id: '11', title: 'Incentives', icon: 'trophy', color: '#FFC107', route: 'Incentives' },
  { id: '12', title: 'Outstation', icon: 'map', color: '#8BC34A', route: 'OutstationOptIn' },
  { id: '13', title: 'Go To Area', icon: 'navigate-circle', color: '#f72585', route: 'GoToArea' },
  { id: '14', title: 'Performance', icon: 'ribbon', color: '#FFD700', route: 'Performance' },
];

export default function QuickActionsScreen({ navigation }: Props) {
  const [incentives, setIncentives] = useState<RiderIncentivesData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIncentives = async () => {
    try {
      const data = await riderService.getIncentives();
      setIncentives(data);
    } catch (err) {
      console.log('Failed to fetch incentives in quick actions:', err);
    }
  };

  useEffect(() => {
    fetchIncentives();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchIncentives();
    setRefreshing(false);
  };

  const topTarget = incentives?.targets?.[0] || incentives?.incentives?.[0];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quick Actions & Hub</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
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
                <Ionicons name={action.icon as any} size={28} color={action.color} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Live Daily Target / Incentive banner */}
        <View style={styles.promoCard}>
          <View style={styles.promoHeaderRow}>
            <Ionicons name="star" size={22} color="#FFD700" />
            <Text style={styles.promoBadge}>
              {incentives?.tier ? `${incentives.tier} Partner` : 'Active Bonus'}
            </Text>
          </View>
          <Text style={styles.promoTitle}>
            {topTarget ? topTarget.title : 'Drive more, earn more!'}
          </Text>
          <Text style={styles.promoSubtitle}>
            {topTarget
              ? `${topTarget.description} • Progress: ${topTarget.progress}/${topTarget.target}`
              : 'Complete target trips to earn instant wallet payouts and bonuses.'}
          </Text>
          {topTarget && (
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, Math.round(((topTarget.progress || 0) / (topTarget.target || 1)) * 100))}%` }
                ]}
              />
            </View>
          )}
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
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
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  promoCard: {
    backgroundColor: '#2a2a3c',
    borderRadius: 16,
    padding: 18,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#f72585',
  },
  promoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  promoBadge: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  promoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  promoSubtitle: {
    color: '#a0a0b0',
    fontSize: 13,
    lineHeight: 18,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#1E1E2C',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#06d6a0',
    borderRadius: 3,
  },
});

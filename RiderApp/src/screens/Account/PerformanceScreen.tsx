import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../../context/ToastContext';

const { width } = Dimensions.get('window');

interface MetricCardProps {
  label: string;
  value: string;
  benchmark: string;
  status: 'excellent' | 'good' | 'warning';
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  benchmark,
  status,
  icon,
  color,
}) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'excellent':
        return { bg: '#ecfdf5', text: '#059669', label: 'Superior' };
      case 'good':
        return { bg: '#eff6ff', text: '#2563eb', label: 'Good' };
      case 'warning':
        return { bg: '#fffbeb', text: '#d97706', label: 'Attention' };
    }
  };

  const badge = getBadgeStyle();

  return (
    <View style={styles.metricCard}>
      <View style={styles.metricCardHeader}>
        <View style={[styles.metricIconWrap, { backgroundColor: `${color}18` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
        </View>
      </View>

      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>

      <View style={styles.benchmarkRow}>
        <Ionicons name="checkmark-circle-outline" size={12} color="#94a3b8" />
        <Text style={styles.benchmarkText}>Target: {benchmark}</Text>
      </View>
    </View>
  );
};

export default function PerformanceScreen({ navigation }: any) {
  const { showToast } = useToast();
  const [selectedDay, setSelectedDay] = useState<string>('Fri');

  const weeklyData = [
    { day: 'Mon', rides: 8, earnings: 1240, height: 48 },
    { day: 'Tue', rides: 10, earnings: 1580, height: 60 },
    { day: 'Wed', rides: 7, earnings: 1120, height: 42 },
    { day: 'Thu', rides: 11, earnings: 1850, height: 70 },
    { day: 'Fri', rides: 14, earnings: 2320, height: 90 },
    { day: 'Sat', rides: 15, earnings: 2640, height: 100 },
    { day: 'Sun', rides: 12, earnings: 1950, height: 76 },
  ];

  const compliments = [
    { id: '1', title: 'Smooth & Safe Driving', count: 48, icon: 'shield-checkmark', color: '#10b981' },
    { id: '2', title: 'Courteous & Polite', count: 41, icon: 'happy', color: '#3b82f6' },
    { id: '3', title: 'Quick & Punctual Pickup', count: 35, icon: 'flash', color: '#f59e0b' },
    { id: '4', title: 'Clean & Fresh Vehicle', count: 29, icon: 'sparkles', color: '#8b5cf6' },
  ];

  const badges = [
    { id: 'b1', name: 'Top Rated Star', desc: 'Maintained 4.8+ rating for 60 days', icon: 'trophy', color: '#FFD700' },
    { id: 'b2', name: 'Speedy Accepter', desc: 'Acceptance rate consistently above 95%', icon: 'rocket', color: '#00f2fe' },
    { id: 'b3', name: 'Night Owl', desc: 'Completed 50+ late night shifts safely', icon: 'moon', color: '#f72585' },
    { id: 'b4', name: 'Century Club', desc: '100+ rides with 0 customer disputes', icon: 'ribbon', color: '#10b981' },
  ];

  const handleSharePerformance = () => {
    showToast({
      title: 'Performance Report Ready',
      message: 'Weekly summary exported to documents successfully.',
      type: 'success',
    });
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header with Navigation Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityLabel="Back to previous screen"
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Driver Performance</Text>
          <Text style={styles.headerSub}>Quality Score & Analytics</Text>
        </View>
        <TouchableOpacity
          onPress={handleSharePerformance}
          style={styles.shareBtn}
          activeOpacity={0.7}
          accessibilityLabel="Share Performance"
        >
          <Ionicons name="share-social-outline" size={20} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall Quality Score Hero Card */}
        <View style={styles.scoreHeroCard}>
          <View style={styles.scoreRow}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNumber}>4.92</Text>
              <View style={styles.starsRow}>
                <Ionicons name="star" size={13} color="#FFD700" />
                <Ionicons name="star" size={13} color="#FFD700" />
                <Ionicons name="star" size={13} color="#FFD700" />
                <Ionicons name="star" size={13} color="#FFD700" />
                <Ionicons name="star" size={13} color="#FFD700" />
              </View>
            </View>

            <View style={styles.scoreMeta}>
              <View style={styles.tierPill}>
                <Ionicons name="shield-checkmark" size={12} color="#f72585" />
                <Text style={styles.tierPillText}>GOLD DRIVER TIER</Text>
              </View>
              <Text style={styles.tierTitle}>Top 5% Partner</Text>
              <Text style={styles.tierSub}>
                Your exceptional reliability qualifies you for prioritized ride dispatch & 0% commission weekends.
              </Text>
            </View>
          </View>
        </View>

        {/* 6-Core Metrics Grid */}
        <Text style={styles.sectionHeader}>Key Performance Indicators</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            label="Acceptance Rate"
            value="98.4%"
            benchmark="≥ 85%"
            status="excellent"
            icon="checkmark-done-circle"
            color="#10b981"
          />
          <MetricCard
            label="Cancellation Rate"
            value="1.2%"
            benchmark="≤ 5.0%"
            status="excellent"
            icon="close-circle"
            color="#06d6a0"
          />
          <MetricCard
            label="On-Time Arrival"
            value="97.8%"
            benchmark="≥ 90%"
            status="excellent"
            icon="time"
            color="#3b82f6"
          />
          <MetricCard
            label="Customer Rating"
            value="4.92 ★"
            benchmark="≥ 4.70"
            status="excellent"
            icon="star"
            color="#f59e0b"
          />
          <MetricCard
            label="Trip Completion"
            value="99.1%"
            benchmark="≥ 95%"
            status="excellent"
            icon="flag"
            color="#8b5cf6"
          />
          <MetricCard
            label="Safety Compliance"
            value="100%"
            benchmark="100%"
            status="excellent"
            icon="shield-checkmark"
            color="#f72585"
          />
        </View>

        {/* Weekly Activity Trends Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeaderRow}>
            <View>
              <Text style={styles.chartCardTitle}>Weekly Activity Rhythm</Text>
              <Text style={styles.chartCardSub}>77 Total Rides • ₹12,700 Earned</Text>
            </View>
            <View style={styles.chartWeekPill}>
              <Text style={styles.chartWeekText}>This Week</Text>
            </View>
          </View>

          <View style={styles.barsContainer}>
            {weeklyData.map((item) => {
              const isSelected = selectedDay === item.day;
              return (
                <TouchableOpacity
                  key={item.day}
                  style={styles.barColumn}
                  onPress={() => setSelectedDay(item.day)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.barValText, isSelected && { color: '#f72585', fontWeight: '800' }]}>
                    {item.rides}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: item.height },
                        isSelected && { backgroundColor: '#f72585' },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.barDayText,
                      isSelected && { color: '#f72585', fontWeight: '700' },
                    ]}
                  >
                    {item.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Day Highlight Card */}
          {(() => {
            const dayObj = weeklyData.find((w) => w.day === selectedDay);
            if (!dayObj) return null;
            return (
              <View style={styles.dayHighlightRow}>
                <Ionicons name="information-circle" size={16} color="#f72585" />
                <Text style={styles.dayHighlightText}>
                  {dayObj.day}: Completed <Text style={{ fontWeight: '700', color: '#111827' }}>{dayObj.rides} rides</Text> earning <Text style={{ fontWeight: '700', color: '#10b981' }}>₹{dayObj.earnings}</Text>
                </Text>
              </View>
            );
          })()}
        </View>

        {/* Customer Compliments */}
        <Text style={styles.sectionHeader}>Customer Compliments</Text>
        <View style={styles.complimentsGrid}>
          {compliments.map((c) => (
            <View key={c.id} style={styles.complimentCard}>
              <View style={[styles.complimentIconWrap, { backgroundColor: `${c.color}15` }]}>
                <Ionicons name={c.icon as any} size={22} color={c.color} />
              </View>
              <Text style={styles.complimentCount}>+{c.count}</Text>
              <Text style={styles.complimentTitle}>{c.title}</Text>
            </View>
          ))}
        </View>

        {/* Earned Badges */}
        <Text style={styles.sectionHeader}>Unlocked Driver Badges</Text>
        <View style={styles.badgesList}>
          {badges.map((b) => (
            <View key={b.id} style={styles.badgeRow}>
              <View style={[styles.badgeIconWrap, { backgroundColor: `${b.color}20` }]}>
                <Ionicons name={b.icon as any} size={22} color={b.color} />
              </View>
              <View style={styles.badgeTextWrap}>
                <Text style={styles.badgeName}>{b.name}</Text>
                <Text style={styles.badgeDesc}>{b.desc}</Text>
              </View>
              <View style={styles.unlockedTag}>
                <Ionicons name="checkmark-done" size={14} color="#10b981" />
              </View>
            </View>
          ))}
        </View>

        {/* Pro Tips Section */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeaderRow}>
            <Ionicons name="bulb-outline" size={20} color="#f59e0b" />
            <Text style={styles.tipsTitle}>Tips to Maintain Gold Tier</Text>
          </View>
          <Text style={styles.tipText}>• Accept incoming rides within 15 seconds to maximize matching priority.</Text>
          <Text style={styles.tipText}>• Turn on "Destination Mode" / Go To Area when heading back home to avoid faraway pickups.</Text>
          <Text style={styles.tipText}>• Maintain a warm greeting and confirm customer name prior to starting the trip.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  scoreHeroCard: {
    backgroundColor: '#1E1E2C',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#2a2a3e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#f72585',
  },
  scoreNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 3,
  },
  scoreMeta: {
    flex: 1,
    marginLeft: 16,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(247, 37, 133, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    marginBottom: 4,
  },
  tierPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f72585',
    letterSpacing: 0.6,
  },
  tierTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  tierSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 6,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 22,
  },
  metricCard: {
    width: (width - 44) / 2,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metricIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  benchmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  benchmarkText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  chartCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 22,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chartCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  chartCardSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  chartWeekPill: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chartWeekText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingTop: 10,
    paddingBottom: 4,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barValText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 6,
  },
  barTrack: {
    height: 100,
    width: 14,
    backgroundColor: '#e2e8f0',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 7,
  },
  barDayText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 6,
  },
  dayHighlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  dayHighlightText: {
    fontSize: 12,
    color: '#475569',
  },
  complimentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
  },
  complimentCard: {
    width: (width - 42) / 2,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  complimentIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  complimentCount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  complimentTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    marginTop: 2,
  },
  badgesList: {
    gap: 10,
    marginBottom: 22,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  badgeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeTextWrap: {
    flex: 1,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  badgeDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  unlockedTag: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  tipsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
  },
  tipText: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 18,
    marginBottom: 4,
  },
});

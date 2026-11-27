import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SurgeStatus } from '../../../context/CustomerContext';

interface Props {
  visible: boolean;
  surgeStatus: SurgeStatus | null;
  onClose: () => void;
  onRefresh: () => void;
}

export default function SurgeBreakdownModal({
  visible,
  surgeStatus,
  onClose,
  onRefresh,
}: Props) {
  const multiplier = surgeStatus?.multiplier ?? 1.0;
  const isSurgeActive = Boolean(surgeStatus?.isSurgeActive && multiplier > 1.04);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header Hero */}
          <View style={styles.heroRow}>
            <View style={[styles.heroIcon, isSurgeActive ? styles.heroIconHot : styles.heroIconCool]}>
              <Ionicons
                name={isSurgeActive ? 'flame' : 'checkmark-circle'}
                size={24}
                color={isSurgeActive ? '#f72585' : '#10b981'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>
                  {isSurgeActive ? `Traffic Surge Active (${multiplier.toFixed(1)}x)` : 'Normal Fares Active (1.0x)'}
                </Text>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                  <Ionicons name="refresh" size={16} color="#64748b" />
                </TouchableOpacity>
              </View>
              <Text style={styles.subtitle}>
                {surgeStatus?.reason || 'Fares adapt in real time based on passenger demand and road congestion.'}
              </Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
            {/* 3 Telemetry Metrics */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricBox}>
                <Ionicons name="people" size={18} color="#f72585" />
                <Text style={styles.metricValue}>{surgeStatus?.activeRequestsNearby ?? 0}</Text>
                <Text style={styles.metricLabel}>User Requests</Text>
              </View>
              <View style={styles.metricBox}>
                <Ionicons name="bicycle" size={18} color="#10b981" />
                <Text style={styles.metricValue}>{surgeStatus?.availableDriversNearby ?? 0}</Text>
                <Text style={styles.metricLabel}>Captains Nearby</Text>
              </View>
              <View style={styles.metricBox}>
                <Ionicons name="speedometer" size={18} color="#f59e0b" />
                <Text style={styles.metricValue}>{surgeStatus?.trafficLevel || 'Smooth'}</Text>
                <Text style={styles.metricLabel}>
                  {(surgeStatus?.trafficDelayMinutes || 0) > 0
                    ? `+${surgeStatus?.trafficDelayMinutes}m delay`
                    : `${surgeStatus?.trafficSpeedKmh || 25} km/h avg`}
                </Text>
              </View>
            </View>

            {/* Formula Breakdown */}
            <View style={styles.breakdownCard}>
              <Text style={styles.sectionTitle}>HOW THIS MULTIPLIER IS CALCULATED</Text>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Standard Base Rate</Text>
                <Text style={styles.breakdownValue}>1.0x</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Passenger Traffic vs. Supply</Text>
                <Text style={[styles.breakdownValue, (surgeStatus?.breakdown?.demandSurcharge || 0) > 0 && styles.hotVal]}>
                  +{(surgeStatus?.breakdown?.demandSurcharge ?? 0).toFixed(2)}x
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Road Traffic Congestion</Text>
                <Text style={[styles.breakdownValue, (surgeStatus?.breakdown?.trafficSurcharge || 0) > 0 && styles.hotVal]}>
                  +{(surgeStatus?.breakdown?.trafficSurcharge ?? 0).toFixed(2)}x
                </Text>
              </View>
              {(surgeStatus?.breakdown?.peakSurcharge || 0) > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{surgeStatus?.peakLabel || 'Peak Commute Window'}</Text>
                  <Text style={[styles.breakdownValue, styles.hotVal]}>
                    +{(surgeStatus?.breakdown?.peakSurcharge ?? 0).toFixed(2)}x
                  </Text>
                </View>
              )}
              {surgeStatus?.breakdown?.matchedZoneName && surgeStatus?.breakdown?.zoneOverrideMultiplier && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>
                    Zone Demand ({surgeStatus.breakdown.matchedZoneName})
                  </Text>
                  <Text style={[styles.breakdownValue, styles.hotVal]}>
                    {surgeStatus.breakdown.zoneOverrideMultiplier.toFixed(1)}x min
                  </Text>
                </View>
              )}

              <View style={[styles.breakdownRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Applied Multiplier (capped at 2.5x)</Text>
                <Text style={styles.totalValue}>{multiplier.toFixed(1)}x</Text>
              </View>
            </View>

            {/* City Demand Hotspots */}
            {surgeStatus?.hotZones && surgeStatus.hotZones.length > 0 && (
              <View style={styles.zonesSection}>
                <Text style={styles.sectionTitle}>LIVE CITY TRAFFIC & DEMAND ZONES</Text>
                {surgeStatus.hotZones.map((zone) => {
                  const zoneHot = zone.surgeMultiplier > 1.05;
                  return (
                    <View key={zone.id} style={styles.zoneItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.zoneName}>{zone.name}</Text>
                        <Text style={styles.zoneMeta}>
                          {zone.demandLevel} demand • {zone.activeDrivers} drivers • {zone.pendingRiders} waiting
                        </Text>
                      </View>
                      <View style={[styles.zoneBadge, zoneHot ? styles.zoneBadgeHot : styles.zoneBadgeNormal]}>
                        <Text style={[styles.zoneBadgeText, zoneHot ? styles.zoneBadgeTextHot : styles.zoneBadgeTextNormal]}>
                          {zone.surgeMultiplier.toFixed(1)}x
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Savings Tip */}
            <View style={styles.tipBox}>
              <Ionicons name="bulb-outline" size={18} color="#4361ee" />
              <Text style={styles.tipText}>
                {isSurgeActive
                  ? 'Tip: Bike & Scooty rides bypass heavy congestion fastest and keep total fare lowest during peak traffic.'
                  : 'Great time to ride! Traffic is flowing smoothly with zero dynamic surge.'}
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>Got It</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 22,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconHot: {
    backgroundColor: 'rgba(247, 37, 133, 0.12)',
  },
  heroIconCool: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  refreshBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 3,
    lineHeight: 18,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 6,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  breakdownCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  breakdownValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700',
  },
  hotVal: {
    color: '#f72585',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 6,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#f72585',
  },
  zonesSection: {
    marginBottom: 14,
  },
  zoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 8,
  },
  zoneName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  zoneMeta: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
  },
  zoneBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  zoneBadgeHot: {
    backgroundColor: 'rgba(247, 37, 133, 0.12)',
  },
  zoneBadgeNormal: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  zoneBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  zoneBadgeTextHot: {
    color: '#f72585',
  },
  zoneBadgeTextNormal: {
    color: '#059669',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
    marginBottom: 14,
  },
  tipText: {
    flex: 1,
    fontSize: 12.5,
    color: '#1e3a8a',
    fontWeight: '600',
    lineHeight: 17,
  },
  doneBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});

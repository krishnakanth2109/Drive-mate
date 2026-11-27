import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GeofenceClientEvaluation, GEOFENCE_RADIUS_METERS } from '../utils/geofence';

interface Props {
  mode: 'pickup' | 'drop';
  evaluation: GeofenceClientEvaluation;
  isSubmitting: boolean;
  onPressArrive: () => void;
  onRefreshGps: () => void;
  variant?: 'light' | 'dark';
}

export default function GeofenceArrivalCard({
  mode,
  evaluation,
  isSubmitting,
  onPressArrive,
  onRefreshGps,
  variant = 'light',
}: Props) {
  const isDark = variant === 'dark';
  const hasGpsIssue =
    evaluation.isGpsUnavailable ||
    evaluation.isPermissionDenied ||
    evaluation.isServicesDisabled ||
    evaluation.isPoorAccuracy ||
    evaluation.isStaleLocation ||
    evaluation.isMockedLocation;

  const isUnlocked = evaluation.canDeclareArrival && !isSubmitting;
  const buttonLabel = mode === 'pickup' ? "I've Arrived" : 'Reached Drop Location';

  const statusTone = hasGpsIssue
    ? 'warning'
    : evaluation.isWithinRadius
    ? 'ready'
    : 'approaching';

  return (
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      {/* Top Row: Live Distance + Accuracy Badge + Refresh */}
      <View style={styles.topRow}>
        <View style={styles.distanceGroup}>
          <View
            style={[
              styles.radarIconBox,
              statusTone === 'ready'
                ? styles.radarReady
                : statusTone === 'warning'
                ? styles.radarWarning
                : styles.radarApproaching,
            ]}
          >
            <Ionicons
              name={
                statusTone === 'ready'
                  ? 'checkmark-circle'
                  : statusTone === 'warning'
                  ? 'warning'
                  : 'navigate'
              }
              size={18}
              color={
                statusTone === 'ready'
                  ? '#10b981'
                  : statusTone === 'warning'
                  ? '#f59e0b'
                  : '#3b82f6'
              }
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.distanceText, isDark && { color: '#ffffff' }]}>
              {evaluation.distanceLabel}
            </Text>
            <Text style={[styles.radiusTargetText, isDark && { color: '#94a3b8' }]}>
              {mode === 'pickup' ? 'Pickup' : 'Drop'} geofence: {GEOFENCE_RADIUS_METERS}m radius
            </Text>
          </View>
        </View>

        <View style={styles.rightMeta}>
          {evaluation.accuracyMeters != null && (
            <View
              style={[
                styles.gpsPill,
                evaluation.isPoorAccuracy
                  ? styles.gpsPillBad
                  : isDark
                  ? styles.gpsPillDark
                  : styles.gpsPillGood,
              ]}
            >
              <Text
                style={[
                  styles.gpsPillText,
                  evaluation.isPoorAccuracy && { color: '#dc2626' },
                ]}
              >
                GPS ±{Math.round(evaluation.accuracyMeters)}m
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.refreshBtn, isDark && styles.refreshBtnDark]}
            onPress={onRefreshGps}
            activeOpacity={0.75}
            accessibilityLabel="Refresh live GPS signal"
          >
            <Ionicons name="refresh" size={15} color={isDark ? '#e2e8f0' : '#334155'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Guidance Strip */}
      <View
        style={[
          styles.banner,
          statusTone === 'ready'
            ? styles.bannerReady
            : statusTone === 'warning'
            ? styles.bannerWarning
            : isDark
            ? styles.bannerApproachingDark
            : styles.bannerApproachingLight,
        ]}
      >
        <Text
          style={[
            styles.bannerText,
            statusTone === 'ready'
              ? styles.bannerTextReady
              : statusTone === 'warning'
              ? styles.bannerTextWarning
              : isDark
              ? { color: '#cbd5e1' }
              : { color: '#334155' },
          ]}
        >
          {evaluation.statusMessage}
        </Text>
      </View>

      {/* Explicit Geofence-Gated Arrival Button */}
      <TouchableOpacity
        style={[
          styles.arriveBtn,
          isUnlocked
            ? mode === 'pickup'
              ? styles.arriveBtnPickupActive
              : styles.arriveBtnDropActive
            : isDark
            ? styles.arriveBtnDisabledDark
            : styles.arriveBtnDisabledLight,
        ]}
        onPress={onPressArrive}
        disabled={!isUnlocked}
        activeOpacity={0.85}
        accessibilityState={{ disabled: !isUnlocked }}
      >
        {isSubmitting ? (
          <View style={styles.btnContent}>
            <ActivityIndicator color="#ffffff" size="small" />
            <Text style={styles.arriveBtnText}>Verifying 50m Geofence...</Text>
          </View>
        ) : (
          <View style={styles.btnContent}>
            <Ionicons
              name={isUnlocked ? 'checkmark-done-circle' : 'lock-closed'}
              size={19}
              color={isUnlocked ? '#ffffff' : isDark ? '#64748b' : '#94a3b8'}
            />
            <Text
              style={[
                styles.arriveBtnText,
                !isUnlocked && (isDark ? { color: '#64748b' } : { color: '#64748b' }),
              ]}
            >
              {buttonLabel}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  containerLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  containerDark: {
    backgroundColor: '#252538',
    borderColor: '#373752',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  distanceGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  radarIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarReady: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  radarWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
  },
  radarApproaching: {
    backgroundColor: 'rgba(59, 130, 246, 0.14)',
  },
  distanceText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  radiusTargetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 1,
  },
  rightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gpsPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gpsPillGood: {
    backgroundColor: '#ecfdf5',
  },
  gpsPillDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  gpsPillBad: {
    backgroundColor: '#fef2f2',
  },
  gpsPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#059669',
  },
  refreshBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtnDark: {
    backgroundColor: '#34344e',
  },
  banner: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 10,
  },
  bannerReady: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
  },
  bannerWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
  },
  bannerApproachingLight: {
    backgroundColor: '#e2e8f0',
  },
  bannerApproachingDark: {
    backgroundColor: '#2f2f46',
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  bannerTextReady: {
    color: '#10b981',
  },
  bannerTextWarning: {
    color: '#d97706',
  },
  arriveBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arriveBtnPickupActive: {
    backgroundColor: '#10b981',
  },
  arriveBtnDropActive: {
    backgroundColor: '#f72585',
  },
  arriveBtnDisabledLight: {
    backgroundColor: '#e2e8f0',
  },
  arriveBtnDisabledDark: {
    backgroundColor: '#34344e',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arriveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});

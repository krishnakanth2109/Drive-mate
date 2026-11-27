import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SurgeStatus } from '../../../context/CustomerContext';

interface Props {
  firstName: string;
  initialLetter: string;
  walletBalance: number;
  currentAddress: string | null;
  surgeStatus: SurgeStatus | null;
  isLoadingSurge: boolean;
  nearbyDriversCount: number;
  showTraffic: boolean;
  onToggleTraffic: () => void;
  onOpenSurgeModal: () => void;
  onOpenWallet: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function HomeHeader({
  firstName,
  initialLetter,
  walletBalance,
  currentAddress,
  surgeStatus,
  isLoadingSurge,
  nearbyDriversCount,
  showTraffic,
  onToggleTraffic,
  onOpenSurgeModal,
  onOpenWallet,
  onOpenNotifications,
  onOpenProfile,
}: Props) {
  const isSurgeActive = Boolean(surgeStatus?.isSurgeActive && (surgeStatus?.multiplier || 1) > 1.04);
  const multiplierLabel = `${Number(surgeStatus?.multiplier || 1.0).toFixed(1)}x`;
  const driversCount = surgeStatus?.availableDriversNearby ?? nearbyDriversCount;
  const locality = currentAddress ? currentAddress.split(',')[0].trim() : 'Detecting GPS...';

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* Row 1: Brand + Greeting + Action Pills */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.brandGreetingCard}
          onPress={onOpenSurgeModal}
          activeOpacity={0.85}
        >
          <View style={styles.brandIconWrap}>
            <Ionicons name="car-sport" size={16} color="#ffffff" />
          </View>
          <View style={styles.greetingCol}>
            <Text style={styles.greetingText} numberOfLines={1}>
              {getGreeting()}, {firstName}
            </Text>
            <View style={styles.locationMicroRow}>
              <View style={styles.liveDot} />
              <Text style={styles.localityText} numberOfLines={1}>
                {locality}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.rightActions}>
          {/* Wallet Pill */}
          <TouchableOpacity
            style={styles.walletPill}
            onPress={onOpenWallet}
            activeOpacity={0.85}
            accessibilityLabel="Open Wallet"
          >
            <Ionicons name="wallet" size={14} color="#f72585" />
            <Text style={styles.walletText}>₹{Math.max(0, walletBalance).toFixed(0)}</Text>
          </TouchableOpacity>

          {/* Notifications Button */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onOpenNotifications}
            activeOpacity={0.85}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={18} color="#111827" />
          </TouchableOpacity>

          {/* Avatar Button */}
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={onOpenProfile}
            activeOpacity={0.85}
            accessibilityLabel="Open Profile"
          >
            <Text style={styles.avatarLetter}>{initialLetter}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Row 2: Live User Traffic & Surge Telemetry Pill + Traffic Map Layer Toggle */}
      <View style={styles.telemetryRow}>
        <TouchableOpacity
          style={[
            styles.surgePill,
            isSurgeActive ? styles.surgePillHot : styles.surgePillNormal,
          ]}
          onPress={onOpenSurgeModal}
          activeOpacity={0.85}
        >
          {isLoadingSurge && !surgeStatus ? (
            <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 6 }} />
          ) : (
            <View style={[styles.surgeBadgeDot, isSurgeActive ? styles.dotHot : styles.dotCool]}>
              <Ionicons
                name={isSurgeActive ? 'flame' : 'pulse'}
                size={12}
                color={isSurgeActive ? '#fb7185' : '#34d399'}
              />
            </View>
          )}
          <Text style={styles.surgePillText} numberOfLines={1}>
            {isSurgeActive
              ? `${multiplierLabel} Surge • ${surgeStatus?.trafficLevel || 'High'} Traffic`
              : `${surgeStatus?.trafficLevel || 'Smooth'} Traffic • ${driversCount} nearby`}
          </Text>
          <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.75)" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.trafficToggleBtn, showTraffic && styles.trafficToggleActive]}
          onPress={onToggleTraffic}
          activeOpacity={0.85}
          accessibilityLabel="Toggle live map traffic layer"
        >
          <Ionicons
            name="layers"
            size={14}
            color={showTraffic ? '#ffffff' : '#1e293b'}
          />
          <Text style={[styles.trafficToggleText, showTraffic && { color: '#ffffff' }]}>
            Traffic
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 38,
    left: 14,
    right: 14,
    zIndex: 25,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  brandGreetingCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    gap: 9,
  },
  brandIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f72585',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingCol: {
    flex: 1,
  },
  greetingText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  locationMicroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  localityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    flex: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    gap: 4,
  },
  walletText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  surgePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 5,
  },
  surgePillNormal: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  surgePillHot: {
    backgroundColor: 'rgba(24, 15, 38, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(247, 37, 133, 0.55)',
  },
  surgeBadgeDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotHot: {
    backgroundColor: 'rgba(247, 37, 133, 0.22)',
  },
  dotCool: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  surgePillText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  trafficToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  trafficToggleActive: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
  },
  trafficToggleText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1e293b',
  },
});

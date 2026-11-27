import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SurgeStatus } from '../../../context/CustomerContext';

interface Props {
  surgeStatus: SurgeStatus | null;
  onPress: () => void;
}

export default function PromoBanner({ surgeStatus, onPress }: Props) {
  const isSurgeActive = Boolean(surgeStatus?.isSurgeActive && (surgeStatus?.multiplier || 1) > 1.04);
  const multiplier = surgeStatus?.multiplier ?? 1.0;

  if (isSurgeActive) {
    return (
      <TouchableOpacity style={styles.surgeBanner} onPress={onPress} activeOpacity={0.85}>
        <View style={styles.iconCircleHot}>
          <Ionicons name="flame" size={16} color="#f72585" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.titleHot}>
            {multiplier.toFixed(1)}x Peak User Traffic Surge
          </Text>
          <Text style={styles.subHot} numberOfLines={1}>
            {surgeStatus?.reason || 'High rider requests nearby • Tap for live breakdown'}
          </Text>
        </View>
        <View style={styles.badgeHot}>
          <Text style={styles.badgeHotText}>Why?</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.normalBanner} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.iconCircleCool}>
        <Ionicons name="flash" size={15} color="#059669" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.titleCool}>Zero Surge • Smooth Road Conditions</Text>
        <Text style={styles.subCool} numberOfLines={1}>
          {surgeStatus?.availableDriversNearby
            ? `${surgeStatus.availableDriversNearby} captains near you • Instant pickup`
            : 'Lowest base fares available right now'}
        </Text>
      </View>
      <Ionicons name="information-circle-outline" size={18} color="#059669" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  surgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f5',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 10,
  },
  iconCircleHot: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(247, 37, 133, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleHot: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#9f1239',
  },
  subHot: {
    fontSize: 11,
    color: '#be123c',
    fontWeight: '600',
    marginTop: 1,
  },
  badgeHot: {
    backgroundColor: '#f72585',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeHotText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  normalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
    gap: 10,
  },
  iconCircleCool: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCool: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#065f46',
  },
  subCool: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '600',
    marginTop: 1,
  },
});

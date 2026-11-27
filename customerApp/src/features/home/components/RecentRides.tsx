import React, { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { rideHistoryService } from '../../rides/services/rideHistoryService';

export interface QuickDestination {
  id: string;
  label: string;
  place: {
    lat: number;
    lng: number;
    name: string;
    address: string;
  };
}

interface Props {
  onSelectPlace: (place: QuickDestination['place']) => void;
}

export default function RecentRides({ onSelectPlace }: Props) {
  const [recentPlaces, setRecentPlaces] = useState<QuickDestination[]>([]);

  useEffect(() => {
    let active = true;
    rideHistoryService
      .getHistory({ limit: 8 })
      .then((res) => {
        if (!active || !Array.isArray(res?.rides)) return;
        const seen = new Set<string>();
        const unique: QuickDestination[] = [];
        for (const r of res.rides) {
          const addr = r.drop?.address || r.dropAddress;
          const lat = Number(r.drop?.lat ?? r.dropLat);
          const lng = Number(r.drop?.lng ?? r.dropLng);
          if (!addr || isNaN(lat) || isNaN(lng) || seen.has(addr)) continue;
          seen.add(addr);
          unique.push({
            id: r.id || r._id,
            label: (r.drop?.name || r.dropPlaceName || addr.split(',')[0]).slice(0, 22),
            place: {
              lat,
              lng,
              name: r.drop?.name || r.dropPlaceName || addr.split(',')[0],
              address: addr,
            },
          });
          if (unique.length >= 5) break;
        }
        setRecentPlaces(unique);
      })
      .catch(() => {
        if (active) setRecentPlaces([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (recentPlaces.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {recentPlaces.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.chip}
          onPress={() => onSelectPlace(item.place)}
          activeOpacity={0.78}
        >
          <View style={[styles.iconWrap, { backgroundColor: '#eef2ff' }]}>
            <Ionicons name="time" size={13} color="#4361ee" />
          </View>
          <Text style={styles.label}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginBottom: 12,
  },
  content: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingLeft: 6,
    paddingRight: 11,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
});

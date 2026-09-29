import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type RideMapProps = {
  style?: any;
};

export default function RideMap({ style }: RideMapProps) {
  return (
    <View style={[styles.mapContainer, style]}>
      <View style={styles.placeholderGrid} />
      <Ionicons name="map" size={100} color="#ddd" />
      <View style={styles.pinOverlay}>
        <Ionicons name="location" size={40} color="#f72585" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  placeholderGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  pinOverlay: {
    position: 'absolute',
    top: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  }
});

import React from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PlaceAutocompleteInput from '../../../components/PlaceAutocompleteInput';

interface PlacePayload {
  name?: string;
  address: string;
  lat: number;
  lng: number;
}

interface Props {
  pickupText: string;
  dropText: string;
  isLocating: boolean;
  userLocationBias?: { lat: number; lng: number };
  onChangePickupText: (text: string) => void;
  onSelectPickup: (place: PlacePayload) => void;
  onClearPickup: () => void;
  onUseCurrentLocation: () => void;
  onPickPickupOnMap: () => void;
  onChangeDropText: (text: string) => void;
  onSelectDrop: (place: PlacePayload) => void;
  onClearDrop: () => void;
  onPickDropOnMap: () => void;
  onSwapLocations: () => void;
}

export default function DestinationInput({
  pickupText,
  dropText,
  isLocating,
  userLocationBias,
  onChangePickupText,
  onSelectPickup,
  onClearPickup,
  onUseCurrentLocation,
  onPickPickupOnMap,
  onChangeDropText,
  onSelectDrop,
  onClearDrop,
  onPickDropOnMap,
  onSwapLocations,
}: Props) {
  return (
    <View style={styles.card}>
      {/* Pickup Input */}
      <View style={[styles.rowWrap, { zIndex: 30 }]}>
        <PlaceAutocompleteInput
          placeholder="Pickup point"
          value={pickupText}
          dotColor="#10b981"
          dropdownDirection="up"
          userLocationBias={userLocationBias}
          inputRowStyle={styles.pickupInputRow}
          onChangeText={onChangePickupText}
          onSelect={onSelectPickup}
          onClear={onClearPickup}
          rightAction={
            <View style={styles.inlineActions}>
              <TouchableOpacity
                style={styles.miniActionBtn}
                onPress={onUseCurrentLocation}
                accessibilityLabel="Use current GPS location"
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color="#10b981" />
                ) : (
                  <Ionicons name="locate" size={17} color="#10b981" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.miniActionBtn}
                onPress={onPickPickupOnMap}
                accessibilityLabel="Pick pickup on map"
              >
                <Ionicons name="pin" size={16} color="#64748b" />
              </TouchableOpacity>
            </View>
          }
        />
      </View>

      {/* Connector Strip + Swap Pill */}
      <View style={styles.connectorRow}>
        <View style={styles.connectorDash} />
        <TouchableOpacity
          style={styles.swapPill}
          onPress={onSwapLocations}
          activeOpacity={0.75}
          accessibilityLabel="Swap pickup and destination"
        >
          <Ionicons name="swap-vertical" size={15} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {/* Destination Input */}
      <View style={[styles.rowWrap, { zIndex: 20 }]}>
        <PlaceAutocompleteInput
          placeholder="Where are you going?"
          value={dropText}
          dotColor="#f72585"
          dropdownDirection="up"
          userLocationBias={userLocationBias}
          inputRowStyle={styles.dropInputRow}
          onChangeText={onChangeDropText}
          onSelect={onSelectDrop}
          onClear={onClearDrop}
          rightAction={
            <TouchableOpacity
              style={styles.pinDropBtn}
              onPress={onPickDropOnMap}
              accessibilityLabel="Select destination using map pin"
            >
              <Ionicons name="map-outline" size={17} color="#f72585" />
            </TouchableOpacity>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    zIndex: 40,
  },
  rowWrap: {
    position: 'relative',
  },
  pickupInputRow: {
    height: 46,
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 14,
  },
  dropInputRow: {
    height: 48,
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 14,
  },
  inlineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  miniActionBtn: {
    padding: 6,
  },
  pinDropBtn: {
    padding: 6,
    backgroundColor: 'rgba(247, 37, 133, 0.08)',
    borderRadius: 10,
    marginLeft: 4,
  },
  connectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 14,
    paddingHorizontal: 14,
    zIndex: 50,
  },
  connectorDash: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  swapPill: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
});

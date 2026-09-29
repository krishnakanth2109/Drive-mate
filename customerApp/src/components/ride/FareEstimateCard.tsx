import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type FareEstimateCardProps = {
  vehicleType: string;
  eta: string;
  price: string;
  originalPrice?: string;
  selected?: boolean;
  onSelect?: () => void;
  imageUrl: string;
};

export default function FareEstimateCard({ vehicleType, eta, price, originalPrice, selected, onSelect, imageUrl }: FareEstimateCardProps) {
  return (
    <TouchableOpacity 
      style={[styles.container, selected && styles.selectedContainer]} 
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
      </View>
      
      <View style={styles.detailsContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.vehicleType}>{vehicleType}</Text>
          <View style={styles.etaBadge}>
            <Text style={styles.etaText}>{eta}</Text>
          </View>
        </View>
        
        <View style={styles.priceRow}>
          <Text style={styles.price}>{price}</Text>
          {originalPrice && (
            <Text style={styles.originalPrice}>{originalPrice}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.radioContainer}>
        <Ionicons 
          name={selected ? "radio-button-on" : "radio-button-off"} 
          size={24} 
          color={selected ? "#f72585" : "#ccc"} 
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedContainer: {
    borderColor: '#f72585',
    backgroundColor: '#fff0f6',
  },
  imageContainer: {
    width: 60,
    height: 60,
    marginRight: 16,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehicleType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  etaBadge: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  etaText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  radioContainer: {
    marginLeft: 16,
  },
});

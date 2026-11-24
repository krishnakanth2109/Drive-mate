import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '../../context/ToastContext';

export const GO_TO_AREA_STORAGE_KEY = '@drivemate_go_to_area_config';

export interface GoToAreaConfig {
  isActive: boolean;
  targetArea: string;
  category: string;
  radiusKm: number;
  activatedAt?: number;
  remainingUses: number;
}

const DEFAULT_AREAS = [
  { id: '1', name: 'Koramangala 5th Block', category: 'Commercial Hub', icon: 'business-outline', color: '#f72585' },
  { id: '2', name: 'Indiranagar 100ft Road', category: 'City Center', icon: 'cafe-outline', color: '#3b82f6' },
  { id: '3', name: 'Kempegowda Int’l Airport (BLR)', category: 'Airport Outstation', icon: 'airplane-outline', color: '#10b981' },
  { id: '4', name: 'Whitefield ITPL Corridor', category: 'Tech Park', icon: 'laptop-outline', color: '#8b5cf6' },
  { id: '5', name: 'HSR Layout Sector 4', category: 'Residential / Home', icon: 'home-outline', color: '#f59e0b' },
  { id: '6', name: 'Electronic City Phase 1', category: 'Industrial & Tech', icon: 'car-sport-outline', color: '#06d6a0' },
  { id: '7', name: 'Majestic City Railway Station', category: 'Transit Terminal', icon: 'train-outline', color: '#ec4899' },
];

export default function GoToAreaScreen({ navigation }: any) {
  const { showToast } = useToast();

  const [isActive, setIsActive] = useState<boolean>(false);
  const [selectedArea, setSelectedArea] = useState<string>('Indiranagar 100ft Road');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [remainingUses, setRemainingUses] = useState<number>(2);

  // Load persisted destination mode config
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(GO_TO_AREA_STORAGE_KEY);
        if (stored) {
          const parsed: GoToAreaConfig = JSON.parse(stored);
          setIsActive(parsed.isActive);
          setSelectedArea(parsed.targetArea || 'Indiranagar 100ft Road');
          setRadiusKm(parsed.radiusKm || 5);
          if (parsed.remainingUses !== undefined) {
            setRemainingUses(parsed.remainingUses);
          }
        }
      } catch (e) {
        console.log('Error reading Go To Area settings:', e);
      }
    })();
  }, []);

  const handleToggleActive = (val: boolean) => {
    if (val && remainingUses <= 0) {
      Alert.alert(
        'Daily Limit Reached',
        'You have used all 3 destination mode trips for today. Quota resets at 12:00 AM.'
      );
      return;
    }
    setIsActive(val);
  };

  const handleSelectArea = (areaName: string) => {
    setSelectedArea(areaName);
    setSearchQuery('');
  };

  const handleSaveAndApply = async () => {
    try {
      const newRemaining = isActive && !isActive ? remainingUses - 1 : remainingUses;
      const config: GoToAreaConfig = {
        isActive,
        targetArea: selectedArea,
        category: 'Corridor',
        radiusKm,
        activatedAt: isActive ? Date.now() : undefined,
        remainingUses: Math.max(0, newRemaining),
      };

      await AsyncStorage.setItem(GO_TO_AREA_STORAGE_KEY, JSON.stringify(config));

      if (isActive) {
        showToast({
          title: 'Destination Mode Activated',
          message: `Only rides heading towards ${selectedArea} (±${radiusKm}km) will be matched.`,
          type: 'success',
        });
      } else {
        showToast({
          title: 'Destination Mode Disabled',
          message: 'Now receiving normal ride requests across all city zones.',
          type: 'info',
        });
      }

      navigation.goBack();
    } catch (e) {
      showToast({
        title: 'Save Failed',
        message: 'Could not apply Go To Area preferences.',
        type: 'error',
      });
    }
  };

  const filteredAreas = DEFAULT_AREAS.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header with Navigation Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityLabel="Back to Dashboard"
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Go To Area</Text>
          <Text style={styles.headerSub}>Destination Corridor Filter</Text>
        </View>

        <View style={styles.quotaPill}>
          <Ionicons name="flash" size={12} color="#f72585" />
          <Text style={styles.quotaText}>{remainingUses}/3 Uses</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Destination Mode Master Toggle Card */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleTextWrap}>
            <View style={styles.toggleStatusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isActive ? '#10b981' : '#94a3b8' },
                ]}
              />
              <Text
                style={[
                  styles.toggleStatusTitle,
                  { color: isActive ? '#10b981' : '#64748b' },
                ]}
              >
                {isActive ? 'DESTINATION MODE ACTIVE' : 'DESTINATION MODE INACTIVE'}
              </Text>
            </View>
            <Text style={styles.toggleSub}>
              Filter ride requests along your route so you only pick up passengers heading towards your destination.
            </Text>
          </View>

          <Switch
            trackColor={{ false: '#cbd5e1', true: '#f72585' }}
            thumbColor="#ffffff"
            onValueChange={handleToggleActive}
            value={isActive}
          />
        </View>

        {/* Selected Destination Card */}
        <View style={styles.selectedDestinationCard}>
          <View style={styles.destinationIconWrap}>
            <Ionicons name="navigate-circle" size={28} color="#f72585" />
          </View>
          <View style={styles.destinationTextWrap}>
            <Text style={styles.destinationLabel}>CURRENT TARGET DESTINATION</Text>
            <Text style={styles.destinationName} numberOfLines={2}>
              {selectedArea}
            </Text>
            <Text style={styles.destinationRadius}>
              Corridor window: within {radiusKm} km of drop route
            </Text>
          </View>
        </View>

        {/* Corridor Radius Slider / Options */}
        <Text style={styles.sectionTitle}>Corridor Acceptance Radius</Text>
        <View style={styles.radiusRow}>
          {[3, 5, 8, 12].map((km) => {
            const isSelected = radiusKm === km;
            return (
              <TouchableOpacity
                key={km}
                style={[styles.radiusBtn, isSelected && styles.radiusBtnActive]}
                onPress={() => setRadiusKm(km)}
                activeOpacity={0.7}
              >
                <Text style={[styles.radiusBtnText, isSelected && styles.radiusBtnTextActive]}>
                  {km} km
                </Text>
                <Text style={[styles.radiusBtnSub, isSelected && styles.radiusBtnSubActive]}>
                  {km <= 3 ? 'Direct' : km <= 5 ? 'Balanced' : 'Wide'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Search Custom Area Input */}
        <Text style={styles.sectionTitle}>Select or Search Destination</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search custom area, metro, airport..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Areas List */}
        <View style={styles.areasList}>
          {filteredAreas.map((area) => {
            const isSelected = selectedArea === area.name;
            return (
              <TouchableOpacity
                key={area.id}
                style={[styles.areaRow, isSelected && styles.areaRowSelected]}
                onPress={() => handleSelectArea(area.name)}
                activeOpacity={0.7}
              >
                <View style={[styles.areaIconWrap, { backgroundColor: `${area.color}15` }]}>
                  <Ionicons name={area.icon as any} size={20} color={area.color} />
                </View>

                <View style={styles.areaInfoWrap}>
                  <Text style={[styles.areaName, isSelected && { color: '#f72585', fontWeight: '800' }]}>
                    {area.name}
                  </Text>
                  <Text style={styles.areaCategory}>{area.category}</Text>
                </View>

                {isSelected ? (
                  <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={16} color="#ffffff" />
                  </View>
                ) : (
                  <Ionicons name="radio-button-off" size={20} color="#cbd5e1" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Destination Mode Policy Box */}
        <View style={styles.policyCard}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#0284c7" />
          <Text style={styles.policyText}>
            You get 3 Go-To-Area uses per calendar day. Each active trip that takes you towards your destination counts as 1 use.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Save & Apply CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.applyBtn, !isActive && styles.applyBtnDisabled]}
          onPress={handleSaveAndApply}
          activeOpacity={0.8}
        >
          <Ionicons name={isActive ? "flash" : "checkmark-circle"} size={18} color="#ffffff" />
          <Text style={styles.applyBtnText}>
            {isActive ? `Apply Corridor Filter (±${radiusKm}km)` : 'Save Settings (Off)'}
          </Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  quotaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdf2f8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  quotaText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f72585',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  toggleTextWrap: {
    flex: 1,
    paddingRight: 14,
  },
  toggleStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  toggleStatusTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  toggleSub: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 17,
  },
  selectedDestinationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E2C',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 20,
  },
  destinationIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2a2a3e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  destinationTextWrap: {
    flex: 1,
  },
  destinationLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f72585',
    letterSpacing: 0.8,
  },
  destinationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  destinationRadius: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 6,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  radiusBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  radiusBtnActive: {
    backgroundColor: '#fdf2f8',
    borderColor: '#f72585',
  },
  radiusBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#475569',
  },
  radiusBtnTextActive: {
    color: '#f72585',
  },
  radiusBtnSub: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 2,
  },
  radiusBtnSubActive: {
    color: '#f72585',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  areasList: {
    gap: 10,
    marginBottom: 16,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  areaRowSelected: {
    backgroundColor: '#fff',
    borderColor: '#f72585',
  },
  areaIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  areaInfoWrap: {
    flex: 1,
  },
  areaName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  areaCategory: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f72585',
    justifyContent: 'center',
    alignItems: 'center',
  },
  policyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#f0f9ff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginTop: 10,
  },
  policyText: {
    flex: 1,
    fontSize: 12,
    color: '#0369a1',
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  applyBtn: {
    backgroundColor: '#f72585',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  applyBtnDisabled: {
    backgroundColor: '#475569',
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

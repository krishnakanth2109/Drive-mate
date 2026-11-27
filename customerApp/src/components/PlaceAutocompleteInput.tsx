import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCustomer, AutocompleteItem } from '../context/CustomerContext';

interface Props {
  placeholder: string;
  value: string;
  dotColor: string;
  onChangeText: (text: string) => void;
  onSelect: (place: { name?: string; address: string; lat: number; lng: number }) => void;
  onClear?: () => void;
  rightAction?: React.ReactNode;
  userLocationBias?: { lat: number; lng: number };
  autoFocus?: boolean;
  dropdownDirection?: 'up' | 'down';
  inputRowStyle?: any;
}

export default function PlaceAutocompleteInput({
  placeholder,
  value,
  dotColor,
  onChangeText,
  onSelect,
  onClear,
  rightAction,
  userLocationBias,
  autoFocus = false,
  dropdownDirection = 'down',
  inputRowStyle,
}: Props) {
  const { searchPlaces, getPlaceDetails } = useCustomer();
  const [suggestions, setSuggestions] = useState<AutocompleteItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const debounceTimerRef = useRef<any>(null);
  const latestRequestIdRef = useRef<number>(0);

  // Debounced search when input changes
  const handleTextChange = (text: string) => {
    onChangeText(text);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!text || text.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    const requestId = ++latestRequestIdRef.current;

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(text, userLocationBias);
        // Prevent stale requests from overriding newer results
        if (requestId === latestRequestIdRef.current) {
          setSuggestions(results);
          setHasSearched(true);
          setIsLoading(false);
        }
      } catch (err) {
        if (requestId === latestRequestIdRef.current) {
          setSuggestions([]);
          setIsLoading(false);
        }
      }
    }, 300);
  };

  const handleSelectSuggestion = async (item: AutocompleteItem) => {
    setIsResolving(true);
    try {
      const details = await getPlaceDetails(item.placeId);
      if (details) {
        onSelect({
          name: details.name || item.mainText,
          address: details.address || item.fullText,
          lat: details.lat,
          lng: details.lng,
        });
      } else {
        setSuggestions([]);
      }
    } finally {
      setIsResolving(false);
      setSuggestions([]);
      setIsFocused(false);
    }
  };

  const handleClear = () => {
    onChangeText('');
    setSuggestions([]);
    setHasSearched(false);
    if (onClear) onClear();
  };

  return (
    <View style={[styles.container, isFocused && { zIndex: 999 }]}>
      <View style={[styles.inputRow, inputRowStyle, isFocused && styles.inputRowFocused]}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={handleTextChange}
          onFocus={() => setIsFocused(true)}
          autoFocus={autoFocus}
          autoCorrect={false}
          clearButtonMode="never"
        />

        {/* Loading spinner */}
        {(isLoading || isResolving) && (
          <ActivityIndicator size="small" color="#f72585" style={styles.actionIcon} />
        )}

        {/* Clear button */}
        {!!value && !isLoading && !isResolving && (
          <TouchableOpacity onPress={handleClear} style={styles.actionIcon}>
            <Ionicons name="close-circle" size={18} color="#aaa" />
          </TouchableOpacity>
        )}

        {/* Right action custom slot (e.g. Map Pin or GPS) */}
        {rightAction}
      </View>

      {/* Dropdown Suggestions List beneath/above the active input */}
      {isFocused && (suggestions.length > 0 || (hasSearched && !isLoading && suggestions.length === 0)) && (
        <View style={[styles.dropdown, dropdownDirection === 'up' ? styles.dropdownUp : styles.dropdownDown]}>
          {suggestions.length > 0 ? (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.placeId}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(item)}
                >
                  <View style={styles.iconCircle}>
                    <Ionicons name="location-sharp" size={16} color="#f72585" />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.mainText} numberOfLines={1}>
                      {item.mainText}
                    </Text>
                    {!!item.secondaryText && (
                      <Text style={styles.subText} numberOfLines={1}>
                        {item.secondaryText}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={24} color="#aaa" />
              <Text style={styles.emptyText}>No matching locations found</Text>
              <Text style={styles.emptySubText}>Try checking the spelling or searching a landmark</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    zIndex: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e9ecef',
    paddingHorizontal: 12,
    height: 50,
  },
  inputRowFocused: {
    borderColor: '#f72585',
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#f72585',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#212529',
    fontWeight: '500',
    paddingVertical: 0,
  },
  actionIcon: {
    padding: 4,
    marginLeft: 6,
  },
  dropdown: {
    position: 'absolute',
    left: 0,
    right: 0,
    maxHeight: 230,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e9ecef',
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 14,
      },
    }),
    overflow: 'hidden',
  },
  dropdownDown: {
    top: 54,
  },
  dropdownUp: {
    bottom: 54,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(247, 37, 133, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  mainText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212529',
  },
  subText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginTop: 8,
  },
  emptySubText: {
    fontSize: 12,
    color: '#868e96',
    marginTop: 4,
    textAlign: 'center',
  },
});

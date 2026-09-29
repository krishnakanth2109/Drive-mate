import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RouteDetailsScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Route Details</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.step}>
          <Ionicons name="arrow-up" size={24} color="#a0a0b0" style={styles.stepIcon} />
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepText}>Head north on Main St</Text>
            <Text style={styles.stepDist}>200 m</Text>
          </View>
        </View>

        <View style={styles.step}>
          <Ionicons name="arrow-undo" size={24} color="#a0a0b0" style={styles.stepIcon} />
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepText}>Turn left onto Oak Ave</Text>
            <Text style={styles.stepDist}>1.5 km</Text>
          </View>
        </View>

        <View style={styles.step}>
          <Ionicons name="arrow-redo" size={24} color="#a0a0b0" style={styles.stepIcon} />
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepText}>Turn right to merge onto Highway 1</Text>
            <Text style={styles.stepDist}>5.0 km</Text>
          </View>
        </View>

        <View style={styles.step}>
          <Ionicons name="flag" size={24} color="#f72585" style={styles.stepIcon} />
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepText}>Arrive at destination on the left</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E2C' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: '#2a2a3c', borderBottomWidth: 1, borderBottomColor: '#3b3b4f' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  content: { padding: 20 },
  step: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#3b3b4f' },
  stepIcon: { marginRight: 20 },
  stepTextContainer: { flex: 1 },
  stepText: { color: '#fff', fontSize: 18, marginBottom: 5 },
  stepDist: { color: '#a0a0b0', fontSize: 14 },
});

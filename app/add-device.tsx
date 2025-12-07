import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

export default function AddDeviceScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    latitude: '',
    longitude: '',
  });

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        setGettingLocation(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setFormData({
        ...formData,
        latitude: location.coords.latitude.toFixed(6),
        longitude: location.coords.longitude.toFixed(6),
      });
      Alert.alert('Success', 'Current location captured!');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
    setGettingLocation(false);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter device name');
      return false;
    }
    if (!formData.location.trim()) {
      Alert.alert('Error', 'Please enter location description');
      return false;
    }
    if (!formData.latitude || !formData.longitude) {
      Alert.alert('Error', 'Please set coordinates');
      return false;
    }
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Error', 'Invalid coordinates');
      return false;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert('Error', 'Coordinates out of range');
      return false;
    }
    return true;
  };

  const handleAddDevice = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('water_gauges')
        .insert([
          {
            name: formData.name.trim(),
            location: formData.location.trim(),
            latitude: parseFloat(formData.latitude),
            longitude: parseFloat(formData.longitude),
            water_level: 0, // Default to 0
            max_capacity: 10, // Default to 10 meters
            status: 'normal', // Default status
          },
        ])
        .select();

      if (error) {
        console.error('Error adding device:', error);
        Alert.alert('Error', 'Failed to add device: ' + error.message);
        setLoading(false);
        return;
      }

      Alert.alert('Success', 'Device added successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to add device');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Add New Device</Text>
          <Text style={styles.headerSubtitle}>Water Level Sensor</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Device Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Device Information</Text>
          
          <Text style={styles.label}>Device Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Pasig River Monitor"
            placeholderTextColor="#94a3b8"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />

          <Text style={styles.label}>Location Description *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Pasig City, Metro Manila"
            placeholderTextColor="#94a3b8"
            value={formData.location}
            onChangeText={(text) => setFormData({ ...formData, location: text })}
          />
        </View>

        {/* Location Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>GPS Coordinates</Text>
          
          <TouchableOpacity 
            style={styles.locationButton}
            onPress={getCurrentLocation}
            disabled={gettingLocation}
          >
            {gettingLocation ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.locationButtonIcon}>📍</Text>
                <Text style={styles.locationButtonText}>Use Current Location</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Latitude *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 14.5995"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            value={formData.latitude}
            onChangeText={(text) => setFormData({ ...formData, latitude: text })}
          />

          <Text style={styles.label}>Longitude *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 120.9842"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            value={formData.longitude}
            onChangeText={(text) => setFormData({ ...formData, longitude: text })}
          />
        </View>

        {/* Add Button */}
        <TouchableOpacity 
          style={[styles.addButton, loading && styles.addButtonDisabled]}
          onPress={handleAddDevice}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.addButtonText}>Add Device</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>* Required fields</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#3b82f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backIcon: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#dbeafe',
    marginTop: 2,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#475569',
  },
  locationButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  locationButtonIcon: {
    fontSize: 20,
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
});
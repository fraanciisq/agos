import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Dimensions, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase, WaterGauge } from '../lib/supabase';

const { width } = Dimensions.get('window');

export default function MapScreen() {
  const router = useRouter();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [gauges, setGauges] = useState<WaterGauge[]>([]);

  // Fetch gauges from database
  const fetchGauges = async () => {
    try {
      const { data, error } = await supabase
        .from('water_gauges')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching gauges:', error);
        Alert.alert('Error', 'Failed to load water gauges');
        return;
      }

      if (data) {
        setGauges(data);
        console.log('Loaded', data.length, 'gauges from database');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to connect to database');
    }
  };

  useEffect(() => {
    (async () => {
      // Get location permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      console.log('Location permission:', status);
      
      if (status !== 'granted') {
        console.log('Permission denied');
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      console.log('Got location:', location.coords);
      setLocation(location);

      // Fetch gauges from database
      await fetchGauges();
      
      setLoading(false);
    })();
  }, []);

  // Refresh data when screen comes back into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchGauges();
    }, [])
  );

  // Get marker color based on status
  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'normal':
        return '#10b981'; // green
      case 'warning':
        return '#f59e0b'; // orange
      case 'critical':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingIcon}>💧</Text>
          <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
          <Text style={styles.loadingTitle}>Loading Map</Text>
          <Text style={styles.loadingText}>Preparing water monitoring system...</Text>
        </View>
      </View>
    );
  }

  const initialRegion = {
    latitude: location?.coords.latitude || 14.3833,
    longitude: location?.coords.longitude || 121.4667,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <View style={styles.container}>
      {/* Modern Gradient Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🌊</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>Agos</Text>
              <Text style={styles.headerSubtitle}>Water Monitoring</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => router.back()}
          >
            <Text style={styles.menuIcon}>←</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map */}
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {/* Render markers from database */}
        {gauges.map((gauge) => (
          <Marker
            key={gauge.id}
            coordinate={{
              latitude: gauge.latitude,
              longitude: gauge.longitude,
            }}
            title={gauge.name}
            description={`${gauge.water_level}m / ${gauge.max_capacity}m`}
            pinColor={getMarkerColor(gauge.status)}
          />
        ))}
      </MapView>

      {/* Floating Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoCardHeader}>
          <Text style={styles.infoCardIcon}>📍</Text>
          <Text style={styles.infoCardTitle}>Monitoring Active</Text>
        </View>
        <Text style={styles.infoCardText}>Tracking water levels in real-time</Text>
      </View>

      {/* Floating Action Button - My Location */}
      <TouchableOpacity style={styles.fabLocation}>
        <Text style={styles.fabIcon}>📍</Text>
      </TouchableOpacity>

      {/* Floating Action Button - Add Device */}
      <TouchableOpacity 
        style={styles.fabAdd}
        onPress={() => router.push('/add-device')}
      >
        <Text style={styles.fabAddIcon}>+</Text>
      </TouchableOpacity>

      {/* Status Bar at Bottom */}
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
          <Text style={styles.statusText}>Database Connected</Text>
        </View>
        <View style={styles.statusDivider} />
        <View style={styles.statusItem}>
          <Text style={styles.statusEmoji}>💧</Text>
          <Text style={styles.statusText}>{gauges.length} Sensors Active</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingCard: {
    backgroundColor: '#1e293b',
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingIcon: {
    fontSize: 48,
  },
  loader: {
    marginTop: 20,
  },
  loadingTitle: {
    marginTop: 24,
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#dbeafe',
    marginTop: 2,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  infoCard: {
    position: 'absolute',
    top: 160,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoCardIcon: {
    fontSize: 20,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  infoCardText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginLeft: 28,
  },
  fabLocation: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
  },
  fabAdd: {
    position: 'absolute',
    right: 20,
    bottom: 170,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabAddIcon: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '700',
  },
  statusBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    paddingBottom: 32,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusEmoji: {
    fontSize: 16,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  statusDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
  },
});
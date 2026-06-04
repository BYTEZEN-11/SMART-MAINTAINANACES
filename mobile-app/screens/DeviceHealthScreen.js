import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors as COLORS, Spacing as SIZES } from '../constants/theme';
import iotService from '../services/iotService';

const DeviceHealthScreen = ({ route, navigation }) => {
  const { deviceId, deviceName } = route.params;
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    try {
      const result = await iotService.getDeviceHealth(deviceId);
      setHealthData(result);
    } catch (error) {
      console.error('Load health error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadHealthData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const { device, latestData, healthMetrics, activeAlerts } = healthData || {};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Device Health</Text>
          <Text style={styles.headerSubtitle}>{deviceName}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {}
        <View style={styles.healthCard}>
          <View style={styles.healthCircle}>
            <Text style={styles.healthScore}>{healthMetrics?.overallHealth || 100}%</Text>
            <Text style={styles.healthLabel}>Health Score</Text>
          </View>
        </View>

        {}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Ionicons name="flash" size={24} color={COLORS.primary} />
            <Text style={styles.metricValue}>{healthMetrics?.averagePower || '0'} W</Text>
            <Text style={styles.metricLabel}>Avg Power</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="thermometer" size={24} color={COLORS.primary} />
            <Text style={styles.metricValue}>{healthMetrics?.averageTemperature || '0'}°C</Text>
            <Text style={styles.metricLabel}>Avg Temp</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="pulse" size={24} color={COLORS.primary} />
            <Text style={styles.metricValue}>{healthMetrics?.averageVibration || '0'}</Text>
            <Text style={styles.metricLabel}>Vibration</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="alert-circle" size={24} color="#EF4444" />
            <Text style={styles.metricValue}>{healthMetrics?.anomalyCount || 0}</Text>
            <Text style={styles.metricLabel}>Anomalies</Text>
          </View>
        </View>

        {}
        {latestData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Latest Reading</Text>
            <View style={styles.readingCard}>
              <Text style={styles.readingTime}>
                {new Date(latestData.timestamp).toLocaleString()}
              </Text>
              {latestData.readings.power && (
                <View style={styles.readingRow}>
                  <Text style={styles.readingLabel}>Power:</Text>
                  <Text style={styles.readingValue}>
                    {latestData.readings.power.consumption} W
                  </Text>
                </View>
              )}
              {latestData.readings.temperature && (
                <View style={styles.readingRow}>
                  <Text style={styles.readingLabel}>Temperature:</Text>
                  <Text style={styles.readingValue}>
                    {latestData.readings.temperature.value}°C
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {}
        {activeAlerts && activeAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Alerts ({activeAlerts.length})</Text>
            {activeAlerts.slice(0, 3).map(alert => (
              <View key={alert._id} style={styles.alertCard}>
                <Ionicons name="warning" size={20} color="#EF4444" />
                <View style={styles.alertInfo}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('DeviceAlerts', { deviceId, deviceName })}
            >
              <Text style={styles.viewAllText}>View All Alerts</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: COLORS.primary,
    padding: SIZES.lg,
    paddingTop: SIZES.lg * 2,
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerInfo: { marginLeft: 16, flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  headerSubtitle: { fontSize: 14, color: COLORS.white, opacity: 0.9, marginTop: 4 },
  content: { flex: 1, padding: SIZES.lg },
  healthCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SIZES.lg * 1.5,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2
  },
  healthCircle: { alignItems: 'center' },
  healthScore: { fontSize: 48, fontWeight: 'bold', color: COLORS.primary },
  healthLabel: { fontSize: 14, color: COLORS.gray, marginTop: 8 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 1
  },
  metricValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: 8 },
  metricLabel: { fontSize: 12, color: COLORS.gray, marginTop: 4 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  readingCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, elevation: 1 },
  readingTime: { fontSize: 12, color: COLORS.gray, marginBottom: 12 },
  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray
  },
  readingLabel: { fontSize: 14, color: COLORS.gray },
  readingValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12
  },
  alertInfo: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '600', color: '#991B1B' },
  alertMessage: { fontSize: 12, color: '#7F1D1D', marginTop: 4 },
  viewAllButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  viewAllText: { color: COLORS.white, fontSize: 14, fontWeight: '600' }
});

export default DeviceHealthScreen;

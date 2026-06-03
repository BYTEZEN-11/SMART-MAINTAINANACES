import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors as COLORS, Spacing as SIZES } from '../constants/theme';
import iotService from '../services/iotService';

const DeviceAlertsScreen = ({ route, navigation }) => {
  const { deviceId, deviceName } = route.params;
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); 

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const result = await iotService.getDeviceAlerts(deviceId, params);
      setAlerts(result);
    } catch (error) {
      console.error('Load alerts error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const handleUpdateStatus = async (alertId, status) => {
    try {
      await iotService.updateAlertStatus(alertId, status);
      loadAlerts();
    } catch (error) {
      Alert.alert('Error', 'Failed to update alert status');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: '#10B981',
      medium: '#F59E0B',
      high: '#EF4444',
      critical: '#991B1B'
    };
    return colors[severity] || '#6B7280';
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      low: 'information-circle',
      medium: 'warning',
      high: 'alert-circle',
      critical: 'skull'
    };
    return icons[severity] || 'help-circle';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Device Alerts</Text>
          <Text style={styles.headerSubtitle}>{deviceName}</Text>
        </View>
      </View>

      {}
      <View style={styles.filterContainer}>
        {['all', 'new', 'acknowledged'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {alerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            <Text style={styles.emptyText}>No alerts</Text>
            <Text style={styles.emptySubtext}>Your device is operating normally</Text>
          </View>
        ) : (
          alerts.map(alert => (
            <View key={alert._id} style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <View style={[styles.alertIcon, {
                  backgroundColor: getSeverityColor(alert.severity) + '20'
                }]}>
                  <Ionicons
                    name={getSeverityIcon(alert.severity)}
                    size={24}
                    color={getSeverityColor(alert.severity)}
                  />
                </View>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertTime}>
                    {new Date(alert.createdAt).toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.severityBadge, {
                  backgroundColor: getSeverityColor(alert.severity)
                }]}>
                  <Text style={styles.severityText}>
                    {alert.severity.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.alertMessage}>{alert.message}</Text>

              {alert.details && (
                <View style={styles.detailsBox}>
                  {alert.details.possibleCause && (
                    <Text style={styles.detailText}>
                      <Text style={styles.detailLabel}>Cause: </Text>
                      {alert.details.possibleCause}
                    </Text>
                  )}
                  {alert.details.recommendation && (
                    <Text style={styles.detailText}>
                      <Text style={styles.detailLabel}>Action: </Text>
                      {alert.details.recommendation}
                    </Text>
                  )}
                  {alert.details.estimatedCost && (
                    <Text style={styles.detailText}>
                      <Text style={styles.detailLabel}>Cost: </Text>
                      ₹{alert.details.estimatedCost.min} - ₹{alert.details.estimatedCost.max}
                    </Text>
                  )}
                </View>
              )}

              {alert.status === 'new' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleUpdateStatus(alert._id, 'acknowledged')}
                  >
                    <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                    <Text style={styles.actionButtonText}>Acknowledge</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonSecondary]}
                    onPress={() => handleUpdateStatus(alert._id, 'dismissed')}
                  >
                    <Ionicons name="close" size={16} color={COLORS.gray} />
                    <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                      Dismiss
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {alert.status === 'acknowledged' && (
                <TouchableOpacity
                  style={styles.resolveButton}
                  onPress={() => handleUpdateStatus(alert._id, 'resolved')}
                >
                  <Ionicons name="checkmark-done" size={16} color={COLORS.white} />
                  <Text style={styles.resolveButtonText}>Mark as Resolved</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
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
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 8,
    gap: 8
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8
  },
  filterTabActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: 14, color: COLORS.gray, fontWeight: '500' },
  filterTextActive: { color: COLORS.white },
  content: { flex: 1, padding: SIZES.lg },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: COLORS.gray, marginTop: 8 },
  alertCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  alertInfo: { flex: 1 },
  alertTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  alertTime: { fontSize: 12, color: COLORS.gray, marginTop: 4 },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  severityText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },
  alertMessage: { fontSize: 14, color: COLORS.text, marginBottom: 12, lineHeight: 20 },
  detailsBox: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8
  },
  detailText: { fontSize: 13, color: COLORS.text, lineHeight: 18 },
  detailLabel: { fontWeight: '600' },
  actionButtons: { flexDirection: 'row', gap: 8 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.primary
  },
  actionButtonSecondary: { borderColor: COLORS.lightGray },
  actionButtonText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  actionButtonTextSecondary: { color: COLORS.gray },
  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6
  },
  resolveButtonText: { color: COLORS.white, fontSize: 14, fontWeight: '600' }
});

export default DeviceAlertsScreen;

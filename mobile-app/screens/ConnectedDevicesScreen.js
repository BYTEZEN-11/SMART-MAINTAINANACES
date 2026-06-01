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

const ConnectedDevicesScreen = ({ navigation }) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const result = await iotService.getDevices();
      setDevices(result);
    } catch (error) {
      console.error('Load devices error:', error);
      Alert.alert('Error', 'Failed to load devices');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDevices();
  };

  const handleDisconnect = async (deviceId, deviceName) => {
    Alert.alert(
      'Disconnect Device',
      `Are you sure you want to disconnect ${deviceName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await iotService.disconnectDevice(deviceId);
              loadDevices();
              Alert.alert('Success', 'Device disconnected');
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect device');
            }
          }
        }
      ]
    );
  };

  const getDeviceIcon = (deviceType) => {
    const icons = {
      wifi: 'wifi',
      bluetooth: 'bluetooth',
      smart_plug: 'flash',
      sensor: 'hardware-chip'
    };
    return icons[deviceType] || 'hardware-chip';
  };

  const getStatusColor = (status) => {
    const colors = {
      connected: '#10B981',
      disconnected: '#6B7280',
      error: '#EF4444',
      pairing: '#F59E0B'
    };
    return colors[status] || '#6B7280';
  };

  const getStatusText = (status) => {
    const texts = {
      connected: 'Connected',
      disconnected: 'Disconnected',
      error: 'Error',
      pairing: 'Pairing'
    };
    return texts[status] || 'Unknown';
  };

  const formatLastSeen = (lastSeen) => {
    const now = new Date();
    const seen = new Date(lastSeen);
    const diffMs = now - seen;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading devices...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Connected Devices</Text>
          <Text style={styles.headerSubtitle}>{devices.length} device(s)</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('ConnectDevice')}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {devices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="hardware-chip-outline" size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>No devices connected</Text>
            <Text style={styles.emptySubtext}>
              Connect your smart devices to monitor their health in real-time
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('ConnectDevice')}
            >
              <Ionicons name="add-circle" size={20} color={COLORS.white} />
              <Text style={styles.emptyButtonText}>Connect Device</Text>
            </TouchableOpacity>
          </View>
        ) : (
          devices.map(device => (
            <TouchableOpacity
              key={device._id}
              style={styles.deviceCard}
              onPress={() => navigation.navigate('DeviceHealth', {
                deviceId: device._id,
                deviceName: device.deviceName
              })}
            >
              <View style={styles.deviceHeader}>
                <View style={[styles.deviceIcon, {
                  backgroundColor: device.status === 'connected' ? '#D1FAE5' : '#F3F4F6'
                }]}>
                  <Ionicons 
                    name={getDeviceIcon(device.deviceType)} 
                    size={28} 
                    color={device.status === 'connected' ? '#10B981' : '#6B7280'} 
                  />
                </View>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{device.deviceName}</Text>
                  {device.appliance && (
                    <Text style={styles.deviceAppliance}>
                      {device.appliance.name} • {device.appliance.type}
                    </Text>
                  )}
                  <View style={styles.deviceMeta}>
                    <View style={[styles.statusBadge, {
                      backgroundColor: getStatusColor(device.status) + '20'
                    }]}>
                      <View style={[styles.statusDot, {
                        backgroundColor: getStatusColor(device.status)
                      }]} />
                      <Text style={[styles.statusText, {
                        color: getStatusColor(device.status)
                      }]}>
                        {getStatusText(device.status)}
                      </Text>
                    </View>
                    <Text style={styles.lastSeen}>
                      {formatLastSeen(device.lastSeen)}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
              </View>

              {device.manufacturer && (
                <View style={styles.deviceDetails}>
                  <Text style={styles.deviceDetail}>
                    {device.manufacturer} {device.model}
                  </Text>
                </View>
              )}

              {device.capabilities && device.capabilities.length > 0 && (
                <View style={styles.capabilitiesRow}>
                  {device.capabilities.slice(0, 4).map(cap => (
                    <View key={cap} style={styles.capabilityChip}>
                      <Text style={styles.capabilityText}>{cap}</Text>
                    </View>
                  ))}
                  {device.capabilities.length > 4 && (
                    <View style={styles.capabilityChip}>
                      <Text style={styles.capabilityText}>
                        +{device.capabilities.length - 4}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.deviceActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('DeviceHealth', {
                    deviceId: device._id,
                    deviceName: device.deviceName
                  })}
                >
                  <Ionicons name="pulse" size={18} color={COLORS.primary} />
                  <Text style={styles.actionButtonText}>Health</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('DeviceAlerts', {
                    deviceId: device._id,
                    deviceName: device.deviceName
                  })}
                >
                  <Ionicons name="notifications" size={18} color={COLORS.primary} />
                  <Text style={styles.actionButtonText}>Alerts</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonDanger]}
                  onPress={() => handleDisconnect(device._id, device.deviceName)}
                >
                  <Ionicons name="unlink" size={18} color="#EF4444" />
                  <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                    Disconnect
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SIZES.lg,
    paddingTop: SIZES.lg * 2,
    flexDirection: 'row',
    alignItems: 'center'
  },
  backButton: {
    marginRight: 16
  },
  headerInfo: {
    flex: 1
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 4
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    flex: 1,
    padding: SIZES.lg
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
    gap: 8
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600'
  },
  deviceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  deviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  deviceInfo: {
    flex: 1
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4
  },
  deviceAppliance: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 6
  },
  deviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600'
  },
  lastSeen: {
    fontSize: 11,
    color: COLORS.gray
  },
  deviceDetails: {
    marginBottom: 12
  },
  deviceDetail: {
    fontSize: 13,
    color: COLORS.gray
  },
  capabilitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12
  },
  capabilityChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  capabilityText: {
    fontSize: 11,
    color: COLORS.text,
    fontWeight: '500'
  },
  deviceActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6
  },
  actionButtonDanger: {
    backgroundColor: '#FEE2E2'
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary
  },
  actionButtonTextDanger: {
    color: '#EF4444'
  }
});

export default ConnectedDevicesScreen;

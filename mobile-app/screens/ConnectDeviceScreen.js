import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors as COLORS, Spacing as SIZES } from '../constants/theme';
import iotService from '../services/iotService';
import bleService from '../services/bleService';

const ConnectDeviceScreen = ({ route, navigation }) => {
  const { applianceId, applianceName } = route.params || {};
  
  const [connectionType, setConnectionType] = useState('wifi'); 
  const [deviceName, setDeviceName] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [capabilities, setCapabilities] = useState({
    power: false,
    temperature: false,
    humidity: false,
    vibration: false,
    gas: false,
    current: false,
    voltage: false,
    status: true
  });
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedDevices, setScannedDevices] = useState([]);

  const deviceTypes = [
    { id: 'wifi', name: 'WiFi Device', icon: 'wifi', description: 'Smart appliances with WiFi' },
    { id: 'bluetooth', name: 'Bluetooth', icon: 'bluetooth', description: 'BLE sensors and devices' },
    { id: 'smart_plug', name: 'Smart Plug', icon: 'flash', description: 'Power monitoring plugs' },
    { id: 'sensor', name: 'External Sensor', icon: 'hardware-chip', description: 'Temperature, vibration, gas sensors' }
  ];

  const handleScanBLE = async () => {
    try {
      setScanning(true);
      setScannedDevices([]);
      
      await bleService.scanDevices((device) => {
        setScannedDevices(prev => {
          const exists = prev.find(d => d.id === device.id);
          if (!exists) {
            return [...prev, device];
          }
          return prev;
        });
      }, 10000);
      
      setTimeout(() => {
        setScanning(false);
      }, 10000);
    } catch (error) {
      setScanning(false);
      Alert.alert('Scan Error', error.message);
    }
  };

  const handleSelectBLEDevice = (device) => {
    setDeviceId(device.id);
    setDeviceName(device.name);
    setManufacturer('BLE Device');
  };

  const handleConnect = async () => {
    if (!deviceName || !deviceId) {
      Alert.alert('Validation Error', 'Please enter device name and ID');
      return;
    }

    setLoading(true);

    try {
      const selectedCapabilities = Object.keys(capabilities).filter(key => capabilities[key]);
      
      const deviceData = {
        deviceId,
        deviceName,
        deviceType: connectionType,
        connectionType: connectionType === 'bluetooth' ? 'ble' : connectionType === 'wifi' ? 'http' : 'mqtt',
        manufacturer,
        model,
        ipAddress: connectionType === 'wifi' ? ipAddress : undefined,
        apiEndpoint: connectionType === 'wifi' ? apiEndpoint : undefined,
        apiKey: connectionType === 'wifi' ? apiKey : undefined,
        capabilities: selectedCapabilities,
        applianceId
      };

      const result = await iotService.connectDevice(deviceData);
      
      Alert.alert(
        'Success',
        'Device connected successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Connect error:', error);

if (error?.status === 409) {
        Alert.alert(
          'Device Already Registered',
          'This hardware device is already linked to another account. ' +
          'Ask the original owner to disconnect it first, or contact support to transfer ownership.',
        );
      } else {
        Alert.alert('Connection Failed', error.message || 'Failed to connect device');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Connect Device</Text>
          {applianceName && (
            <Text style={styles.headerSubtitle}>{applianceName}</Text>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {}
        <Text style={styles.sectionTitle}>Select Connection Type</Text>
        <View style={styles.typeGrid}>
          {deviceTypes.map(type => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeCard,
                connectionType === type.id && styles.typeCardActive
              ]}
              onPress={() => setConnectionType(type.id)}
            >
              <Ionicons 
                name={type.icon} 
                size={32} 
                color={connectionType === type.id ? COLORS.primary : COLORS.gray} 
              />
              <Text style={[
                styles.typeName,
                connectionType === type.id && styles.typeNameActive
              ]}>
                {type.name}
              </Text>
              <Text style={styles.typeDescription}>{type.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {}
        {connectionType === 'bluetooth' && (
          <View style={styles.section}>
            <View style={styles.scanHeader}>
              <Text style={styles.sectionTitle}>Scan for Devices</Text>
              <TouchableOpacity 
                style={styles.scanButton}
                onPress={handleScanBLE}
                disabled={scanning}
              >
                {scanning ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="scan" size={20} color={COLORS.white} />
                    <Text style={styles.scanButtonText}>Scan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {scannedDevices.length > 0 && (
              <View style={styles.deviceList}>
                {scannedDevices.map(device => (
                  <TouchableOpacity
                    key={device.id}
                    style={[
                      styles.deviceItem,
                      deviceId === device.id && styles.deviceItemSelected
                    ]}
                    onPress={() => handleSelectBLEDevice(device)}
                  >
                    <Ionicons name="bluetooth" size={24} color={COLORS.primary} />
                    <View style={styles.deviceInfo}>
                      <Text style={styles.deviceItemName}>{device.name}</Text>
                      <Text style={styles.deviceItemId}>{device.id}</Text>
                      <Text style={styles.deviceItemRssi}>Signal: {device.rssi} dBm</Text>
                    </View>
                    {deviceId === device.id && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {}
        <Text style={styles.sectionTitle}>Device Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Device Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Living Room AC"
            value={deviceName}
            onChangeText={setDeviceName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Device ID *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., AC-001 or MAC address"
            value={deviceId}
            onChangeText={setDeviceId}
            editable={connectionType !== 'bluetooth'}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Manufacturer</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Samsung, LG, Xiaomi"
            value={manufacturer}
            onChangeText={setManufacturer}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Model</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., RT28, WM-1234"
            value={model}
            onChangeText={setModel}
          />
        </View>

        {}
        {connectionType === 'wifi' && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>IP Address</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 192.168.1.100"
                value={ipAddress}
                onChangeText={setIpAddress}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>API Endpoint</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., http://192.168.1.100/api"
                value={apiEndpoint}
                onChangeText={setApiEndpoint}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>API Key (if required)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter API key"
                value={apiKey}
                onChangeText={setApiKey}
                secureTextEntry
              />
            </View>
          </>
        )}

        {}
        <Text style={styles.sectionTitle}>Device Capabilities</Text>
        <View style={styles.capabilitiesGrid}>
          {Object.keys(capabilities).map(cap => (
            <View key={cap} style={styles.capabilityItem}>
              <Text style={styles.capabilityLabel}>
                {cap.charAt(0).toUpperCase() + cap.slice(1)}
              </Text>
              <Switch
                value={capabilities[cap]}
                onValueChange={(value) => setCapabilities(prev => ({ ...prev, [cap]: value }))}
                trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
              />
            </View>
          ))}
        </View>

        {}
        <TouchableOpacity
          style={[styles.connectButton, loading && styles.connectButtonDisabled]}
          onPress={handleConnect}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="link" size={20} color={COLORS.white} />
              <Text style={styles.connectButtonText}>Connect Device</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Make sure your device is powered on and within range. For WiFi devices, ensure they're on the same network.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
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
  content: {
    flex: 1,
    padding: SIZES.lg
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 8
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 1
  },
  typeCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#EEF2FF'
  },
  typeName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
    textAlign: 'center'
  },
  typeNameActive: {
    color: COLORS.primary
  },
  typeDescription: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 4,
    textAlign: 'center'
  },
  section: {
    marginBottom: 24
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8
  },
  scanButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600'
  },
  deviceList: {
    gap: 8
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 1
  },
  deviceItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#EEF2FF'
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 12
  },
  deviceItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text
  },
  deviceItemId: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2
  },
  deviceItemRssi: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.lightGray
  },
  capabilitiesGrid: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 1
  },
  capabilityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray
  },
  capabilityLabel: {
    fontSize: 14,
    color: COLORS.text
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16
  },
  connectButtonDisabled: {
    opacity: 0.6
  },
  connectButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600'
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    gap: 12
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18
  }
});

export default ConnectDeviceScreen;

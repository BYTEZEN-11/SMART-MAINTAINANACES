import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors as COLORS, Spacing as SIZES, Radius } from '../constants/theme';

const DEVICES_BY_CATEGORY = {
  computers: [
    { id: 'laptop', name: 'Laptop', icon: 'laptop-outline' },
    { id: 'desktop', name: 'Desktop Computer', icon: 'desktop-outline' },
    { id: 'mac', name: 'MacBook / iMac', icon: 'logo-apple' }
  ],
  mobile: [
    { id: 'phone', name: 'Smartphone', icon: 'phone-portrait-outline' },
    { id: 'tablet', name: 'Tablet / iPad', icon: 'tablet-portrait-outline' }
  ],
  entertainment: [
    { id: 'tv', name: 'Television', icon: 'tv-outline' },
    { id: 'soundbar', name: 'Soundbar / Speaker', icon: 'volume-high-outline' }
  ],
  appliances: [
    { id: 'fridge', name: 'Refrigerator', icon: 'snow-outline' },
    { id: 'ac', name: 'Air Conditioner', icon: 'thermometer-outline' },
    { id: 'washing-machine', name: 'Washing Machine', icon: 'water-outline' },
    { id: 'microwave', name: 'Microwave Oven', icon: 'radio-outline' },
    { id: 'oven', name: 'Oven / Stove', icon: 'flame-outline' }
  ],
  network: [
    { id: 'router', name: 'WiFi Router', icon: 'wifi-outline' },
    { id: 'modem', name: 'Modem', icon: 'globe-outline' }
  ],
  other: [
    { id: 'other', name: 'Other Device', icon: 'construct-outline' }
  ]
};

const DeviceSelectionScreen = ({ route, navigation }) => {
  const { category } = route.params;
  const [deviceName, setDeviceName] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);

  const devices = DEVICES_BY_CATEGORY[category.id] || [];

  const handleDeviceSelect = (device) => {
    setSelectedDevice(device);
  };

  const handleContinue = () => {
    if (!selectedDevice) {
      Alert.alert('Select Device', 'Please select a device type to continue.');
      return;
    }

    if (!deviceName.trim()) {
      Alert.alert('Device Name', 'Please enter a name for your device (e.g., "My Laptop", "Kitchen Fridge").');
      return;
    }

navigation.navigate('DeviceTest', {
      deviceType: selectedDevice.id,
      deviceName: deviceName.trim()
    });
  };

  return (
    <View style={styles.container}>
      {}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category.title}</Text>
      </View>

      <ScrollView style={styles.content}>
        {}
        <View style={styles.instructionCard}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <Text style={styles.instructionText}>
            Select your device type and give it a name to start diagnostics.
          </Text>
        </View>

        {}
        <Text style={styles.sectionTitle}>Select Device Type</Text>
        <View style={styles.deviceGrid}>
          {devices.map((device) => (
            <TouchableOpacity
              key={device.id}
              style={[
                styles.deviceCard,
                selectedDevice?.id === device.id && styles.deviceCardSelected
              ]}
              onPress={() => handleDeviceSelect(device)}
            >
              <View style={[
                styles.deviceIcon,
                selectedDevice?.id === device.id && styles.deviceIconSelected
              ]}>
                <Ionicons 
                  name={device.icon} 
                  size={32} 
                  color={selectedDevice?.id === device.id ? COLORS.white : COLORS.primary} 
                />
              </View>
              <Text style={[
                styles.deviceName,
                selectedDevice?.id === device.id && styles.deviceNameSelected
              ]}>
                {device.name}
              </Text>
              {selectedDevice?.id === device.id && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {}
        {selectedDevice && (
          <>
            <Text style={styles.sectionTitle}>Give Your Device a Name</Text>
            <View style={styles.inputCard}>
              <Ionicons name="pricetag-outline" size={20} color={COLORS.gray} />
              <TextInput
                style={styles.input}
                placeholder={`e.g., "My ${selectedDevice.name}", "Kitchen ${selectedDevice.name}"`}
                value={deviceName}
                onChangeText={setDeviceName}
                autoCapitalize="words"
              />
            </View>
            <Text style={styles.hint}>
              This helps you identify the device in your diagnostic history.
            </Text>
          </>
        )}

        {}
        {selectedDevice && deviceName.trim() && (
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue to Tests</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white
  },
  content: {
    flex: 1,
    padding: SIZES.lg
  },
  instructionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '15',
    padding: SIZES.lg,
    borderRadius: 12,
    marginBottom: 24
  },
  instructionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16
  },
  deviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  deviceCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    padding: SIZES.lg,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 1
  },
  deviceCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10'
  },
  deviceIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  deviceIconSelected: {
    backgroundColor: COLORS.primary
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center'
  },
  deviceNameSelected: {
    color: COLORS.primary
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SIZES.lg,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.text
  },
  hint: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 24,
    paddingHorizontal: 4
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    elevation: 2
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8
  }
});

export default DeviceSelectionScreen;

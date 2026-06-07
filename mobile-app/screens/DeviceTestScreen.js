import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors as COLORS, Spacing as SIZES } from '../constants/theme';

const TEST_TYPES = {
  laptop: [
    { id: 'sound', title: 'Sound Analysis', icon: 'volume-high-outline', description: 'Detect fan, HDD, or coil whine issues' },
    { id: 'vibration', title: 'Vibration Test', icon: 'pulse-outline', description: 'Check for fan or HDD vibration problems' },
    { id: 'thermal', title: 'Thermal Check', icon: 'thermometer-outline', description: 'Monitor CPU/GPU temperatures' },
    { id: 'visual', title: 'Visual Inspection', icon: 'camera-outline', description: 'Detect physical damage or swollen battery' },
    { id: 'symptom', title: 'Symptom Checker', icon: 'clipboard-outline', description: 'Answer questions about issues' },
    { id: 'performance', title: 'Performance Test', icon: 'speedometer-outline', description: 'Test CPU, RAM, and disk speed' },
    { id: 'battery', title: 'Battery Health', icon: 'battery-charging-outline', description: 'Check battery capacity and health' },
    { id: 'storage', title: 'Storage Health', icon: 'save-outline', description: 'Check HDD/SSD health and SMART data' },
    { id: 'display', title: 'Display Test', icon: 'desktop-outline', description: 'Test for dead pixels and backlight' },
    { id: 'connectivity', title: 'Connectivity Test', icon: 'wifi-outline', description: 'Test WiFi, Bluetooth, and ports' },
    { id: 'audio', title: 'Audio Test', icon: 'musical-notes-outline', description: 'Test speakers and microphone' },
    { id: 'input', title: 'Input Test', icon: 'keypad-outline', description: 'Test keyboard and trackpad' },
    { id: 'comprehensive', title: 'Full Scan', icon: 'scan-outline', description: 'Run all available tests' }
  ],
  phone: [
    { id: 'sound', title: 'Sound Analysis', icon: 'volume-high-outline', description: 'Detect speaker or vibration motor issues' },
    { id: 'vibration', title: 'Vibration Test', icon: 'pulse-outline', description: 'Check vibration motor' },
    { id: 'thermal', title: 'Thermal Check', icon: 'thermometer-outline', description: 'Monitor device temperature' },
    { id: 'visual', title: 'Visual Inspection', icon: 'camera-outline', description: 'Detect cracks, scratches, or damage' },
    { id: 'symptom', title: 'Symptom Checker', icon: 'clipboard-outline', description: 'Describe your phone issues' },
    { id: 'performance', title: 'Performance Test', icon: 'speedometer-outline', description: 'Test processor and RAM' },
    { id: 'battery', title: 'Battery Health', icon: 'battery-charging-outline', description: 'Check battery health and cycles' },
    { id: 'display', title: 'Display Test', icon: 'phone-portrait-outline', description: 'Test for dead pixels and touch' },
    { id: 'connectivity', title: 'Connectivity Test', icon: 'wifi-outline', description: 'Test WiFi, Bluetooth, and cellular' },
    { id: 'audio', title: 'Audio Test', icon: 'musical-notes-outline', description: 'Test speakers, earpiece, and mic' },
    { id: 'comprehensive', title: 'Full Scan', icon: 'scan-outline', description: 'Run all available tests' }
  ],
  fridge: [
    { id: 'sound', title: 'Sound Analysis', icon: 'volume-high-outline', description: 'Detect compressor or fan noise' },
    { id: 'vibration', title: 'Vibration Test', icon: 'pulse-outline', description: 'Check compressor vibration' },
    { id: 'thermal', title: 'Temperature Check', icon: 'thermometer-outline', description: 'Monitor cooling performance' },
    { id: 'visual', title: 'Visual Inspection', icon: 'camera-outline', description: 'Check for leaks, rust, or damage' },
    { id: 'symptom', title: 'Symptom Checker', icon: 'clipboard-outline', description: 'Describe cooling or other issues' },
    { id: 'power', title: 'Power Analysis', icon: 'flash-outline', description: 'Check power consumption' },
    { id: 'comprehensive', title: 'Full Diagnostic', icon: 'scan-outline', description: 'Complete refrigerator check' }
  ],
  ac: [
    { id: 'sound', title: 'Sound Analysis', icon: 'volume-high-outline', description: 'Detect compressor or fan issues' },
    { id: 'vibration', title: 'Vibration Test', icon: 'pulse-outline', description: 'Check outdoor unit vibration' },
    { id: 'thermal', title: 'Cooling Check', icon: 'thermometer-outline', description: 'Monitor cooling efficiency' },
    { id: 'visual', title: 'Visual Inspection', icon: 'camera-outline', description: 'Check for leaks or damage' },
    { id: 'symptom', title: 'Symptom Checker', icon: 'clipboard-outline', description: 'Describe AC problems' },
    { id: 'power', title: 'Power Analysis', icon: 'flash-outline', description: 'Check power consumption' },
    { id: 'comprehensive', title: 'Full Diagnostic', icon: 'scan-outline', description: 'Complete AC check' }
  ],
  'washing-machine': [
    { id: 'sound', title: 'Sound Analysis', icon: 'volume-high-outline', description: 'Detect motor or drum noise' },
    { id: 'vibration', title: 'Vibration Test', icon: 'pulse-outline', description: 'Check for excessive vibration' },
    { id: 'visual', title: 'Visual Inspection', icon: 'camera-outline', description: 'Check for leaks or damage' },
    { id: 'symptom', title: 'Symptom Checker', icon: 'clipboard-outline', description: 'Describe washing issues' },
    { id: 'power', title: 'Power Analysis', icon: 'flash-outline', description: 'Check power consumption' },
    { id: 'comprehensive', title: 'Full Diagnostic', icon: 'scan-outline', description: 'Complete machine check' }
  ],
  tv: [
    { id: 'sound', title: 'Sound Analysis', icon: 'volume-high-outline', description: 'Detect fan or power supply noise' },
    { id: 'thermal', title: 'Thermal Check', icon: 'thermometer-outline', description: 'Check for overheating' },
    { id: 'visual', title: 'Visual Inspection', icon: 'camera-outline', description: 'Check screen and physical condition' },
    { id: 'symptom', title: 'Symptom Checker', icon: 'clipboard-outline', description: 'Describe TV problems' },
    { id: 'display', title: 'Display Test', icon: 'tv-outline', description: 'Test for dead pixels and uniformity' },
    { id: 'connectivity', title: 'Connectivity Test', icon: 'wifi-outline', description: 'Test HDMI, WiFi, and ports' },
    { id: 'comprehensive', title: 'Full Diagnostic', icon: 'scan-outline', description: 'Complete TV check' }
  ]
};

const DeviceTestScreen = ({ route, navigation }) => {
  const { deviceType, deviceName } = route.params;
  const [loading, setLoading] = useState(false);

  const tests = TEST_TYPES[deviceType] || TEST_TYPES.laptop;

  const handleTestPress = (test) => {
    switch (test.id) {
      case 'sound':
        navigation.navigate('SoundTest', { deviceType, deviceName });
        break;
      case 'vibration':
        navigation.navigate('VibrationTest', { deviceType, deviceName });
        break;
      case 'visual':
        navigation.navigate('VisualTest', { deviceType, deviceName });
        break;
      case 'thermal':
        navigation.navigate('ThermalTest', { 
          deviceType, 
          deviceName,
          testName: 'Thermal Analysis',
          testIcon: 'thermometer-outline'
        });
        break;
      case 'symptom':
        navigation.navigate('SymptomTest', { 
          deviceType, 
          deviceName,
          testName: 'Symptom Checker',
          testIcon: 'clipboard-outline'
        });
        break;
      case 'performance':
        navigation.navigate('PerformanceTest', { 
          deviceType, 
          deviceName,
          testName: 'Performance Test',
          testIcon: 'speedometer-outline'
        });
        break;
      case 'battery':
        navigation.navigate('BatteryTest', { 
          deviceType, 
          deviceName,
          testName: 'Battery Health',
          testIcon: 'battery-charging-outline'
        });
        break;
      case 'storage':
        navigation.navigate('StorageTest', { 
          deviceType, 
          deviceName,
          testName: 'Storage Health',
          testIcon: 'save-outline'
        });
        break;
      case 'display':
        
        navigation.navigate('VisualTest', {
          deviceType,
          deviceName,
          testName: 'Display Test',
          testIcon: 'desktop-outline',
        });
        break;
      case 'connectivity':
        navigation.navigate('ConnectivityTest', {
          deviceType,
          deviceName,
          testName: 'Connectivity Test',
          testIcon: 'wifi-outline',
        });
        break;
      case 'audio':
        
        navigation.navigate('SoundTest', {
          deviceType,
          deviceName,
          testName: 'Audio Test',
          testIcon: 'musical-notes-outline',
        });
        break;
      case 'input':
        
        navigation.navigate('SymptomTest', {
          deviceType,
          deviceName,
          testName: 'Input Test',
          testIcon: 'keypad-outline',
        });
        break;
      case 'power':
        navigation.navigate('PowerTest', {
          deviceType,
          deviceName,
          testName: 'Power Analysis',
          testIcon: 'flash-outline',
        });
        break;
      case 'comprehensive':
        
        Alert.alert(
          'Full Scan',
          'Run each test one after another from the list, or use the new Sound + Visual tests for the broad coverage.'
        );
        break;
      default:
        Alert.alert('Coming Soon', 'This test will be available soon!');
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
          <Text style={styles.headerTitle}>{deviceName}</Text>
          <Text style={styles.headerSubtitle}>
            {deviceType.charAt(0).toUpperCase() + deviceType.slice(1).replace('-', ' ')}
          </Text>
        </View>
      </View>

      {}
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Available Tests</Text>
        {tests.map((test) => (
          <TouchableOpacity
            key={test.id}
            style={styles.testCard}
            onPress={() => handleTestPress(test)}
          >
            <View style={styles.testIcon}>
              <Ionicons name={test.icon} size={28} color={COLORS.primary} />
            </View>
            <View style={styles.testInfo}>
              <Text style={styles.testTitle}>{test.title}</Text>
              <Text style={styles.testDescription}>{test.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.gray} />
          </TouchableOpacity>
        ))}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9
  },
  content: {
    flex: 1,
    padding: SIZES.lg
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: COLORS.text
  },
  testCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SIZES.lg,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  testIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  testInfo: {
    flex: 1
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4
  },
  testDescription: {
    fontSize: 12,
    color: COLORS.gray
  }
});

export default DeviceTestScreen;

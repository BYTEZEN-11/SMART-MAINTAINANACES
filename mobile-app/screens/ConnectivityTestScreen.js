import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import { Colors as COLORS, Spacing as SIZES } from '../constants/theme';
import diagnosticService from '../services/diagnosticService';

const INTERFACES = [
  { key: 'wifi', label: 'Wi-Fi', icon: 'wifi-outline' },
  { key: 'bluetooth', label: 'Bluetooth', icon: 'bluetooth-outline' },
  { key: 'ethernet', label: 'Ethernet', icon: 'globe-outline' },
  { key: 'usb', label: 'USB', icon: 'hardware-chip-outline' },
  { key: 'hdmi', label: 'HDMI', icon: 'tv-outline' },
];

const ConnectivityTestScreen = ({ route, navigation }) => {
  const { deviceType, deviceName } = route.params;
  const [status, setStatus] = useState({
    wifi: 'unknown',
    bluetooth: 'unknown',
    ethernet: 'unknown',
    usb: 'unknown',
    hdmi: 'unknown',
  });
  const [signal, setSignal] = useState('70');
  const [notes, setNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    
    (async () => {
      try {
        const t = await Network.getNetworkStateAsync();
        if (t.type === Network.NetworkStateType.WIFI) {
          setStatus((s) => ({ ...s, wifi: 'ok' }));
        } else if (t.type === Network.NetworkStateType.CELLULAR) {
          setStatus((s) => ({ ...s, wifi: 'ok' }));
        } else if (t.type === Network.NetworkStateType.NONE) {
          setStatus((s) => ({ ...s, wifi: 'failed' }));
        }
      } catch {
        
      }
    })();
  }, []);

  const cycle = (key) => {
    const order = ['unknown', 'ok', 'failed'];
    setStatus((s) => ({ ...s, [key]: order[(order.indexOf(s[key]) + 1) % order.length] }));
  };

  const badgeColor = (v) =>
    v === 'ok' ? COLORS.success : v === 'failed' ? COLORS.danger : COLORS.lightGray;

  const analyze = async () => {
    const sigV = parseFloat(signal);
    if (Number.isNaN(sigV) || sigV < 0 || sigV > 100) {
      Alert.alert('Invalid input', 'Signal strength must be 0-100%.');
      return;
    }

    setIsAnalyzing(true);
    const connectivityData = {
      ...status,
      signalStrength: sigV,
    };

    try {
      const result = await diagnosticService.runConnectivityTest({
        deviceType,
        deviceName,
        connectivityData,
      });
      navigation.navigate('DiagnosticResult', { result, testType: 'Connectivity Test' });
    } catch (error) {
      console.error('Connectivity test error:', error);
      
      const failed = INTERFACES.filter((i) => status[i.key] === 'failed');
      let severity = 'Low';
      let issue = 'All interfaces report OK';
      let solution = 'No action needed. If you notice real-world issues, re-test each interface.';
      if (failed.length >= 2) {
        severity = 'High';
        issue = `Connectivity issues on ${failed.length} interfaces`;
        solution = `Investigate: ${failed.map((f) => f.label).join(', ')}. Restart, reseat cables, or re-pair Bluetooth devices.`;
      } else if (failed.length === 1 || sigV < 30) {
        severity = 'Medium';
        issue = failed.length === 1 ? `${failed[0].label} not working` : 'Weak signal detected';
        solution =
          failed.length === 1
            ? `Reboot and reseat the ${failed[0].label.toLowerCase()} connection. Replace the cable / re-pair if problem persists.`
            : 'Move closer to the access point. Check for Wi-Fi interference (microwaves, mirrors).';
      }
      navigation.navigate('DiagnosticResult', {
        result: {
          _id: 'mock-' + Date.now(),
          deviceType,
          deviceName,
          testType: 'connectivity-test',
          diagnosis: {
            issue,
            severity,
            confidence: 80,
            affectedComponents: failed.map((f) => f.label).concat(['Signal']),
            rootCause: `Signal ${sigV}%${failed.length ? `, failed: ${failed.map((f) => f.label).join(', ')}` : ''}${notes ? ` (${notes})` : ''}`,
            solution,
            estimatedCost: { min: 0, max: 4000, currency: 'INR' },
            urgency: severity === 'High' ? 'within-week' : 'within-month',
            diyPossible: true,
            preventiveMeasures: ['Keep cables seated firmly', 'Update radio firmware'],
          },
          status: 'completed',
          createdAt: new Date().toISOString(),
        },
        testType: 'Connectivity Test',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connectivity Test</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.instructionCard}>
          <Ionicons name="wifi-outline" size={24} color={COLORS.primary} />
          <Text style={styles.instructionText}>
            Tap each interface to mark OK / Failed. We try to read the live Wi-Fi state
            automatically — fill in the rest manually.
          </Text>
        </View>

        {INTERFACES.map((i) => {
          const v = status[i.key];
          return (
            <TouchableOpacity key={i.key} style={styles.row} onPress={() => cycle(i.key)}>
              <Ionicons name={i.icon} size={22} color={COLORS.text} />
              <Text style={styles.rowLabel}>{i.label}</Text>
              <View style={[styles.badge, { backgroundColor: badgeColor(v) }]}>
                <Text style={styles.badgeText}>{v}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <Text style={styles.label}>Wi-Fi signal strength (%)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={signal}
          onChangeText={setSignal}
          placeholder="e.g. 70"
        />

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder="Specific website unreachable? Specific peripheral won't pair?"
        />

        <TouchableOpacity
          style={styles.analyzeButton}
          onPress={analyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="pulse" size={22} color={COLORS.white} />
              <Text style={styles.analyzeButtonText}>Run Connectivity Test</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    padding: SIZES.lg,
    paddingTop: SIZES.lg * 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  content: { flex: 1, padding: SIZES.lg },
  instructionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight,
    padding: SIZES.lg,
    borderRadius: 12,
    marginBottom: 24,
  },
  instructionText: { flex: 1, marginLeft: 12, fontSize: 14, color: COLORS.text, lineHeight: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    marginBottom: 10,
    gap: 12,
  },
  rowLabel: { flex: 1, fontSize: 15, color: COLORS.text },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: { color: COLORS.white, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 8 },
  input: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    marginBottom: 12,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  analyzeButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});

export default ConnectivityTestScreen;

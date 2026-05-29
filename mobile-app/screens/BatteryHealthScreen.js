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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Battery from 'expo-battery';
import { Colors as COLORS, Spacing as SIZES } from '../constants/theme';
import diagnosticService from '../services/diagnosticService';

const BatteryHealthScreen = ({ route, navigation }) => {
  const { deviceType, deviceName } = route.params;
  const [capacity, setCapacity] = useState('85');
  const [cycleCount, setCycleCount] = useState('');
  const [temperature, setTemperature] = useState('30');
  const [voltage, setVoltage] = useState('');
  const [isSwollen, setIsSwollen] = useState(false);
  const [notes, setNotes] = useState('');
  const [liveLevel, setLiveLevel] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    
    let cancelled = false;
    (async () => {
      try {
        const level = await Battery.getBatteryLevelAsync();
        if (!cancelled) setLiveLevel(Math.round(level * 100));
      } catch {
        
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const analyze = async () => {
    const capV = parseFloat(capacity);
    const cycV = cycleCount ? parseInt(cycleCount, 10) : null;
    const tempV = parseFloat(temperature);
    if (Number.isNaN(capV) || Number.isNaN(tempV)) {
      Alert.alert('Invalid input', 'Please enter valid numeric values.');
      return;
    }

    setIsAnalyzing(true);
    const batteryData = {
      capacity: capV,
      cycleCount: cycV,
      voltage: voltage ? parseFloat(voltage) : null,
      temperature: tempV,
      isSwollen,
    };

    try {
      const result = await diagnosticService.runBatteryHealth({
        deviceType,
        deviceName,
        batteryData,
      });
      navigation.navigate('DiagnosticResult', { result, testType: 'Battery Health' });
    } catch (error) {
      console.error('Battery health error:', error);
      
      let severity = 'Low';
      let issue = 'Battery is healthy';
      let solution = 'No action needed. Continue usual charging habits.';
      if (isSwollen || tempV > 50 || capV < 50) {
        severity = 'Critical';
        issue = 'Battery at risk of failure';
        solution =
          'Stop using immediately. Do not continue charging. Bring to a service centre for replacement. If the device is hot or smells burnt, move it to a non-flammable surface.';
      } else if (capV < 70 || (cycV && cycV > 1000) || tempV > 40) {
        severity = 'High';
        issue = 'Battery significantly degraded';
        solution =
          'Plan a battery replacement soon. Avoid deep discharges and high ambient temperatures. Lower charging limits if the OS supports it.';
      } else if (capV < 85) {
        severity = 'Medium';
        issue = 'Battery wear noticeable';
        solution = 'Watch performance over the next few months. Keep the charge in 20-80% range when possible.';
      }
      navigation.navigate('DiagnosticResult', {
        result: {
          _id: 'mock-' + Date.now(),
          deviceType,
          deviceName,
          testType: 'battery-health',
          diagnosis: {
            issue,
            severity,
            confidence: 80,
            affectedComponents: ['Battery', 'Charging circuit'],
            rootCause: `Capacity ${capV}%${
              cycV ? `, ${cycV} cycles` : ''
            }, temp ${tempV}°C${isSwollen ? ', swollen' : ''}${notes ? ` (${notes})` : ''}`,
            solution,
            estimatedCost: { min: 1000, max: 6000, currency: 'INR' },
            urgency: severity === 'Critical' ? 'immediate' : 'within-month',
            diyPossible: false,
            preventiveMeasures: ['Avoid deep discharges', 'Keep cool'],
          },
          status: 'completed',
          createdAt: new Date().toISOString(),
        },
        testType: 'Battery Health',
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
        <Text style={styles.headerTitle}>Battery Health</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.instructionCard}>
          <Ionicons name="battery-half-outline" size={24} color={COLORS.primary} />
          <Text style={styles.instructionText}>
            Enter the values reported by your device's built-in battery diagnostics (Settings
            → Battery → Health on iOS, AccuBattery / HwInfo on Android).
            {liveLevel !== null && ` Currently measured level: ${liveLevel}%.`}
          </Text>
        </View>

        <Text style={styles.label}>Design capacity remaining (%)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={capacity}
          onChangeText={setCapacity}
          placeholder="e.g. 85"
        />

        <Text style={styles.label}>Cycle count (optional)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={cycleCount}
          onChangeText={setCycleCount}
          placeholder="e.g. 350"
        />

        <Text style={styles.label}>Battery temperature (°C)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={temperature}
          onChangeText={setTemperature}
          placeholder="e.g. 32"
        />

        <Text style={styles.label}>Voltage (V, optional)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={voltage}
          onChangeText={setVoltage}
          placeholder="e.g. 3.8 / 11.4"
        />

        <Text style={styles.label}>Physical condition</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.tag, !isSwollen && styles.tagActive]}
            onPress={() => setIsSwollen(false)}
          >
            <Text style={[styles.tagText, !isSwollen && styles.tagTextActive]}>Normal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tag, isSwollen && styles.tagActiveDanger]}
            onPress={() => setIsSwollen(true)}
          >
            <Text style={[styles.tagText, isSwollen && styles.tagTextActive]}>Swollen / bulging</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder="Random shutdowns? Charges slowly?"
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
              <Ionicons name="medkit" size={22} color={COLORS.white} />
              <Text style={styles.analyzeButtonText}>Run Battery Health</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={[styles.tipCard, isSwollen && styles.tipCardDanger]}>
          <Ionicons name="warning-outline" size={20} color={COLORS.danger} />
          <Text style={styles.tipText}>
            Swollen, leaking, or hot-to-touch batteries are a fire risk. Stop charging and
            place the device on a non-flammable surface until it can be disposed of safely.
          </Text>
        </View>
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
  row: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tag: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    alignItems: 'center',
  },
  tagActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  tagActiveDanger: { borderColor: COLORS.danger, backgroundColor: COLORS.dangerLight },
  tagText: { color: COLORS.text, fontWeight: '500' },
  tagTextActive: { color: COLORS.primary, fontWeight: '700' },
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
  tipCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.warningLight,
    padding: SIZES.lg,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  tipCardDanger: { backgroundColor: COLORS.dangerLight },
  tipText: { flex: 1, marginLeft: 12, fontSize: 13, color: COLORS.text, lineHeight: 18 },
});

export default BatteryHealthScreen;

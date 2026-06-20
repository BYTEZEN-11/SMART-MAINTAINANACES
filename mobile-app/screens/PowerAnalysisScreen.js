import React, { useState } from 'react';
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
import { Colors as COLORS, Spacing as SIZES } from '../constants/theme';
import diagnosticService from '../services/diagnosticService';

const PowerAnalysisScreen = ({ route, navigation }) => {
  const { deviceType, deviceName } = route.params;
  const [voltage, setVoltage] = useState('230');
  const [current, setCurrent] = useState('2.5');
  const [power, setPower] = useState('');
  const [powerFactor, setPowerFactor] = useState('0.9');
  const [energy, setEnergy] = useState('');
  const [notes, setNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyze = async () => {
    const v = parseFloat(voltage);
    const i = parseFloat(current);
    const pf = parseFloat(powerFactor);
    if ([v, i, pf].some(Number.isNaN)) {
      Alert.alert('Invalid input', 'Please enter valid numeric values.');
      return;
    }

    setIsAnalyzing(true);
    const pW = power ? parseFloat(power) : v * i * pf;
    const kWh = energy ? parseFloat(energy) : null;

    const powerData = {
      voltage: v,
      current: i,
      power: pW,
      powerFactor: pf,
      energyConsumption: kWh,
    };

    try {
      const result = await diagnosticService.runPowerAnalysis({
        deviceType,
        deviceName,
        powerData,
      });
      navigation.navigate('DiagnosticResult', { result, testType: 'Power Analysis' });
    } catch (error) {
      console.error('Power analysis error:', error);
      
      let severity = 'Low';
      let issue = 'Power parameters are normal';
      let solution = 'No action needed. Continue routine usage.';
      if (v < 200 || v > 250) {
        severity = 'High';
        issue = 'Abnormal voltage detected';
        solution =
          'Use a voltage stabilizer or UPS. Sustained over-voltage can damage electronics; under-voltage can cause reboots and overheating in motors.';
      } else if (pf < 0.7) {
        severity = 'Medium';
        issue = 'Low power factor';
        solution =
          'Likely a high inductive load. Use a power factor correction device or balance the load across phases.';
      } else if (i > 16) {
        severity = 'Medium';
        issue = 'High current draw';
        solution = 'Likely overloaded circuit. Spread the load across multiple outlets / circuits.';
      }
      navigation.navigate('DiagnosticResult', {
        result: {
          _id: 'mock-' + Date.now(),
          deviceType,
          deviceName,
          testType: 'power-analysis',
          diagnosis: {
            issue,
            severity,
            confidence: 80,
            affectedComponents: ['Power supply', 'Wiring'],
            rootCause: `${v}V, ${i}A, ${pW.toFixed(0)}W, PF ${pf}${notes ? ` (${notes})` : ''}`,
            solution,
            estimatedCost: { min: 1500, max: 12000, currency: 'INR' },
            urgency: severity === 'High' ? 'within-week' : 'within-month',
            diyPossible: severity === 'Low',
            preventiveMeasures: ['Use surge protection', 'Keep wiring maintained'],
          },
          status: 'completed',
          createdAt: new Date().toISOString(),
        },
        testType: 'Power Analysis',
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
        <Text style={styles.headerTitle}>Power Analysis</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.instructionCard}>
          <Ionicons name="flash-outline" size={24} color={COLORS.primary} />
          <Text style={styles.instructionText}>
            Use a clamp meter or smart plug to read the values. Indian standard: 230V / 50Hz.
            Power Factor is between 0 and 1.
          </Text>
        </View>

        <Field label="Voltage (V)" value={voltage} onChange={setVoltage} placeholder="e.g. 230" />
        <Field label="Current (A)" value={current} onChange={setCurrent} placeholder="e.g. 2.5" />
        <Field label="Power factor (0-1)" value={powerFactor} onChange={setPowerFactor} placeholder="e.g. 0.9" />
        <Field label="Power (W, optional)" value={power} onChange={setPower} placeholder="leave blank to auto-compute" />
        <Field
          label="Energy consumption (kWh/month, optional)"
          value={energy}
          onChange={setEnergy}
          placeholder="from your electricity bill"
        />

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder="Frequent trips? Buzzing? Burning smell?"
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
              <Ionicons name="analytics" size={22} color={COLORS.white} />
              <Text style={styles.analyzeButtonText}>Run Power Analysis</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={[styles.tipCard]}>
          <Ionicons name="warning-outline" size={20} color={COLORS.danger} />
          <Text style={styles.tipText}>
            Never measure mains voltage by touching wires yourself — use a proper multimeter
            or smart plug and follow your local electrical safety rules.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const Field = ({ label, value, onChange, placeholder }) => (
  <>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      keyboardType="numeric"
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
    />
  </>
);

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
    backgroundColor: COLORS.dangerLight,
    padding: SIZES.lg,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  tipText: { flex: 1, marginLeft: 12, fontSize: 13, color: COLORS.text, lineHeight: 18 },
});

export default PowerAnalysisScreen;

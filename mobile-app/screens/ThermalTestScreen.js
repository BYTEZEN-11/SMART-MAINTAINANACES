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
import { Colors as COLORS, Spacing as SIZES } from '../constants/theme';
import diagnosticService from '../services/diagnosticService';

const ThermalTestScreen = ({ route, navigation }) => {
  const { deviceType, deviceName } = route.params;
  const [maxTemp, setMaxTemp] = useState('65');
  const [avgTemp, setAvgTemp] = useState('45');
  const [notes, setNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyze = async () => {
    const max = parseFloat(maxTemp);
    const avg = parseFloat(avgTemp);
    if (Number.isNaN(max) || Number.isNaN(avg)) {
      Alert.alert('Invalid input', 'Please enter valid numeric temperatures.');
      return;
    }
    if (max < 0 || max > 200 || avg < 0 || avg > 200) {
      Alert.alert('Out of range', 'Temperatures should be between 0 and 200 °C.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await diagnosticService.runThermalAnalysis({
        deviceType,
        deviceName,
        thermalData: {
          readings: [{ location: 'user-input', temperature: max }],
          maxTemp: max,
          avgTemp: avg,
          hotSpots: notes ? [{ x: 0, y: 0, temperature: max }] : [],
          notes,
        },
      });
      navigation.navigate('DiagnosticResult', { result, testType: 'Thermal Check' });
    } catch (error) {
      console.error('Thermal analysis error:', error);
      
      let severity = 'Low';
      let issue = 'Normal temperature range';
      let solution = 'No action needed. Temperature is within normal range.';
      if (max > 80) {
        severity = 'Critical';
        issue = 'Critical overheating detected';
        solution = 'Clean all vents and fans. Replace thermal paste. Ensure proper ventilation.';
      } else if (max > 60) {
        severity = 'Medium';
        issue = 'Elevated temperature detected';
        solution = 'Clean dust from vents and fans. Ensure adequate space for airflow.';
      }
      navigation.navigate('DiagnosticResult', {
        result: {
          _id: 'mock-' + Date.now(),
          deviceType,
          deviceName,
          testType: 'thermal-analysis',
          diagnosis: {
            issue,
            severity,
            confidence: 75,
            affectedComponents: ['Cooling system', 'Fans'],
            rootCause: `Max ${max}°C, avg ${avg}°C${notes ? ` (${notes})` : ''}`,
            solution,
            estimatedCost: { min: 0, max: 3000, currency: 'INR' },
            urgency: severity === 'Critical' ? 'immediate' : 'within-month',
            diyPossible: true,
            preventiveMeasures: ['Regular cleaning', 'Proper ventilation'],
          },
          status: 'completed',
          createdAt: new Date().toISOString(),
        },
        testType: 'Thermal Check',
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
        <Text style={styles.headerTitle}>Thermal Check</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.instructionCard}>
          <Ionicons name="thermometer-outline" size={24} color={COLORS.primary} />
          <Text style={styles.instructionText}>
            Enter the temperatures you've measured (e.g. from an IR thermometer or device
            diagnostic app). Hot regions or vents should be checked first.
          </Text>
        </View>

        <Text style={styles.label}>Maximum Temperature (°C)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={maxTemp}
          onChangeText={setMaxTemp}
          placeholder="e.g. 70"
        />

        <Text style={styles.label}>Average Temperature (°C)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={avgTemp}
          onChangeText={setAvgTemp}
          placeholder="e.g. 45"
        />

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder="Any hotspots? Fan noise? Recent heavy use?"
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
              <Ionicons name="thermometer" size={24} color={COLORS.white} />
              <Text style={styles.analyzeButtonText}>Run Thermal Analysis</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={20} color={COLORS.primary} />
          <Text style={styles.tipText}>
            Typical safe range: under 60°C. Above 80°C is critical and needs immediate
            attention.
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
  tipText: { flex: 1, marginLeft: 12, fontSize: 13, color: COLORS.text, lineHeight: 18 },
});

export default ThermalTestScreen;

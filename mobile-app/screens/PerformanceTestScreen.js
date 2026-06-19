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

const PerformanceTestScreen = ({ route, navigation }) => {
  const { deviceType, deviceName } = route.params;
  const [cpu, setCpu] = useState('45');
  const [memory, setMemory] = useState('55');
  const [disk, setDisk] = useState('60');
  const [response, setResponse] = useState('400');
  const [notes, setNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyze = async () => {
    const cpuV = parseFloat(cpu);
    const memV = parseFloat(memory);
    const diskV = parseFloat(disk);
    const respV = parseFloat(response);
    if ([cpuV, memV, diskV, respV].some(Number.isNaN)) {
      Alert.alert('Invalid input', 'Please enter valid numeric values.');
      return;
    }

    setIsAnalyzing(true);
    const performanceData = {
      cpuUsage: cpuV,
      memoryUsage: memV,
      diskUsage: diskV,
      responseTime: respV,
      benchmarkScore: null,
    };

    try {
      const result = await diagnosticService.runPerformanceTest({
        deviceType,
        deviceName,
        performanceData,
      });
      navigation.navigate('DiagnosticResult', { result, testType: 'Performance Test' });
    } catch (error) {
      console.error('Performance test error:', error);
      
      const hi = [cpuV, memV, diskV].filter((v) => v > 80).length;
      let severity = 'Low';
      let issue = 'Performance is healthy';
      let solution = 'No action needed. Continue regular maintenance.';
      if (hi >= 2 || respV > 1500) {
        severity = 'High';
        issue = 'System is overloaded';
        solution =
          'Close background apps, restart, update the OS, check for runaway processes. Consider adding RAM / replacing thermal paste if hardware is old.';
      } else if (hi >= 1 || respV > 800) {
        severity = 'Medium';
        issue = 'Elevated resource usage';
        solution =
          'Disable startup apps, check disk usage, look for malware, and consider upgrading storage to SSD if still on HDD.';
      }
      navigation.navigate('DiagnosticResult', {
        result: {
          _id: 'mock-' + Date.now(),
          deviceType,
          deviceName,
          testType: 'performance-test',
          diagnosis: {
            issue,
            severity,
            confidence: 70,
            affectedComponents: ['CPU', 'Memory', 'Disk'],
            rootCause: `CPU ${cpuV}% / RAM ${memV}% / Disk ${diskV}% / response ${respV}ms${notes ? ` (${notes})` : ''}`,
            solution,
            estimatedCost: { min: 0, max: 8000, currency: 'INR' },
            urgency: severity === 'High' ? 'within-week' : 'within-month',
            diyPossible: true,
            preventiveMeasures: ['Close unnecessary background apps', 'Keep the OS up to date'],
          },
          status: 'completed',
          createdAt: new Date().toISOString(),
        },
        testType: 'Performance Test',
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
        <Text style={styles.headerTitle}>Performance Test</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.instructionCard}>
          <Ionicons name="speedometer-outline" size={24} color={COLORS.primary} />
          <Text style={styles.instructionText}>
            Enter approximate current resource usage as you'd see in Task Manager / Activity
            Monitor. If you're not sure, skip and enter rough numbers — the AI will infer
            likely causes.
          </Text>
        </View>

        <Field label="CPU usage (%)" value={cpu} onChange={setCpu} placeholder="e.g. 45" />
        <Field label="RAM usage (%)" value={memory} onChange={setMemory} placeholder="e.g. 55" />
        <Field label="Disk usage (%)" value={disk} onChange={setDisk} placeholder="e.g. 60" />
        <Field
          label="Average response time (ms)"
          value={response}
          onChange={setResponse}
          placeholder="e.g. 400"
        />

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder="Any specific apps misbehaving?"
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
              <Text style={styles.analyzeButtonText}>Run Performance Test</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={20} color={COLORS.primary} />
          <Text style={styles.tipText}>
            Idle steady-state numbers: CPU 0-10%, RAM 30-60%, Disk 0-30%. Sustained values
            above 80% usually mean the system is struggling.
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
    backgroundColor: COLORS.warningLight,
    padding: SIZES.lg,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  tipText: { flex: 1, marginLeft: 12, fontSize: 13, color: COLORS.text, lineHeight: 18 },
});

export default PerformanceTestScreen;

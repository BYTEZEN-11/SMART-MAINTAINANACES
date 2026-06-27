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

const CATEGORIES = [
  { key: 'power', label: 'Power issues', icon: 'power-outline', examples: ['won\'t turn on', 'random shutdowns', 'battery drains fast'] },
  { key: 'display', label: 'Display / screen', icon: 'desktop-outline', examples: ['flickering', 'dead pixels', 'backlight dim'] },
  { key: 'audio', label: 'Audio / sound', icon: 'volume-high-outline', examples: ['no sound', 'buzzing', 'distortion'] },
  { key: 'connectivity', label: 'Connectivity', icon: 'wifi-outline', examples: ['Wi-Fi drops', 'Bluetooth won\'t pair', 'no signal'] },
  { key: 'performance', label: 'Performance', icon: 'speedometer-outline', examples: ['sluggish', 'overheating', 'freezes mid-task'] },
  { key: 'physical', label: 'Physical damage', icon: 'warning-outline', examples: ['cracked case', 'liquid spill', 'bent pins'] },
];

const SymptomTestScreen = ({ route, navigation }) => {
  const { deviceType, deviceName } = route.params;
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState(null);
  const [selected, setSelected] = useState([]);
  const [details, setDetails] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const onSelectSymptom = (label) => {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  const analyze = async () => {
    if (!category || selected.length === 0) {
      Alert.alert('Selection required', 'Pick at least one symptom before analysing.');
      return;
    }
    setIsAnalyzing(true);
    const symptoms = [
      `Category: ${category}`,
      ...selected.map((s) => s),
      ...(details ? [`Details: ${details}`] : []),
    ];

    try {
      const result = await diagnosticService.runSymptomChecker({
        deviceType,
        deviceName,
        symptoms,
      });
      navigation.navigate('DiagnosticResult', { result, testType: 'Symptom Checker' });
    } catch (error) {
      console.error('Symptom checker error:', error);
      
      const fallback = {
        power: {
          issue: 'Likely power delivery or battery issue',
          severity: 'Medium',
          solution:
            'Check charger / power cable first. Try a different outlet. Inspect the charging port for damage or debris. Battery may need replacement if health is low.',
        },
        display: {
          issue: 'Likely display or graphics issue',
          severity: 'Medium',
          solution:
            'Try a different cable / input. Reseat any display connectors. Look for cracks or liquid ingress. Driver / firmware update may help.',
        },
        audio: {
          issue: 'Likely audio output or driver issue',
          severity: 'Low',
          solution:
            'Test with another cable / speaker / headphones. Update audio drivers. Check audio balance and disabled output devices in OS settings.',
        },
        connectivity: {
          issue: 'Likely radio or network issue',
          severity: 'Medium',
          solution:
            'Restart the device and the router. Forget and re-join the Wi-Fi network. Move closer to the access point. Update radio firmware if exposed.',
        },
        performance: {
          issue: 'Likely software or thermal throttling',
          severity: 'High',
          solution:
            'Close background apps and reboot. Check for OS/firmware updates. Inspect thermal logs — clean vents and repaste if overheating. Consider a factory reset as last resort.',
        },
        physical: {
          issue: 'Physical damage detected',
          severity: 'High',
          solution:
            'Stop using immediately if liquid or smoke was involved. Document damage with photos. Take the device to an authorised service centre — do not attempt risky disassembly yourself.',
        },
      }[category] || {
        issue: 'Unable to identify specific issue',
        severity: 'Low',
        solution: 'Provide more symptoms or take a photo/video for visual analysis.',
      };

      navigation.navigate('DiagnosticResult', {
        result: {
          _id: 'mock-' + Date.now(),
          deviceType,
          deviceName,
          testType: 'symptom-checker',
          diagnosis: {
            issue: fallback.issue,
            severity: fallback.severity,
            confidence: 70,
            affectedComponents: [category],
            rootCause: `${selected.length} symptom(s) reported under ${category}${details ? ` (${details})` : ''}`,
            solution: fallback.solution,
            estimatedCost: { min: 0, max: 5000, currency: 'INR' },
            urgency: fallback.severity === 'High' ? 'within-week' : 'within-month',
            diyPossible: fallback.severity === 'Low',
            preventiveMeasures: [
              'Address root cause before reusing device',
              'Back up your data regularly',
            ],
          },
          status: 'completed',
          createdAt: new Date().toISOString(),
        },
        testType: 'Symptom Checker',
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
        <Text style={styles.headerTitle}>Symptom Checker</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.stepIndicator}>Step {step + 1} of 3</Text>

        {step === 0 && (
          <>
            <Text style={styles.heading}>What's going on?</Text>
            <Text style={styles.subtle}>Pick the closest category.</Text>

            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.key}
                style={[styles.option, category === c.key && styles.optionSelected]}
                onPress={() => setCategory(c.key)}
              >
                <Ionicons
                  name={c.icon}
                  size={22}
                  color={category === c.key ? COLORS.primary : COLORS.text}
                />
                <Text style={styles.optionLabel}>{c.label}</Text>
                {category === c.key && (
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.navButton, !category && styles.navButtonDisabled]}
              disabled={!category}
              onPress={() => setStep(1)}
            >
              <Text style={styles.navButtonText}>Continue</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 1 && (
          <>
            <Text style={styles.heading}>
              Which {CATEGORIES.find((c) => c.key === category)?.label.toLowerCase()}?
            </Text>
            <Text style={styles.subtle}>Pick everything that applies.</Text>

            {CATEGORIES.find((c) => c.key === category)?.examples.map((ex) => (
              <TouchableOpacity
                key={ex}
                style={[styles.option, selected.includes(ex) && styles.optionSelected]}
                onPress={() => onSelectSymptom(ex)}
              >
                <Ionicons
                  name={selected.includes(ex) ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={selected.includes(ex) ? COLORS.primary : COLORS.text}
                />
                <Text style={styles.optionLabel}>{ex}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.row}>
              <TouchableOpacity style={styles.navButtonGhost} onPress={() => setStep(0)}>
                <Text style={styles.navButtonGhostText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, selected.length === 0 && styles.navButtonDisabled]}
                disabled={selected.length === 0}
                onPress={() => setStep(2)}
              >
                <Text style={styles.navButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.heading}>Anything else to add?</Text>
            <Text style={styles.subtle}>Optional — describe in your own words.</Text>
            <TextInput
              style={styles.textArea}
              multiline
              value={details}
              onChangeText={setDetails}
              placeholder="When did it start? How often? Any pattern?"
            />

            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <Text style={styles.summaryLine}>
                Category: {CATEGORIES.find((c) => c.key === category)?.label}
              </Text>
              <Text style={styles.summaryLine}>
                Symptoms: {selected.length}
              </Text>
            </View>

            <View style={styles.row}>
              <TouchableOpacity style={styles.navButtonGhost} onPress={() => setStep(1)}>
                <Text style={styles.navButtonGhostText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.analyzeButton}
                onPress={analyze}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.analyzeButtonText}>Analyse Symptoms</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
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
  stepIndicator: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  heading: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  subtle: { fontSize: 13, color: COLORS.textLight, marginBottom: 16 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    gap: 12,
  },
  optionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  optionLabel: { flex: 1, fontSize: 15, color: COLORS.text },
  row: { flexDirection: 'row', gap: 12, marginTop: 24 },
  navButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  navButtonDisabled: { opacity: 0.5 },
  navButtonText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  navButtonGhost: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  navButtonGhostText: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  analyzeButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  analyzeButtonText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  textArea: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  summary: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
  },
  summaryTitle: { fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 },
  summaryLine: { color: COLORS.text, marginBottom: 4 },
});

export default SymptomTestScreen;

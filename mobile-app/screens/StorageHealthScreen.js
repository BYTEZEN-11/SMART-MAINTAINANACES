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

const StorageHealthScreen = ({ route, navigation }) => {
  const { deviceType, deviceName } = route.params;
  const [totalSpace, setTotalSpace] = useState('512');
  const [usedSpace, setUsedSpace] = useState('256');
  const [badSectors, setBadSectors] = useState('0');
  const [readErrors, setReadErrors] = useState('0');
  const [writeErrors, setWriteErrors] = useState('0');
  const [smartStatus, setSmartStatus] = useState('Healthy');
  const [lifespan, setLifespan] = useState('85');
  const [notes, setNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const SMART_OPTIONS = ['Healthy', 'Degraded', 'Failing'];

  const analyze = async () => {
    const total = parseFloat(totalSpace);
    const used = parseFloat(usedSpace);
    const bad = parseInt(badSectors || '0', 10);
    const re = parseInt(readErrors || '0', 10);
    const we = parseInt(writeErrors || '0', 10);
    const life = parseFloat(lifespan);

    if ([total, used, life].some(Number.isNaN) || total <= 0) {
      Alert.alert('Invalid input', 'Please enter valid capacity and lifespan values.');
      return;
    }
    if (used > total) {
      Alert.alert('Out of range', 'Used space cannot exceed total space.');
      return;
    }

    setIsAnalyzing(true);
    const storageData = {
      totalSpace: total,
      usedSpace: used,
      badSectors: bad,
      readErrors: re,
      writeErrors: we,
      smartStatus,
      estimatedLifespan: life,
    };

    try {
      const result = await diagnosticService.runStorageHealth({
        deviceType,
        deviceName,
        storageData,
      });
      navigation.navigate('DiagnosticResult', { result, testType: 'Storage Health' });
    } catch (error) {
      console.error('Storage health error:', error);
      
      let severity = 'Low';
      let issue = 'Storage health is good';
      let solution = 'No action needed. Keep usage below 80% for best performance.';
      if (smartStatus === 'Failing' || bad > 10 || re + we >= 5) {
        severity = 'Critical';
        issue = 'Storage device is failing';
        solution =
          'Back up data immediately and replace the drive. Continued use risks permanent data loss.';
      } else if (smartStatus === 'Degraded' || life < 50 || (used / total) > 0.95) {
        severity = 'High';
        issue = 'Storage drive degrading or nearly full';
        solution =
          'Back up important data. Free at least 20% of total space. Reconsider replacing the drive soon.';
      } else if (bad > 0 || life < 80) {
        severity = 'Medium';
        issue = 'Storage showing wear';
        solution = 'Watch for read/write errors over the next few weeks. Plan a replacement within 6-12 months.';
      }
      navigation.navigate('DiagnosticResult', {
        result: {
          _id: 'mock-' + Date.now(),
          deviceType,
          deviceName,
          testType: 'storage-health',
          diagnosis: {
            issue,
            severity,
            confidence: 80,
            affectedComponents: ['Storage drive', 'File system'],
            rootCause: `${Math.round((used / total) * 100)}% used, SMART: ${smartStatus}, ${bad} bad sectors, ${re + we} I/O errors, ${life}% lifespan left${notes ? ` (${notes})` : ''}`,
            solution,
            estimatedCost: { min: 2500, max: 8000, currency: 'INR' },
            urgency: severity === 'Critical' ? 'immediate' : 'within-month',
            diyPossible: true,
            preventiveMeasures: ['Back up regularly', 'Keep at least 20% free'],
          },
          status: 'completed',
          createdAt: new Date().toISOString(),
        },
        testType: 'Storage Health',
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
        <Text style={styles.headerTitle}>Storage Health</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.instructionCard}>
          <Ionicons name="save-outline" size={24} color={COLORS.primary} />
          <Text style={styles.instructionText}>
            Enter SMART values from CrystalDiskInfo (Windows), smartctl (Linux), or Drive
           Dx (macOS). Plain space values from File Explorer / About screen are fine too.
          </Text>
        </View>

        <Field label="Total capacity (GB)" value={totalSpace} onChange={setTotalSpace} placeholder="e.g. 512" />
        <Field label="Used space (GB)" value={usedSpace} onChange={setUsedSpace} placeholder="e.g. 256" />
        <Field label="Bad sectors (count)" value={badSectors} onChange={setBadSectors} placeholder="0" />
        <Field label="Read errors" value={readErrors} onChange={setReadErrors} placeholder="0" />
        <Field label="Write errors" value={writeErrors} onChange={setWriteErrors} placeholder="0" />
        <Field label="Estimated lifespan remaining (%)" value={lifespan} onChange={setLifespan} placeholder="e.g. 85" />

        <Text style={styles.label}>SMART status</Text>
        <View style={styles.row}>
          {SMART_OPTIONS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.tag, smartStatus === s && styles.tagActive]}
              onPress={() => setSmartStatus(s)}
            >
              <Text style={[styles.tagText, smartStatus === s && styles.tagTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder="Strange noises? Slow file copies?"
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
              <Ionicons name="server-outline" size={22} color={COLORS.white} />
              <Text style={styles.analyzeButtonText}>Run Storage Health</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={20} color={COLORS.primary} />
          <Text style={styles.tipText}>
            Don't have SMART values? Run "smartctl -a /dev/sda" in Linux, CrystalDiskInfo on
            Windows, or DriveDx on macOS — values will appear within seconds.
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
  tipText: { flex: 1, marginLeft: 12, fontSize: 13, color: COLORS.text, lineHeight: 18 },
});

export default StorageHealthScreen;

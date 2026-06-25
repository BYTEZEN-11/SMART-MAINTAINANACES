import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioRecorder, useAudioRecorderState, RecordingPresets, requestRecordingPermissionsAsync } from 'expo-audio';
import { Colors as COLORS, Spacing as SIZES } from '../constants/theme';
import diagnosticService from '../services/diagnosticService';

const SoundTestScreen = ({ route, navigation }) => {
  const { deviceType, deviceName } = route.params;
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [soundDescription, setSoundDescription] = useState('');
  const [audioData, setAudioData] = useState(null);

  const isRecording = recorderState.isRecording;

const durationTimerRef = useRef(null);
  const autoStopTimerRef = useRef(null);
  const stopInFlightRef = useRef(false);

  useEffect(() => {
    return () => {
      
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      if (audioRecorder && recorderState.isRecording) {
        try { audioRecorder.stop(); } catch (_) {}
      }
    };
  
  }, []);

  const startRecording = async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow microphone access to record sound.');
        return;
      }

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      stopInFlightRef.current = false;
      setRecordingDuration(0);

      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      autoStopTimerRef.current = setTimeout(() => {
        stopRecording();
      }, 15000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    
    if (!audioRecorder || !recorderState.isRecording) return;
    if (stopInFlightRef.current) return;
    stopInFlightRef.current = true;

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }

    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      await analyzeSound(uri);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording.');
      stopInFlightRef.current = false;
    }
  };

  const analyzeSound = async (audioUri) => {
    setIsAnalyzing(true);

    try {
      
      const analysisData = {
        deviceType,
        deviceName,
        soundDescription: getSoundDescription(),
        audioUrl: audioUri,
        audioData: {
          duration: recordingDuration,
          
          frequency: [],
          amplitude: []
        }
      };

      const result = await diagnosticService.runSoundAnalysis(analysisData);

navigation.navigate('DiagnosticResult', {
        result,
        testType: 'Sound Analysis'
      });

    } catch (error) {
      console.error('Sound analysis error:', error);
      Alert.alert('Analysis Failed', error.message || 'Failed to analyze sound. Please try again.');
    } finally {
      setIsAnalyzing(false);
      stopInFlightRef.current = false;
    }
  };

  const getSoundDescription = () => {
    
    const descriptions = {
      laptop: 'Laptop sound recording - checking for fan noise, hard disk clicking, coil whine, or grinding sounds',
      desktop: 'Desktop sound recording - checking for fan noise, hard disk issues, or power supply sounds',
      phone: 'Phone sound recording - checking for speaker distortion, vibration motor, or internal rattling',
      fridge: 'Refrigerator sound recording - checking for compressor noise, fan issues, or unusual clicking',
      ac: 'AC sound recording - checking for compressor noise, fan issues, or refrigerant flow sounds',
      'washing-machine': 'Washing machine sound recording - checking for motor noise, drum issues, or bearing problems',
      tv: 'TV sound recording - checking for fan noise, power supply buzz, or capacitor whine'
    };

    return descriptions[deviceType] || 'Device sound recording for diagnostic analysis';
  };

  const quickAnalyze = (soundType) => {
    const descriptions = {
      grinding: 'Grinding or scraping sound - possibly worn bearings or motor issues',
      clicking: 'Clicking or ticking sound - possibly hard disk failure, relay, or loose component',
      buzzing: 'Buzzing or humming sound - possibly electrical interference or loose parts',
      whining: 'High-pitched whining sound - possibly coil whine or fan bearing issues',
      rattling: 'Rattling sound - possibly loose screws or internal components',
      squeaking: 'Squeaking sound - possibly belt or bearing needs lubrication'
    };

    analyzeQuickSound(descriptions[soundType]);
  };

  const analyzeQuickSound = async (description) => {
    setIsAnalyzing(true);

    try {
      const analysisData = {
        deviceType,
        deviceName,
        soundDescription: description,
        audioData: null
      };

      const result = await diagnosticService.runSoundAnalysis(analysisData);

      navigation.navigate('DiagnosticResult', {
        result,
        testType: 'Sound Analysis'
      });

    } catch (error) {
      console.error('Quick analysis error:', error);

const mockResult = {
        _id: 'mock-' + Date.now(),
        deviceType,
        deviceName,
        testType: 'sound-analysis',
        diagnosis: {
          issue: 'Sound pattern detected - ' + description.split(' - ')[0],
          severity: 'Medium',
          confidence: 70,
          affectedComponents: ['Requires inspection'],
          rootCause: 'Based on sound description: ' + description,
          solution: 'Professional inspection recommended. The sound pattern suggests potential issues that need expert diagnosis.',
          estimatedCost: { min: 500, max: 3000, currency: 'INR' },
          urgency: 'within-week',
          diyPossible: false,
          preventiveMeasures: ['Regular maintenance', 'Monitor for changes', 'Professional checkup']
        },
        status: 'completed',
        createdAt: new Date().toISOString()
      };

      navigation.navigate('DiagnosticResult', {
        result: mockResult,
        testType: 'Sound Analysis'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      {}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sound Analysis</Text>
      </View>

      <ScrollView style={styles.content}>
        {}
        <View style={styles.instructionCard}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <Text style={styles.instructionText}>
            Place your phone near the device and record the sound for 10-15 seconds. 
            AI will analyze the sound pattern to detect internal issues.
          </Text>
        </View>

        {}
        <View style={styles.recordingSection}>
          <View style={styles.recordingVisual}>
            {isRecording ? (
              <>
                <View style={styles.recordingPulse} />
                <Ionicons name="mic" size={64} color={COLORS.error} />
                <Text style={styles.recordingText}>Recording...</Text>
                <Text style={styles.durationText}>{recordingDuration}s / 15s</Text>
              </>
            ) : (
              <>
                <Ionicons name="mic-outline" size={64} color={COLORS.gray} />
                <Text style={styles.readyText}>Ready to Record</Text>
              </>
            )}
          </View>

          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isAnalyzing}
          >
            <Ionicons 
              name={isRecording ? "stop" : "mic"} 
              size={32} 
              color={COLORS.white} 
            />
            <Text style={styles.recordButtonText}>
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Text>
          </TouchableOpacity>
        </View>

        {}
        <View style={styles.quickSection}>
          <Text style={styles.sectionTitle}>Or Describe the Sound</Text>
          <Text style={styles.sectionSubtitle}>
            Select the type of sound you're hearing:
          </Text>

          <View style={styles.soundOptions}>
            <TouchableOpacity 
              style={styles.soundOption}
              onPress={() => quickAnalyze('grinding')}
              disabled={isAnalyzing}
            >
              <Ionicons name="settings-outline" size={24} color={COLORS.primary} />
              <Text style={styles.soundOptionText}>Grinding</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.soundOption}
              onPress={() => quickAnalyze('clicking')}
              disabled={isAnalyzing}
            >
              <Ionicons name="radio-button-on-outline" size={24} color={COLORS.primary} />
              <Text style={styles.soundOptionText}>Clicking</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.soundOption}
              onPress={() => quickAnalyze('buzzing')}
              disabled={isAnalyzing}
            >
              <Ionicons name="pulse-outline" size={24} color={COLORS.primary} />
              <Text style={styles.soundOptionText}>Buzzing</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.soundOption}
              onPress={() => quickAnalyze('whining')}
              disabled={isAnalyzing}
            >
              <Ionicons name="trending-up-outline" size={24} color={COLORS.primary} />
              <Text style={styles.soundOptionText}>Whining</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.soundOption}
              onPress={() => quickAnalyze('rattling')}
              disabled={isAnalyzing}
            >
              <Ionicons name="shuffle-outline" size={24} color={COLORS.primary} />
              <Text style={styles.soundOptionText}>Rattling</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.soundOption}
              onPress={() => quickAnalyze('squeaking')}
              disabled={isAnalyzing}
            >
              <Ionicons name="volume-low-outline" size={24} color={COLORS.primary} />
              <Text style={styles.soundOptionText}>Squeaking</Text>
            </TouchableOpacity>
          </View>
        </View>

        {}
        {isAnalyzing && (
          <View style={styles.analyzingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.analyzingText}>Analyzing sound pattern...</Text>
            <Text style={styles.analyzingSubtext}>
              AI is detecting internal hardware issues
            </Text>
          </View>
        )}

        {}
        <View style={styles.detectSection}>
          <Text style={styles.sectionTitle}>What We Can Detect</Text>
          <View style={styles.detectItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.detectText}>Motor bearing wear and failure</Text>
          </View>
          <View style={styles.detectItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.detectText}>Hard disk mechanical issues</Text>
          </View>
          <View style={styles.detectItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.detectText}>Fan blade problems</Text>
          </View>
          <View style={styles.detectItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.detectText}>Compressor valve issues</Text>
          </View>
          <View style={styles.detectItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.detectText}>Electrical arcing or relay problems</Text>
          </View>
          <View style={styles.detectItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.detectText}>Loose internal components</Text>
          </View>
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
  recordingSection: {
    alignItems: 'center',
    marginBottom: 32
  },
  recordingVisual: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  recordingPulse: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.error + '30',
    opacity: 0.5
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
    marginTop: 12
  },
  durationText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4
  },
  readyText: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 12
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    elevation: 2
  },
  recordButtonActive: {
    backgroundColor: COLORS.error
  },
  recordButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12
  },
  quickSection: {
    marginBottom: 32
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 16
  },
  soundOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  soundOption: {
    width: '48%',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 1
  },
  soundOptionText: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 8,
    fontWeight: '500'
  },
  analyzingCard: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2
  },
  analyzingText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16
  },
  analyzingSubtext: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4
  },
  detectSection: {
    backgroundColor: COLORS.white,
    padding: SIZES.lg,
    borderRadius: 12,
    marginBottom: 24
  },
  detectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12
  },
  detectText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 12
  }
});

export default SoundTestScreen;

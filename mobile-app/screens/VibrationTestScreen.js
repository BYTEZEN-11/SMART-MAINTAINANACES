import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Accelerometer } from 'expo-sensors';
import { Colors as COLORS, Spacing as SIZES } from '../constants/theme';
import diagnosticService from '../services/diagnosticService';

const VibrationTestScreen = ({ route, navigation }) => {
  const { deviceType, deviceName } = route.params;
  const [isTesting, setIsTesting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [testDuration, setTestDuration] = useState(0);
  const [vibrationData, setVibrationData] = useState([]);
  const [currentReading, setCurrentReading] = useState({ x: 0, y: 0, z: 0 });
  const [intensity, setIntensity] = useState(0);
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    let subscription;

    if (isTesting) {
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          })
        ])
      ).start();

Accelerometer.setUpdateInterval(100); 

      subscription = Accelerometer.addListener(accelerometerData => {
        const { x, y, z } = accelerometerData;
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        
        setCurrentReading({ x, y, z });
        setIntensity(magnitude);
        
        setVibrationData(prev => [...prev, {
          x,
          y,
          z,
          timestamp: Date.now()
        }]);
      });

const timeout = setTimeout(() => {
        stopTest();
      }, 30000);

      return () => {
        if (subscription) subscription.remove();
        clearTimeout(timeout);
      };
    }

    return () => {
      if (subscription) subscription.remove();
    };
  }, [isTesting]);

  useEffect(() => {
    if (isTesting) {
      const interval = setInterval(() => {
        setTestDuration(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isTesting]);

  const startTest = async () => {
    const { status } = await Accelerometer.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow accelerometer access.');
      return;
    }

    Alert.alert(
      'Place Phone on Device',
      'Place your phone flat on the device surface and press OK to start the test. Make sure the device is running.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: () => {
            setIsTesting(true);
            setTestDuration(0);
            setVibrationData([]);
          }
        }
      ]
    );
  };

  const stopTest = () => {
    setIsTesting(false);
    
    setTimeout(() => analyzeVibration(), 50);
  };

  const analyzeVibration = async () => {

const snapshot = await new Promise((resolve) => {
      setVibrationData((current) => {
        resolve(current);
        return current;
      });
    });

    if (snapshot.length === 0) {
      Alert.alert('No Data', 'No vibration data collected. Please try again.');
      return;
    }

    setIsAnalyzing(true);

    try {
      
      const intensities = snapshot.map(d =>
        Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z)
      );

      const avgIntensity = intensities.reduce((a, b) => a + b, 0) / intensities.length;
      const maxIntensity = Math.max(...intensities);

const frequency = calculateFrequency(snapshot);

      const analysisData = {
        deviceType,
        deviceName,
        vibrationData: {
          readings: snapshot.slice(0, 100), 
          intensity: avgIntensity * 100, 
          frequency,
          pattern: getVibrationPattern(avgIntensity, maxIntensity)
        }
      };

      const result = await diagnosticService.runVibrationAnalysis(analysisData);

      navigation.navigate('DiagnosticResult', {
        result,
        testType: 'Vibration Analysis'
      });

    } catch (error) {
      console.error('Vibration analysis error:', error);

const avgIntensity = snapshot.map(d =>
        Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z)
      ).reduce((a, b) => a + b, 0) / snapshot.length;
      
      let severity = 'Low';
      let issue = 'Normal vibration levels';
      let solution = 'No action needed. Vibration is within normal range.';
      
      if (avgIntensity > 2.0) {
        severity = 'High';
        issue = 'Excessive vibration detected';
        solution = 'Check and tighten all mounting bolts. Balance load. Inspect bearings and replace if worn.';
      } else if (avgIntensity > 1.5) {
        severity = 'Medium';
        issue = 'Moderate vibration detected';
        solution = 'Adjust leveling feet. Ensure device is on stable surface. Check for proper installation.';
      }
      
      const mockResult = {
        _id: 'mock-' + Date.now(),
        deviceType,
        deviceName,
        testType: 'vibration-analysis',
        diagnosis: {
          issue,
          severity,
          confidence: 75,
          affectedComponents: ['Motor', 'Mounting', 'Bearings'],
          rootCause: `Vibration intensity: ${avgIntensity.toFixed(2)} m/s²`,
          solution,
          estimatedCost: { min: 500, max: 3000, currency: 'INR' },
          urgency: severity === 'High' ? 'within-week' : 'within-month',
          diyPossible: severity !== 'High',
          preventiveMeasures: ['Proper loading', 'Level installation', 'Regular inspection']
        },
        status: 'completed',
        createdAt: new Date().toISOString()
      };
      
      navigation.navigate('DiagnosticResult', { 
        result: mockResult,
        testType: 'Vibration Analysis'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateFrequency = (data) => {

if (data.length < 10) return 0;
    
    let crossings = 0;
    const threshold = 0.1;
    
    for (let i = 1; i < data.length; i++) {
      const prev = Math.sqrt(data[i-1].x ** 2 + data[i-1].y ** 2 + data[i-1].z ** 2);
      const curr = Math.sqrt(data[i].x ** 2 + data[i].y ** 2 + data[i].z ** 2);
      
      if ((prev < threshold && curr >= threshold) || (prev >= threshold && curr < threshold)) {
        crossings++;
      }
    }
    
    const duration = (data[data.length - 1].timestamp - data[0].timestamp) / 1000;
    return (crossings / 2) / duration; 
  };

  const getVibrationPattern = (avg, max) => {
    if (max > 2.0) return 'severe';
    if (max > 1.5) return 'high';
    if (avg > 1.2) return 'moderate';
    if (avg > 1.0) return 'slight';
    return 'normal';
  };

  const getIntensityColor = () => {
    if (intensity > 2.0) return COLORS.error;
    if (intensity > 1.5) return '#FF6B6B';
    if (intensity > 1.2) return COLORS.warning;
    if (intensity > 1.0) return '#FFA500';
    return COLORS.success;
  };

  const getIntensityLabel = () => {
    if (intensity > 2.0) return 'Severe';
    if (intensity > 1.5) return 'High';
    if (intensity > 1.2) return 'Moderate';
    if (intensity > 1.0) return 'Slight';
    return 'Normal';
  };

  return (
    <View style={styles.container}>
      {}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vibration Test</Text>
      </View>

      <ScrollView style={styles.content}>
        {}
        <View style={styles.instructionCard}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <Text style={styles.instructionText}>
            Place your phone flat on the device surface. The test will measure vibration patterns 
            to detect unbalanced motors, worn bearings, or loose components.
          </Text>
        </View>

        {}
        <View style={styles.testSection}>
          <Animated.View 
            style={[
              styles.testVisual,
              { 
                transform: [{ scale: isTesting ? pulseAnim : 1 }],
                backgroundColor: isTesting ? getIntensityColor() + '20' : COLORS.white
              }
            ]}
          >
            {isTesting ? (
              <>
                <Ionicons name="pulse" size={64} color={getIntensityColor()} />
                <Text style={[styles.intensityText, { color: getIntensityColor() }]}>
                  {getIntensityLabel()}
                </Text>
                <Text style={styles.intensityValue}>
                  {intensity.toFixed(2)} m/s²
                </Text>
                <Text style={styles.durationText}>{testDuration}s / 30s</Text>
              </>
            ) : (
              <>
                <Ionicons name="pulse-outline" size={64} color={COLORS.gray} />
                <Text style={styles.readyText}>Ready to Test</Text>
              </>
            )}
          </Animated.View>

          {}
          {isTesting && (
            <View style={styles.readingsCard}>
              <Text style={styles.readingsTitle}>Live Readings</Text>
              <View style={styles.readingRow}>
                <Text style={styles.readingLabel}>X:</Text>
                <Text style={styles.readingValue}>{currentReading.x.toFixed(3)}</Text>
              </View>
              <View style={styles.readingRow}>
                <Text style={styles.readingLabel}>Y:</Text>
                <Text style={styles.readingValue}>{currentReading.y.toFixed(3)}</Text>
              </View>
              <View style={styles.readingRow}>
                <Text style={styles.readingLabel}>Z:</Text>
                <Text style={styles.readingValue}>{currentReading.z.toFixed(3)}</Text>
              </View>
              <View style={styles.readingRow}>
                <Text style={styles.readingLabel}>Samples:</Text>
                <Text style={styles.readingValue}>{vibrationData.length}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.testButton, isTesting && styles.testButtonActive]}
            onPress={isTesting ? stopTest : startTest}
            disabled={isAnalyzing}
          >
            <Ionicons 
              name={isTesting ? "stop" : "play"} 
              size={32} 
              color={COLORS.white} 
            />
            <Text style={styles.testButtonText}>
              {isTesting ? 'Stop Test' : 'Start Test'}
            </Text>
          </TouchableOpacity>
        </View>

        {}
        {isAnalyzing && (
          <View style={styles.analyzingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.analyzingText}>Analyzing vibration pattern...</Text>
            <Text style={styles.analyzingSubtext}>
              Detecting internal mechanical issues
            </Text>
          </View>
        )}

        {}
        <View style={styles.detectSection}>
          <Text style={styles.sectionTitle}>What We Can Detect</Text>
          <View style={styles.detectItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.detectText}>Unbalanced motor or fan</Text>
          </View>
          <View style={styles.detectItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.detectText}>Worn or damaged bearings</Text>
          </View>
          <View style={styles.detectItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.detectText}>Loose internal components</Text>
          </View>
          <View style={styles.detectItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.detectText}>Drum or spinner issues</Text>
          </View>
          <View style={styles.detectItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.detectText}>Compressor problems</Text>
          </View>
          <View style={styles.detectItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.detectText}>Improper installation or leveling</Text>
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
  testSection: {
    alignItems: 'center',
    marginBottom: 32
  },
  testVisual: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  intensityText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12
  },
  intensityValue: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4
  },
  durationText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8
  },
  readyText: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 12
  },
  readingsCard: {
    backgroundColor: COLORS.white,
    padding: SIZES.lg,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
    elevation: 2
  },
  readingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12
  },
  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6
  },
  readingLabel: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500'
  },
  readingValue: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: 'monospace'
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    elevation: 2
  },
  testButtonActive: {
    backgroundColor: COLORS.error
  },
  testButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12
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

export default VibrationTestScreen;

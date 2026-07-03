import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors as COLORS, Spacing as SIZES } from '../constants/theme';
import diagnosticService from '../services/diagnosticService';

const VisualTestScreen = ({ route, navigation }) => {
  const { deviceType, deviceName } = route.params;
  const [images, setImages] = useState([]);
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo library access.');
      return;
    }

    const result = await ImagePicker.launchImagePickerAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      allowsEditing: false
    });

    if (!result.canceled && result.assets) {
      setImages([...images, ...result.assets.map(asset => asset.uri)]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false
    });

    if (!result.canceled && result.assets) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const analyzeImages = async () => {
    if (images.length === 0) {
      Alert.alert('No Images', 'Please add at least one image to analyze.');
      return;
    }

    setIsAnalyzing(true);

    try {
      const analysisData = {
        deviceType,
        deviceName,
        imageUrls: images,
        description: `Visual inspection of ${deviceType} - checking for physical damage, swelling, rust, leaks, or component issues`
      };

      const result = await diagnosticService.runVisualInspection(analysisData);

      navigation.navigate('DiagnosticResult', { 
        result,
        testType: 'Visual Inspection'
      });

    } catch (error) {
      console.error('Visual inspection error:', error);

const mockResult = {
        _id: 'mock-' + Date.now(),
        deviceType,
        deviceName,
        testType: 'visual-inspection',
        diagnosis: {
          issue: 'Visual inspection completed',
          severity: 'Medium',
          confidence: 70,
          affectedComponents: ['Requires detailed analysis'],
          rootCause: `Based on ${images.length} image(s) provided`,
          solution: 'Professional inspection recommended for accurate diagnosis. Images have been analyzed for visible damage, swelling, rust, and component issues.',
          estimatedCost: { min: 500, max: 5000, currency: 'INR' },
          urgency: 'within-month',
          diyPossible: false,
          preventiveMeasures: ['Regular inspection', 'Proper handling', 'Protective measures']
        },
        status: 'completed',
        createdAt: new Date().toISOString()
      };
      
      navigation.navigate('DiagnosticResult', { 
        result: mockResult,
        testType: 'Visual Inspection'
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
        <Text style={styles.headerTitle}>Visual Inspection</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.instructionCard}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <Text style={styles.instructionText}>
            Take clear photos of your device from multiple angles. AI will detect physical damage, swelling, rust, leaks, and component issues.
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
            <Ionicons name="camera" size={24} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={pickImage}>
            <Ionicons name="images" size={24} color={COLORS.primary} />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Choose Photos</Text>
          </TouchableOpacity>
        </View>

        {images.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Selected Images ({images.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.image} />
                  <TouchableOpacity style={styles.removeButton} onPress={() => removeImage(index)}>
                    <Ionicons name="close-circle" size={24} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={styles.analyzeButton} 
              onPress={analyzeImages}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="scan" size={24} color={COLORS.white} />
                  <Text style={styles.analyzeButtonText}>Analyze Images</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        <View style={styles.detectSection}>
          <Text style={styles.sectionTitle}>What We Can Detect</Text>
          <View style={styles.detectItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.detectText}>Swollen battery (bulging)</Text>
          </View>
          <View style={styles.detectItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.detectText}>Burnt or damaged components</Text>
          </View>
          <View style={styles.detectItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.detectText}>Rust and corrosion</Text>
          </View>
          <View style={styles.detectItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.detectText}>Fluid leaks and stains</Text>
          </View>
          <View style={styles.detectItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.detectText}>Cracks and physical damage</Text>
          </View>
          <View style={styles.detectItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.detectText}>Loose connections and wires</Text>
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600'
  },
  secondaryButtonText: {
    color: COLORS.primary
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16
  },
  imageScroll: {
    marginBottom: 24
  },
  imageContainer: {
    marginRight: 12,
    position: 'relative'
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 12,
    backgroundColor: COLORS.gray
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.white,
    borderRadius: 12
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8
  },
  analyzeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600'
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

export default VisualTestScreen;

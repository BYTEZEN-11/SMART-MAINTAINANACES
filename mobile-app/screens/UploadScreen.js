import React, { useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  TextInput, ActivityIndicator, Alert, ScrollView, Platform
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { uploadFile } from "../services/storageService";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Colors, Spacing, Radius, Shadow, FontSize } from "../constants/theme";

export default function UploadScreen({ navigation, route }) {
  const { clearToken } = useAuth();
  const applianceId = route.params?.applianceId;
  const [media, setMedia] = useState(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.8,
    });
    if (!result.canceled) setMedia(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert("Permission denied", "Camera access is required");
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) setMedia(result.assets[0].uri);
  };

  const handleAnalyze = async () => {
    if (!media && !description.trim())
      return Alert.alert("Add Content", "Please add an image or describe the issue");

    try {
      setLoading(true);
      let imageUrl = null;

if (media) {
        try {
          console.log("Uploading image to cloud storage (Supabase → Firebase → Backend)...");
          imageUrl = await uploadFile(media, "issue.jpg");
          console.log("Image uploaded successfully:", imageUrl);
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          
          if (!description.trim()) {
            return Alert.alert("Upload Failed", "Image upload failed and no description provided. Please try again.");
          }
          Alert.alert(
            "Upload Warning", 
            "Image upload failed, but we'll analyze your description."
          );
        }
      }

      if (!description.trim() && !imageUrl) {
        return Alert.alert("No Content", "Please provide a description or upload an image");
      }

      console.log("Sending to AI for analysis...");
      const res = await api.post("/api/ai/analyze", {
        text: description.trim(),
        imageUrl,
        applianceId,
      });
      
      console.log("AI analysis complete");

setMedia(null);
      setDescription("");

navigation.navigate("AIResponse", { 
        result: res.data, 
        imageUrl: media 
      });
    } catch (err) {
      console.error("Analysis error:", err);

if (err.message && err.message.includes('Not authorized')) {
        Alert.alert(
          "Session Expired", 
          "Your session has expired. Please login again to use AI features.",
          [
            { text: "CANCEL", style: "cancel" },
            { 
              text: "LOGIN", 
              onPress: async () => {
                try {
                  
                  await signOut(auth);
                  
                  await clearToken();
                  
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  });
                } catch (logoutErr) {
                  console.error("Logout error:", logoutErr);
                  
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  });
                }
              }
            }
          ]
        );
      } else {
        Alert.alert(
          "Analysis Failed", 
          err.message || "Could not analyze the issue. Please check your connection and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {}
      <View style={styles.header}>
        <Text style={styles.title}>Report an Issue</Text>
        <Text style={styles.subtitle}>Upload media or describe the problem for AI analysis</Text>
      </View>

      {}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Attach Media</Text>

        {media ? (
          <View style={styles.previewContainer}>
            <Image 
              source={{ uri: media }} 
              style={styles.preview}
              resizeMode="cover"
            />
            <TouchableOpacity 
              style={styles.removeBtn} 
              onPress={() => setMedia(null)}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={32} color={Colors.danger} />
            </TouchableOpacity>
            <View style={styles.previewBadge}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.previewBadgeText}>Photo attached</Text>
            </View>
          </View>
        ) : (
          <View style={styles.uploadArea}>
            <MaterialCommunityIcons name="image-plus" size={48} color={Colors.gray400} />
            <Text style={styles.uploadTitle}>Add a photo or video</Text>
            <Text style={styles.uploadSubtitle}>Helps AI detect the issue more accurately</Text>
          </View>
        )}

        <View style={styles.mediaButtons}>
          <TouchableOpacity style={styles.mediaBtn} onPress={takePhoto} activeOpacity={0.8}>
            <Ionicons name="camera-outline" size={20} color={Colors.primary} />
            <Text style={styles.mediaBtnText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaBtn} onPress={pickFromGallery} activeOpacity={0.8}>
            <Ionicons name="images-outline" size={20} color={Colors.primary} />
            <Text style={styles.mediaBtnText}>Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>

      {}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Describe the Issue</Text>
        <View style={styles.textAreaBox}>
          <TextInput
            style={styles.textArea}
            placeholder="e.g. My AC is making a loud noise and not cooling properly..."
            placeholderTextColor={Colors.gray400}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>
        <Text style={styles.charCount}>{description.length} characters</Text>
      </View>

      {}
      <View style={styles.tipCard}>
        <Ionicons name="bulb-outline" size={18} color={Colors.warning} />
        <Text style={styles.tipText}>
          For best results, include both a clear photo and a detailed description of the issue.
        </Text>
      </View>

      {}
      <TouchableOpacity
        style={[styles.analyzeBtn, loading && { opacity: 0.7 }]}
        onPress={handleAnalyze}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.white} />
            <Text style={styles.analyzeBtnText}>Analyzing with AI...</Text>
          </View>
        ) : (
          <View style={styles.loadingRow}>
            <MaterialCommunityIcons name="robot-outline" size={22} color={Colors.white} />
            <Text style={styles.analyzeBtnText}>Analyze with AI</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.white, padding: Spacing.lg,
    paddingTop: Spacing.xl, ...Shadow.sm,
  },
  title: { fontSize: FontSize.xxl, fontWeight: "700", color: Colors.text },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },

  section: { backgroundColor: Colors.white, margin: Spacing.lg, marginBottom: 0, borderRadius: Radius.xl, padding: Spacing.lg, ...Shadow.sm },
  sectionLabel: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text, marginBottom: Spacing.md },

  uploadArea: {
    borderWidth: 2, borderColor: Colors.border, borderStyle: "dashed",
    borderRadius: Radius.lg, padding: Spacing.xl, alignItems: "center", gap: Spacing.sm,
    backgroundColor: Colors.gray100,
  },
  uploadTitle: { fontSize: FontSize.md, fontWeight: "600", color: Colors.gray700 },
  uploadSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: "center" },

  previewContainer: { 
    position: "relative", 
    borderRadius: Radius.lg, 
    overflow: "hidden",
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    marginBottom: Spacing.sm
  },
  preview: { 
    width: "100%", 
    height: 250, 
    borderRadius: Radius.lg,
    backgroundColor: Colors.gray100
  },
  removeBtn: { 
    position: "absolute", 
    top: 12, 
    right: 12, 
    backgroundColor: Colors.white, 
    borderRadius: Radius.full,
    ...Shadow.lg
  },
  previewBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.successLight,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  previewBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.success,
  },

  mediaButtons: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md },
  mediaBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: Spacing.sm, borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: Radius.md, padding: 12, backgroundColor: Colors.primaryLight,
  },
  mediaBtnText: { color: Colors.primary, fontWeight: "600", fontSize: FontSize.sm },

  textAreaBox: {
    backgroundColor: Colors.gray100, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.md,
  },
  textArea: { fontSize: FontSize.md, color: Colors.text, minHeight: 100 },
  charCount: { fontSize: FontSize.xs, color: Colors.gray500, textAlign: "right", marginTop: 4 },

  tipCard: {
    flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm,
    backgroundColor: Colors.warningLight, marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg, borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: "#FDE68A",
  },
  tipText: { flex: 1, fontSize: FontSize.sm, color: Colors.gray700, lineHeight: 20 },

  analyzeBtn: {
    backgroundColor: Colors.primary, margin: Spacing.lg, borderRadius: Radius.lg,
    padding: 16, alignItems: "center", ...Shadow.lg,
  },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  analyzeBtnText: { color: Colors.white, fontWeight: "700", fontSize: FontSize.lg },
});

import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Image, ActivityIndicator, Alert
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, Shadow, FontSize } from "../constants/theme";
import api from "../services/api";

const SEVERITY_CONFIG = {
  low: { color: Colors.success, bg: Colors.successLight, icon: "checkmark-circle-outline", label: "Low Risk" },
  medium: { color: Colors.warning, bg: Colors.warningLight, icon: "alert-circle-outline", label: "Medium Risk" },
  high: { color: Colors.danger, bg: Colors.dangerLight, icon: "warning-outline", label: "High Risk" },
};

export default function AIResponseScreen({ route, navigation }) {
  const { result, imageUrl } = route.params || {};
  const [followUp, setFollowUp] = useState("");
  const [followUpResponse, setFollowUpResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!result) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="robot-confused-outline" size={64} color={Colors.gray400} />
        <Text style={styles.errorText}>No result available</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const severity = result.severity?.toLowerCase() || "low";
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.low;

  const solutionSteps = result.solution
    ? result.solution.split(/\n|\.(?=\s)/).filter(s => s.trim().length > 5)
    : ["No solution available"];

  const handleFollowUp = async () => {
    if (!followUp.trim()) return;

    try {
      setLoading(true);
      const res = await api.post("/api/ai/analyze", {
        text: followUp,
        context: `Previous issue: ${result.issue}. Previous solution: ${result.solution}`,
      });
      
      setFollowUpResponse(res.data);
      setFollowUp("");
      Alert.alert("AI Response", res.data.solution || res.data.issue || "Response received");
    } catch (err) {
      console.error("Follow-up error:", err);
      Alert.alert("Error", "Failed to get AI response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {}
      <View style={styles.aiHeader}>
        <View style={styles.aiIconCircle}>
          <MaterialCommunityIcons name="robot-outline" size={32} color={Colors.white} />
        </View>
        <Text style={styles.aiTitle}>AI Analysis Complete</Text>
        <Text style={styles.aiSubtitle}>Here's what our AI found</Text>
      </View>

      {}
      <View style={[styles.severityCard, { backgroundColor: config.bg, borderColor: config.color }]}>
        <Ionicons name={config.icon} size={28} color={config.color} />
        <View style={styles.severityInfo}>
          <Text style={styles.severityLabel}>Severity Level</Text>
          <Text style={[styles.severityValue, { color: config.color }]}>{config.label}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: config.color }]}>
          <Text style={styles.severityBadgeText}>{severity.toUpperCase()}</Text>
        </View>
      </View>

      {}
      {imageUrl && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="image-outline" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Uploaded Image</Text>
          </View>
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.uploadedImage}
            resizeMode="cover"
          />
        </View>
      )}

      {}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconBox, { backgroundColor: Colors.primaryLight }]}>
            <Ionicons name="search-outline" size={18} color={Colors.primary} />
          </View>
          <Text style={styles.cardTitle}>Issue Detected</Text>
        </View>
        <Text style={styles.cardContent}>{result.issue || "No specific issue detected"}</Text>
      </View>

      {}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconBox, { backgroundColor: Colors.successLight }]}>
            <Ionicons name="construct-outline" size={18} color={Colors.success} />
          </View>
          <Text style={styles.cardTitle}>Recommended Steps</Text>
        </View>
        {solutionSteps.map((step, index) => (
          <View key={index} style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step.trim()}</Text>
          </View>
        ))}
      </View>

      {}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconBox, { backgroundColor: "#F5F3FF" }]}>
            <Ionicons name="chatbubble-outline" size={18} color="#8B5CF6" />
          </View>
          <Text style={styles.cardTitle}>Ask a Follow-up</Text>
        </View>
        <View style={styles.chatInputRow}>
          <TextInput
            style={styles.chatInput}
            placeholder="Ask anything about this issue..."
            placeholderTextColor={Colors.gray400}
            value={followUp}
            onChangeText={setFollowUp}
            multiline
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!followUp.trim() || loading) && { opacity: 0.4 }]}
            disabled={!followUp.trim() || loading}
            onPress={handleFollowUp}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons name="send" size={18} color={Colors.white} />
            )}
          </TouchableOpacity>
        </View>
        {followUpResponse && (
          <View style={styles.followUpResponse}>
            <Text style={styles.followUpLabel}>AI Response:</Text>
            <Text style={styles.followUpText}>
              {followUpResponse.solution || followUpResponse.issue || "Response received"}
            </Text>
          </View>
        )}
      </View>

      {}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate("Upload")}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh-outline" size={18} color={Colors.primary} />
          <Text style={styles.secondaryBtnText}>New Report</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate("Home")}
          activeOpacity={0.85}
        >
          <Ionicons name="home-outline" size={18} color={Colors.white} />
          <Text style={styles.primaryBtnText}>Dashboard</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: Spacing.md, backgroundColor: Colors.background },
  errorText: { fontSize: FontSize.lg, color: Colors.textSecondary },
  backBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  backBtnText: { color: Colors.white, fontWeight: "700" },

  aiHeader: {
    backgroundColor: Colors.primary, padding: Spacing.xl,
    alignItems: "center", gap: Spacing.sm,
  },
  aiIconCircle: {
    width: 64, height: 64, borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center",
  },
  aiTitle: { fontSize: FontSize.xxl, fontWeight: "700", color: Colors.white },
  aiSubtitle: { fontSize: FontSize.sm, color: "rgba(255,255,255,0.8)" },

  severityCard: {
    flexDirection: "row", alignItems: "center", margin: Spacing.lg,
    borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1.5, gap: Spacing.md, ...Shadow.sm,
  },
  severityInfo: { flex: 1 },
  severityLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: "500" },
  severityValue: { fontSize: FontSize.xl, fontWeight: "800", marginTop: 2 },
  severityBadge: { borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 5 },
  severityBadgeText: { color: Colors.white, fontWeight: "700", fontSize: FontSize.xs },

  card: {
    backgroundColor: Colors.white, marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md, borderRadius: Radius.xl, padding: Spacing.lg, ...Shadow.sm,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.md },
  cardIconBox: { width: 36, height: 36, borderRadius: Radius.md, justifyContent: "center", alignItems: "center" },
  cardTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text },
  cardContent: { fontSize: FontSize.md, color: Colors.gray700, lineHeight: 24 },
  uploadedImage: { 
    width: "100%", 
    height: 200, 
    borderRadius: Radius.lg, 
    borderWidth: 2, 
    borderColor: Colors.border 
  },

  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm, marginBottom: Spacing.sm },
  stepNumber: {
    width: 24, height: 24, borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight, justifyContent: "center", alignItems: "center",
    marginTop: 2,
  },
  stepNumberText: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.primary },
  stepText: { flex: 1, fontSize: FontSize.sm, color: Colors.gray700, lineHeight: 22 },

  chatInputRow: { flexDirection: "row", alignItems: "flex-end", gap: Spacing.sm },
  chatInput: {
    flex: 1, backgroundColor: Colors.gray100, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.md,
    fontSize: FontSize.sm, color: Colors.text, maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: Radius.full,
    backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center",
  },
  followUpResponse: {
    marginTop: Spacing.md, padding: Spacing.md,
    backgroundColor: Colors.primaryLight, borderRadius: Radius.md,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  followUpLabel: {
    fontSize: FontSize.xs, fontWeight: "700",
    color: Colors.primary, marginBottom: 4,
  },
  followUpText: {
    fontSize: FontSize.sm, color: Colors.gray700, lineHeight: 20,
  },

  actionsRow: { flexDirection: "row", marginHorizontal: Spacing.lg, gap: Spacing.sm },
  secondaryBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: Spacing.sm, borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: Radius.lg, padding: 14, backgroundColor: Colors.primaryLight,
  },
  secondaryBtnText: { color: Colors.primary, fontWeight: "700", fontSize: FontSize.sm },
  primaryBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: 14, ...Shadow.lg,
  },
  primaryBtnText: { color: Colors.white, fontWeight: "700", fontSize: FontSize.sm },
});

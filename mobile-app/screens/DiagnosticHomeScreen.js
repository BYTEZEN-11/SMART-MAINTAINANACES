import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, StyleSheet
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import {
  Colors, Gradients, Spacing, Radius, Shadow, FontSize,
} from "../constants/theme";
import {
  GradientHero, GradientButton, GlassCard, IconBadge,
  GradientChip, DecorativeBlob, SectionHeader,
} from "../components/UI";
import diagnosticService from "../services/diagnosticService";

const DEVICE_CATEGORIES = [
  { id: "computers",     title: "Computers",       sub: "Laptop, desktop, Mac",     icon: "laptop-outline",           gradient: Gradients.diagnostics, color: Colors.catBlue,    light: Colors.catBlueLight },
  { id: "mobile",        title: "Mobile Devices",  sub: "Phone, tablet",            icon: "phone-portrait-outline",   gradient: Gradients.health,      color: Colors.catGreen,   light: Colors.catGreenLight },
  { id: "entertainment", title: "Entertainment",   sub: "TV, soundbar",             icon: "tv-outline",               gradient: Gradients.analytics,   color: Colors.catPurple,  light: Colors.catPurpleLight },
  { id: "appliances",    title: "Home Appliances", sub: "Fridge, AC, washer",       icon: "home-outline",             gradient: Gradients.alerts,      color: Colors.catOrange,  light: Colors.catOrangeLight },
  { id: "network",       title: "Network",         sub: "Router, modem",            icon: "wifi-outline",             gradient: Gradients.iot,         color: Colors.catTeal,    light: Colors.catTealLight },
  { id: "other",         title: "Other Devices",   sub: "Anything else",            icon: "construct-outline",        gradient: Gradients.rules,       color: Colors.catIndigo,  light: Colors.catIndigoLight },
];

const DIAGNOSTIC_FEATURES = [
  { icon: "volume-high-outline", label: "Sound Analysis",     gradient: Gradients.alerts },
  { icon: "pulse-outline",       label: "Vibration Detection",gradient: Gradients.diagnostics },
  { icon: "thermometer-outline", label: "Thermal Monitoring", gradient: Gradients.reports },
  { icon: "camera-outline",      label: "Visual Inspection",  gradient: Gradients.iot },
  { icon: "clipboard-outline",   label: "Symptom Checker",    gradient: Gradients.health },
  { icon: "speedometer-outline", label: "Performance Tests",  gradient: Gradients.rules },
];

const SEVERITY_GRADIENTS = {
  Critical: Gradients.danger,
  High:     Gradients.alerts,
  Medium:   Gradients.warning,
  Low:      Gradients.health,
};

const STAT_CONFIG = [
  { key: "totalTests",    label: "TOTAL",     icon: "pulse-outline",         gradient: Gradients.diagnostics },
  { key: "criticalIssues",label: "CRITICAL",  icon: "alert-circle-outline",  gradient: Gradients.danger },
  { key: "highIssues",    label: "HIGH",      icon: "warning-outline",       gradient: Gradients.alerts },
  { key: "lowIssues",     label: "LOW",       icon: "checkmark-circle-outline", gradient: Gradients.health },
];

export default function DiagnosticHomeScreen() {
  const navigation = useNavigation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const data = await diagnosticService.getStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
      setStats({
        overall: { totalTests: 0, criticalIssues: 0, highIssues: 0, mediumIssues: 0, lowIssues: 0 },
        byDeviceType: [], byTestType: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (category) => {
    navigation.navigate("DeviceSelection", { category });
  };

  const handleViewHistory = () => {
    Alert.alert("Coming Soon", "Diagnostic history feature will be available soon!");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading diagnostics…</Text>
      </View>
    );
  }

  const overall = stats?.overall || {};

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: Spacing.xxl }}
    >
      <GradientHero
        colors={Gradients.heroAurora}
        icon="pulse"
        iconFamily="Ionicons"
        title="Device Diagnostics"
        subtitle="AI-powered diagnostics for every device you own"
      />

      {}
      <View style={styles.statsRow}>
        {STAT_CONFIG.map((s) => (
          <View
            key={s.key}
            style={[
              styles.statPill,
              { backgroundColor: "#FFFFFF" },
              Shadow.colored(s.gradient[0], 0.25),
            ]}
          >
            <View style={[styles.statIcon, { backgroundColor: s.gradient[0] + "20" }]}>
              <Ionicons name={s.icon} size={16} color={s.gradient[0]} />
            </View>
            <Text style={[styles.statNumber, { color: s.gradient[1] }]}>
              {overall[s.key] || 0}
            </Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {}
      <TouchableOpacity style={styles.historyBtn} onPress={handleViewHistory} activeOpacity={0.85}>
        <Ionicons name="time-outline" size={18} color={Colors.primary} />
        <Text style={styles.historyText}>View diagnostic history</Text>
        <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
      </TouchableOpacity>

      {}
      <SectionHeader title="Pick a device category" />
      <Text style={styles.sectionLead}>
        Choose what you want to diagnose — we'll guide you from there.
      </Text>
      <View style={styles.categoriesWrap}>
        {DEVICE_CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.id}
            activeOpacity={0.85}
            onPress={() => handleCategoryPress(c)}
            style={[styles.categoryCard, { borderLeftColor: c.color }, Shadow.sm]}
          >
            <LinearGradientIcon name={c.icon} gradient={c.gradient} />
            <View style={{ flex: 1 }}>
              <Text style={styles.categoryTitle}>{c.title}</Text>
              <Text style={styles.categorySub}>{c.sub}</Text>
            </View>
            <GradientChip
              label={`${c.sub.split(",").length} TYPE${c.sub.split(",").length > 1 ? "S" : ""}`}
              color={c.color}
              light={c.light}
            />
            <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
          </TouchableOpacity>
        ))}
      </View>

      {}
      <SectionHeader title="What we can diagnose" />
      <View style={styles.featuresGrid}>
        {DIAGNOSTIC_FEATURES.map((f) => (
          <View
            key={f.label}
            style={[styles.featureChip, Shadow.sm]}
          >
            <LinearGradient
              colors={f.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.featureIconCircle}
            >
              <Ionicons name={f.icon} size={18} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.featureLabel}>{f.label}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: Spacing.lg }} />
    </ScrollView>
  );
}

const LinearGradientIcon = ({ name, gradient }) => (
  <LinearGradient
    colors={gradient}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.categoryIcon}
  >
    <Ionicons name={name} size={22} color="#FFFFFF" />
  </LinearGradient>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: {
    flex: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md, color: Colors.textSecondary,
    fontSize: FontSize.sm, fontWeight: "500",
  },

statsRow: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: Spacing.lg,
    marginTop: -Spacing.xl,
    gap: Spacing.sm, rowGap: Spacing.sm,
  },
  statPill: {
    flexBasis: "48%", flexGrow: 1,
    borderRadius: Radius.lg, padding: Spacing.md, alignItems: "center",
    borderWidth: 1.5, borderColor: Colors.border,
  },
  statIcon: {
    width: 32, height: 32, borderRadius: 12,
    justifyContent: "center", alignItems: "center", marginBottom: 6,
  },
  statNumber: { fontSize: FontSize.xxl, fontWeight: "800", letterSpacing: -0.5 },
  statLabel: {
    fontSize: 10, fontWeight: "700", color: Colors.textSecondary,
    marginTop: 2, letterSpacing: 0.4,
  },

historyBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: Spacing.sm, marginHorizontal: Spacing.lg, marginTop: Spacing.lg,
    paddingVertical: 12, backgroundColor: Colors.white,
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border,
    ...Shadow.sm,
  },
  historyText: {
    color: Colors.primary, fontWeight: "700", fontSize: FontSize.sm,
  },

  sectionLead: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.md, lineHeight: 20,
  },

categoriesWrap: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  categoryCard: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    backgroundColor: Colors.white, padding: Spacing.md,
    borderRadius: Radius.lg, borderLeftWidth: 4,
  },
  categoryIcon: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)",
  },
  categoryTitle: {
    fontSize: FontSize.md, fontWeight: "700", color: Colors.text,
    letterSpacing: -0.2,
  },
  categorySub: {
    fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2,
  },

featuresGrid: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: Spacing.lg, gap: Spacing.sm, rowGap: Spacing.sm,
  },
  featureChip: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
  },
  featureIconCircle: {
    width: 28, height: 28, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
  },
  featureLabel: {
    fontSize: FontSize.sm, fontWeight: "600", color: Colors.text,
  },
});
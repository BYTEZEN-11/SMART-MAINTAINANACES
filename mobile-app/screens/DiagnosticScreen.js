import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import api from "../services/api";
import { Colors, Spacing, Radius, FontSize, Shadow } from "../constants/theme";

const TESTS = [
  { key: "sound",         icon: "musical-notes-outline",      family: "Ionicons",                 label: "Sound test",        desc: "Detect abnormal noises from your appliance", route: "SoundTest" },
  { key: "vibration",     icon: "pulse-outline",              family: "Ionicons",                 label: "Vibration",         desc: "Measure motor vibration levels",           route: "VibrationTest" },
  { key: "visual",        icon: "eye-outline",                family: "Ionicons",                 label: "Visual inspection", desc: "Photo-based defect analysis",             route: "VisualTest" },
  { key: "thermal",       icon: "thermometer-outline",        family: "Ionicons",                 label: "Thermal scan",      desc: "Find hot spots and overheating",           route: "ThermalTest" },
  { key: "performance",   icon: "speedometer-outline",        family: "Ionicons",                 label: "Performance",       desc: "Benchmark runtime and response time",      route: "PerformanceTest" },
  { key: "battery",       icon: "battery-charging-outline",   family: "Ionicons",                 label: "Battery health",    desc: "Charge cycles and degradation",            route: "BatteryTest" },
  { key: "storage",       icon: "save-outline",               family: "Ionicons",                 label: "Storage health",    desc: "Disk usage and integrity",                 route: "StorageTest" },
  { key: "connectivity",  icon: "wifi-outline",               family: "Ionicons",                 label: "Connectivity",      desc: "Latency and signal quality",               route: "ConnectivityTest" },
  { key: "power",         icon: "flash-outline",              family: "Ionicons",                 label: "Power analysis",    desc: "Voltage and current stability",            route: "PowerTest" },
  { key: "comprehensive", icon: "analytics-outline",          family: "Ionicons",                 label: "Comprehensive",     desc: "Run every test back-to-back",              route: "ComprehensiveTest" },
];

const IconFor = ({ name, family }) => {
  const Comp = family === "MaterialCommunityIcons" ? MaterialCommunityIcons : Ionicons;
  return <Comp name={name} size={22} color={Colors.primary} />;
};

export default function DiagnosticScreen({ navigation }) {
  const [appliances, setAppliances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppliances = useCallback(async () => {
    try {
      const res = await api.get("/api/appliances");
      setAppliances(res.data?.data || []);
    } catch (err) {
      console.log("appliances fetch failed:", err?.message || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAppliances(); }, [fetchAppliances]);

  const handleTest = (route) => {
    if (appliances.length === 0) {
      Alert.alert("No appliance", "Add an appliance before running diagnostics.", [
        { text: "Add now", onPress: () => navigation.navigate("Add Appliance") },
        { text: "Cancel", style: "cancel" },
      ]);
      return;
    }
    navigation.navigate(route, { appliances });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchAppliances(); }}
          tintColor={Colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Run a diagnostic</Text>
        <Text style={styles.headerSub}>Pick the test that best matches your problem.</Text>
      </View>

      <View style={styles.grid}>
        {TESTS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={styles.tile}
            activeOpacity={0.85}
            onPress={() => handleTest(t.route)}
          >
            <View style={styles.iconCircle}>
              <IconFor name={t.icon} family={t.family} />
            </View>
            <Text style={styles.tileLabel}>{t.label}</Text>
            <Text style={styles.tileDesc} numberOfLines={2}>{t.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center:    { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },

  header: { padding: Spacing.lg },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.text },
  headerSub:   { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },

  grid: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md, rowGap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  tile: {
    width: "47%", flexGrow: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center", alignItems: "center",
    marginBottom: Spacing.sm,
  },
  tileLabel: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text },
  tileDesc:  { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4, lineHeight: 16 },
});
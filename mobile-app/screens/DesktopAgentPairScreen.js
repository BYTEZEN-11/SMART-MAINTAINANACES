import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors as COLORS, Spacing as SIZES } from "../constants/theme";
import desktopAgentService from "../services/desktopAgentService";

const DEFAULT_DEVICE_ID = "laptop-demo-001";

const MetricTile = ({ label, value, unit, color }) => (
  <View style={styles.tile}>
    <Text style={styles.tileLabel}>{label}</Text>
    <Text style={[styles.tileValue, color && { color }]}>
      {value ?? "—"}
      {unit ? <Text style={styles.tileUnit}> {unit}</Text> : null}
    </Text>
  </View>
);

const DesktopAgentPairScreen = ({ navigation }) => {
  const [pairCode, setPairCode] = useState(null);
  const [deviceId] = useState(DEFAULT_DEVICE_ID);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const [code, h] = await Promise.all([
        desktopAgentService.getPairCode(),
        desktopAgentService.getHealth(deviceId).catch(() => null),
      ]);
      setPairCode(code?.pairCode || "------");
      setHealth(h);
    } catch (e) {
      Alert.alert("Load failed", e?.message || "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [deviceId]);

  useEffect(() => { load(); }, [load]);

  const sendDemo = async () => {
    setSending(true);
    try {
      const payload = desktopAgentService.buildDemoPayload(deviceId);
      await desktopAgentService.ingestBatch(payload);
      await load();
      Alert.alert("Sample sent", "Demo payload ingested. Check the metrics below.");
    } catch (e) {
      Alert.alert("Ingest failed", e?.message || "Unknown error");
    } finally {
      setSending(false);
    }
  };

  const averages = health?.averages || {};
  const anomalies = health?.anomalies || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Desktop Agent</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={styles.pairCard}>
          <Text style={styles.pairLabel}>Pair this device with your laptop agent</Text>
          <Text style={styles.pairHint}>Enter this code in the AI-HMA companion app on your laptop.</Text>
          <View style={styles.codeBox}>
            <Text style={styles.code}>
              {loading ? "------" : pairCode || "------"}
            </Text>
          </View>
          <Text style={styles.deviceLine}>
            <Ionicons name="laptop-outline" size={14} color={COLORS.textLight} /> Device ID: {deviceId}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Health (last hour)</Text>
        <View style={styles.grid}>
          <MetricTile label="CPU temp" value={averages.cpuTemp ?? "—"} unit="°C"
            color={averages.cpuTemp >= 85 ? "#EF4444" : undefined} />
          <MetricTile label="GPU temp" value={averages.gpuTemp ?? "—"} unit="°C"
            color={averages.gpuTemp >= 85 ? "#EF4444" : undefined} />
          <MetricTile label="RAM used" value={averages.ramUsedPct ?? "—"} unit="%"
            color={averages.ramUsedPct >= 90 ? "#F59E0B" : undefined} />
          <MetricTile label="Battery" value={averages.batteryHealth ?? "—"} unit="%"
            color={averages.batteryHealth < 80 ? "#F59E0B" : COLORS.success || "#10B981"} />
        </View>

        {anomalies.length > 0 && (
          <View style={styles.anomBox}>
            <Text style={styles.sectionTitle}>Anomalies</Text>
            {anomalies.slice(0, 8).map((a, i) => (
              <View key={i} style={styles.anomLine}>
                <View
                  style={[
                    styles.sevDot,
                    {
                      backgroundColor:
                        a.severity === "critical" ? "#EF4444"
                          : a.severity === "high" ? "#F59E0B"
                          : a.severity === "medium" ? "#FBBF24"
                          : "#10B981",
                    },
                  ]}
                />
                <Text style={styles.anomText}>{a.message || a.type}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.demoBtn, sending && { opacity: 0.5 }]}
          onPress={sendDemo}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={18} color={COLORS.white} />
              <Text style={styles.demoText}>Send sample payload</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.refreshBtn} onPress={load}>
          <Ionicons name="refresh-outline" size={16} color={COLORS.primary} />
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
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
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.white },
  content: { flex: 1, padding: SIZES.lg },
  pairCard: {
    backgroundColor: COLORS.primaryLight,
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  pairLabel: { fontSize: 13, color: COLORS.primary, fontWeight: "700" },
  pairHint: { fontSize: 12, color: COLORS.textLight, marginTop: 4, textAlign: "center" },
  codeBox: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  code: { fontSize: 30, fontWeight: "bold", color: COLORS.primary, letterSpacing: 6 },
  deviceLine: { marginTop: 12, fontSize: 11, color: COLORS.textLight },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text, marginTop: 8, marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    width: "48%",
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  tileLabel: { fontSize: 12, color: COLORS.textLight },
  tileValue: { fontSize: 22, fontWeight: "700", color: COLORS.text, marginTop: 4 },
  tileUnit: { fontSize: 12, color: COLORS.textLight, fontWeight: "500" },
  anomBox: {
    marginTop: 16,
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  anomLine: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 3 },
  sevDot: { width: 8, height: 8, borderRadius: 4 },
  anomText: { fontSize: 12, color: COLORS.text, flex: 1 },
  demoBtn: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
  },
  demoText: { color: COLORS.white, fontSize: 14, fontWeight: "700" },
  refreshBtn: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  refreshText: { color: COLORS.primary, fontSize: 13, fontWeight: "700" },
});

export default DesktopAgentPairScreen;
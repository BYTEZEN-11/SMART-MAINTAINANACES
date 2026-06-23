import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors as COLORS, Spacing as SIZES } from "../constants/theme";
import rulesService from "../services/rulesService";

const DEVICE_TYPES = ["fridge", "ac", "washing-machine", "laptop", "phone", "other"];

const describeCondition = (cond) => {
  const all = cond?.all || [];
  if (!all.length) return "always";
  return all.map((c) => `${c.field} ${c.op} ${typeof c.value === "string" ? `"${c.value}"` : c.value}`).join(" AND ");
};

const RulesTraceScreen = ({ route, navigation }) => {
  const initialType = route?.params?.deviceType || "fridge";
  const [deviceType, setDeviceType] = useState(initialType);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const list = await rulesService.getActiveRules(deviceType);
      setRules(list || []);
    } catch (e) {
      setError(e?.message || "Failed to load rules");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [deviceType]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rule Engine</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabContent}
      >
        {DEVICE_TYPES.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.tab, deviceType === d && styles.tabOn]}
            onPress={() => { setLoading(true); setDeviceType(d); }}
          >
            <Text style={[styles.tabText, deviceType === d && styles.tabTextOn]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
        {loading && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />}
        {error && <Text style={styles.errorText}>{error}</Text>}
        {!loading && !error && rules.length === 0 && (
          <Text style={styles.emptyText}>No rules for {deviceType}.</Text>
        )}
        {rules.map((r) => (
          <View key={r.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{r.name}</Text>
              <View
                style={[
                  styles.sevBadge,
                  {
                    backgroundColor:
                      r.action?.severity === "Critical" ? "#EF4444"
                        : r.action?.severity === "High" ? "#F59E0B"
                        : r.action?.severity === "Medium" ? "#FBBF24"
                        : "#10B981",
                  },
                ]}
              >
                <Text style={styles.sevText}>{r.action?.severity || "—"}</Text>
              </View>
            </View>
            {!!r.description && (
              <Text style={styles.cardDesc}>{r.description}</Text>
            )}
            <Text style={styles.conditionLabel}>IF</Text>
            <Text style={styles.condition}>{describeCondition(r.condition)}</Text>
            <Text style={styles.conditionLabel}>THEN</Text>
            <View style={styles.actionBox}>
              {r.action?.issue && <Text style={styles.actionLine}>Issue: {r.action.issue}</Text>}
              {r.action?.solution && <Text style={styles.actionLine}>Solution: {r.action.solution}</Text>}
              {r.action?.confidenceDelta ? (
                <Text style={styles.actionLine}>Confidence: {r.action.confidenceDelta > 0 ? "+" : ""}{r.action.confidenceDelta}</Text>
              ) : null}
            </View>
            <View style={styles.meta}>
              <Text style={styles.metaText}>Weight: {r.weight ?? 1}</Text>
              <Text style={styles.metaText}>Fired: {r.fireCount || 0}×</Text>
              <Text style={styles.metaText}>Source: {r.source}</Text>
            </View>
          </View>
        ))}
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
  tabBar: { maxHeight: 56, backgroundColor: COLORS.white, borderBottomWidth: 1, borderColor: COLORS.lightGray },
  tabContent: { paddingHorizontal: 8, alignItems: "center", gap: 6, paddingVertical: 10 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.background,
  },
  tabOn: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.text, textTransform: "capitalize" },
  tabTextOn: { color: COLORS.white, fontWeight: "700" },
  content: { flex: 1, padding: SIZES.lg },
  emptyText: { textAlign: "center", color: COLORS.textLight, marginTop: 24 },
  errorText: { color: COLORS.critical || "#EF4444", marginTop: 16, textAlign: "center" },
  card: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: COLORS.text, marginRight: 8 },
  sevBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  sevText: { color: COLORS.white, fontSize: 11, fontWeight: "700" },
  cardDesc: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  conditionLabel: {
    fontSize: 10, color: COLORS.primary, fontWeight: "700", marginTop: 10, letterSpacing: 1,
  },
  condition: {
    fontSize: 12, color: COLORS.text, fontFamily: Platform?.OS === "ios" ? "Menlo" : "monospace",
    backgroundColor: COLORS.primaryLight, padding: 8, borderRadius: 8, marginTop: 4,
  },
  actionBox: {
    backgroundColor: COLORS.background, padding: 10, borderRadius: 8, marginTop: 4,
  },
  actionLine: { fontSize: 12, color: COLORS.text, marginVertical: 1 },
  meta: { flexDirection: "row", gap: 12, marginTop: 10 },
  metaText: { fontSize: 11, color: COLORS.textLight },
});

export default RulesTraceScreen;
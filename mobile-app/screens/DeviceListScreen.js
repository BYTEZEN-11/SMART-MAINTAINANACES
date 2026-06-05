import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, Image, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";
import { Colors, Spacing, Radius, FontSize, Shadow } from "../constants/theme";

const STATUS = {
  online:  { color: Colors.success, bg: Colors.successLight, label: "Online" },
  offline: { color: Colors.gray500, bg: Colors.gray100,      label: "Offline" },
  warning: { color: Colors.warning, bg: Colors.warningLight, label: "Warning" },
};

const getStatus = (d) => {
  if (!d?.lastSeen) return STATUS.offline;
  const age = (Date.now() - new Date(d.lastSeen).getTime()) / 1000;
  if (age < 300) return STATUS.online;
  if (age < 3600) return STATUS.warning;
  return STATUS.offline;
};

export default function DeviceListScreen({ navigation }) {
  const [devices, setDevices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await api.get("/api/devices");
      const list = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      setDevices(list);
      setFiltered(list);
    } catch (e) {
      console.log("device fetch failed:", e?.message || e);
      Alert.alert("Couldn't load devices", e?.response?.data?.message || e.message || "Try again later");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!q) { setFiltered(devices); return; }
    setFiltered(devices.filter((d) =>
      (d.name || "").toLowerCase().includes(q) ||
      (d.type || "").toLowerCase().includes(q) ||
      (d.location || "").toLowerCase().includes(q)
    ));
  }, [search, devices]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.gray500} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search devices…"
          placeholderTextColor={Colors.gray400}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.length > 0 ? (
          <TouchableOpacity onPress={() => setSearch("")} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={18} color={Colors.gray500} />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id || item.id || item.deviceId}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchDevices(); }}
            tintColor={Colors.primary}
          />
        }
        renderItem={({ item }) => {
          const status = getStatus(item);
          return (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("DeviceHealth", { deviceId: item._id || item.id })}
            >
              <View style={[styles.iconBox, { backgroundColor: status.bg }]}>
                <Ionicons name="hardware-chip-outline" size={22} color={status.color} />
              </View>
              <View style={styles.body}>
                <Text style={styles.name} numberOfLines={1}>{item.name || "Unnamed"}</Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {item.type || "Device"}{item.location ? ` • ${item.location}` : ""}
                </Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={48} color={Colors.gray400} />
            <Text style={styles.emptyTitle}>No devices yet</Text>
            <Text style={styles.emptySubtitle}>Pair an IoT device to start monitoring</Text>
            <TouchableOpacity
              style={styles.cta}
              onPress={() => navigation.navigate("ConnectDevice")}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaText}>Pair device</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center:    { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },

  searchBar: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    margin: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.text },

  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.sm },
  row: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    ...Shadow.sm,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: Radius.md,
    justifyContent: "center", alignItems: "center",
  },
  body: { flex: 1 },
  name: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text },
  meta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  statusText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },

  empty: { alignItems: "center", padding: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: "center" },
  cta: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: Radius.md,
  },
  ctaText: { color: "#FFFFFF", fontWeight: "700" },
});
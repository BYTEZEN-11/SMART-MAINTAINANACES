import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, FontSize, Shadow } from "../constants/theme";

const STATUS = {
  online:  { color: Colors.success, bg: Colors.successLight, icon: "wifi",                 label: "Online"  },
  offline: { color: Colors.gray500, bg: Colors.gray100,      icon: "cloud-offline-outline", label: "Offline" },
  warning: { color: Colors.warning, bg: Colors.warningLight, icon: "alert-circle-outline",   label: "Warning" },
  error:   { color: Colors.danger,  bg: Colors.dangerLight,  icon: "alert-outline",         label: "Error"   },
};

const getConfig = (status = "offline") => STATUS[status] || STATUS.offline;

export default function DeviceStatusCard({ device, onPress }) {
  if (!device) return null;
  const cfg = getConfig(device.status);
  const iconName = device.icon || "devices";
  const iconFamily = device.iconFamily || "Ionicons";
  const IconComp = iconFamily === "MaterialCommunityIcons" ? MaterialCommunityIcons : Ionicons;
  const lastReading = device.lastReading || {};

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onPress?.(device)} style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
        <IconComp name={iconName} size={22} color={cfg.color} />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{device.name || "Unnamed device"}</Text>
          <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
            <View style={[styles.dot, { backgroundColor: cfg.color }]} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        <Text style={styles.meta} numberOfLines={1}>
          {device.type || "Device"} {device.location ? `• ${device.location}` : ""}
        </Text>

        {Object.keys(lastReading).length > 0 ? (
          <View style={styles.readingsRow}>
            {Object.entries(lastReading).slice(0, 3).map(([k, v]) => (
              <View key={k} style={styles.reading}>
                <Text style={styles.readingValue}>
                  {typeof v === "number" ? v.toFixed(1) : v}
                </Text>
                <Text style={styles.readingLabel}>{k}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={18} color={Colors.gray400} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  iconBox: {
    width: 48, height: 48, borderRadius: Radius.md,
    justifyContent: "center", alignItems: "center",
  },
  body: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  name: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text, flex: 1 },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.3 },
  meta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  readingsRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.xs },
  reading: { alignItems: "flex-start" },
  readingValue: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.text },
  readingLabel: { fontSize: 9, color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.4 },
});
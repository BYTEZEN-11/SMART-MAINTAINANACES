import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, FontSize, Shadow } from "../constants/theme";

export default function MaintenanceTicketRow({ ticket, onPress }) {
  if (!ticket) return null;
  const status = (ticket.status || "open").toLowerCase();
  const statusCfg = STATUS_MAP[status] || STATUS_MAP.open;
  const priorityCfg = PRIORITY_MAP[ticket.priority || "normal"] || PRIORITY_MAP.normal;
  const due = ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : "—";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress?.(ticket)}
      style={styles.row}
    >
      <View style={[styles.iconBox, { backgroundColor: statusCfg.bg }]}>
        <Ionicons name={statusCfg.icon} size={22} color={statusCfg.color} />
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{ticket.title || "Untitled ticket"}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {ticket.appliance?.name ? `${ticket.appliance.name} • ` : ""}{due}
        </Text>
      </View>

      <View style={[styles.priorityBadge, { backgroundColor: priorityCfg.bg }]}>
        <Text style={[styles.priorityText, { color: priorityCfg.color }]}>
          {(ticket.priority || "normal").toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const STATUS_MAP = {
  open:        { color: Colors.warning, bg: Colors.warningLight, icon: "alert-circle-outline" },
  in_progress: { color: Colors.info,    bg: Colors.infoLight,    icon: "sync-outline" },
  resolved:    { color: Colors.success, bg: Colors.successLight, icon: "checkmark-circle-outline" },
  closed:      { color: Colors.gray500, bg: Colors.gray100,      icon: "lock-closed-outline" },
};

const PRIORITY_MAP = {
  low:    { color: Colors.success, bg: Colors.successLight },
  normal: { color: Colors.info,    bg: Colors.infoLight },
  high:   { color: Colors.warning, bg: Colors.warningLight },
  urgent: { color: Colors.danger,  bg: Colors.dangerLight },
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.white,
    padding: Spacing.md, gap: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: Radius.md,
    justifyContent: "center", alignItems: "center",
  },
  body:  { flex: 1 },
  title: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text },
  subtitle: {
    fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full,
  },
  priorityText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.4 },
});

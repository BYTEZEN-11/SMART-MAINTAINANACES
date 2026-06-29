import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";
import { Colors, Spacing, Radius, FontSize, Shadow } from "../constants/theme";

const STATUS_LABEL = {
  open:        { color: Colors.warning, label: "Open" },
  in_progress: { color: Colors.info,    label: "In progress" },
  resolved:    { color: Colors.success, label: "Resolved" },
  closed:      { color: Colors.gray500, label: "Closed" },
};

export default function TicketDetailScreen({ route, navigation }) {
  const ticketId = route?.params?.ticketId;
  const initialTicket = route?.params?.ticket;
  const [ticket, setTicket] = useState(initialTicket || null);
  const [loading, setLoading] = useState(Boolean(ticketId) && !initialTicket);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchTicket = useCallback(async () => {
    if (!ticketId) return;
    try {
      setError(null);
      const res = await api.get(`/maintenance/tickets/${encodeURIComponent(ticketId)}`);
      const t = res.data?.data ?? res.data ?? null;
      setTicket(t);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load ticket");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [ticketId]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={Colors.danger} />
        <Text style={styles.muted}>{error || "Ticket not found"}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusCfg = STATUS_LABEL[(ticket.status || "open").toLowerCase()] || STATUS_LABEL.open;
  const steps = Array.isArray(ticket.steps) ? ticket.steps : [];
  const history = Array.isArray(ticket.history) ? ticket.history : [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchTicket(); }}
          tintColor={Colors.primary}
        />
      }
    >
      <View style={styles.headerCard}>
        <Text style={styles.title}>{ticket.title || "Maintenance ticket"}</Text>
        <Text style={styles.subtitle}>
          {ticket.appliance?.name ? `${ticket.appliance.name} • ` : ""}
          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : ""}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: statusCfg.color + "20" }]}>
          <View style={[styles.dot, { backgroundColor: statusCfg.color }]} />
          <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
      </View>

      {ticket.description ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.sectionBody}>{ticket.description}</Text>
        </View>
      ) : null}

      {steps.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resolution steps</Text>
          {steps.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
              <Text style={styles.stepBody}>{typeof s === "string" ? s : s.text || ""}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {history.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          {history.map((h, i) => (
            <View key={i} style={styles.historyRow}>
              <Text style={styles.historyTs}>
                {h.at ? new Date(h.at).toLocaleString() : ""}
              </Text>
              <Text style={styles.historyBody}>{h.message || h}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
        <Text style={styles.btnText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background, padding: Spacing.lg },
  muted: { color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: "center" },

  headerCard: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    ...Shadow.sm,
  },
  title:    { fontSize: FontSize.xl, fontWeight: "800", color: Colors.text },
  subtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4 },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: "flex-start",
    marginTop: Spacing.md,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },

  section: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    ...Shadow.sm,
  },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.primary, marginBottom: 6 },
  sectionBody:  { fontSize: FontSize.md, color: Colors.text, lineHeight: 22 },

  stepRow: { flexDirection: "row", gap: Spacing.md, alignItems: "flex-start", marginTop: 4 },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center", alignItems: "center",
  },
  stepNumText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  stepBody: { flex: 1, fontSize: FontSize.md, color: Colors.text, lineHeight: 20 },

  historyRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  historyTs: { fontSize: 11, color: Colors.gray500, width: 110 },
  historyBody: { flex: 1, fontSize: FontSize.sm, color: Colors.text },

  btn: {
    margin: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  btnText: { color: "#FFFFFF", fontWeight: "700", fontSize: FontSize.md },
});
import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";
import { Colors, Spacing, Radius, Shadow, FontSize } from "../constants/theme";

const getDaysUntil = (date) => Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));

const getConfig = (days) => {
  if (days < 0) return { color: Colors.danger, bg: Colors.dangerLight, icon: "alert-circle", label: `Overdue by ${Math.abs(days)} days` };
  if (days === 0) return { color: Colors.danger, bg: Colors.dangerLight, icon: "alert-circle", label: "Due today!" };
  if (days <= 7) return { color: Colors.warning, bg: Colors.warningLight, icon: "warning", label: `Due in ${days} days` };
  if (days <= 30) return { color: "#8B5CF6", bg: "#F5F3FF", icon: "calendar", label: `Due in ${days} days` };
  return { color: Colors.success, bg: Colors.successLight, icon: "checkmark-circle", label: `${days} days away` };
};

export default function NotificationScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/api/appliances");
      const items = (res.data?.data || [])
        .filter(a => a.serviceDate)
        .map(a => ({ ...a, diffDays: getDaysUntil(a.serviceDate) }))
        .filter(a => a.diffDays <= 60)
        .sort((a, b) => a.diffDays - b.diffDays);
      setNotifications(items);
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );

  return (
    <View style={styles.container}>
      {}
      {notifications.length > 0 && (
        <View style={styles.summaryBanner}>
          <Ionicons name="notifications" size={20} color={Colors.primary} />
          <Text style={styles.summaryText}>
            {notifications.filter(n => n.diffDays <= 7).length} urgent · {notifications.length} total reminders
          </Text>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={item => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} tintColor={Colors.primary} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const cfg = getConfig(item.diffDays);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("Appliance List")}
              activeOpacity={0.85}
            >
              <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon} size={22} color={cfg.color} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardMeta}>{item.type} {item.location ? `• ${item.location}` : ""}</Text>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={12} color={Colors.gray500} />
                  <Text style={styles.dateText}>{new Date(item.serviceDate).toDateString()}</Text>
                </View>
              </View>
              <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={64} color={Colors.success} />
            <Text style={styles.emptyTitle}>All clear!</Text>
            <Text style={styles.emptySubtitle}>No upcoming service reminders in the next 60 days</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  summaryBanner: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    backgroundColor: Colors.primaryLight, padding: Spacing.md,
    paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  summaryText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: "600" },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  card: {
    flexDirection: "row", alignItems: "center", backgroundColor: Colors.white,
    borderRadius: Radius.xl, padding: Spacing.md, gap: Spacing.md, ...Shadow.sm,
  },
  iconBox: { width: 48, height: 48, borderRadius: Radius.lg, justifyContent: "center", alignItems: "center" },
  cardInfo: { flex: 1 },
  cardName: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text },
  cardMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 },
  dateText: { fontSize: FontSize.xs, color: Colors.gray500 },
  badge: { borderRadius: Radius.md, paddingHorizontal: 8, paddingVertical: 4, maxWidth: 100 },
  badgeText: { fontSize: 10, fontWeight: "700", textAlign: "center" },
  emptyState: { alignItems: "center", paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: "center", paddingHorizontal: Spacing.xl },
});

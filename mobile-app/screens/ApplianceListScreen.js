import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert, RefreshControl, Image
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import api from "../services/api";
import { Colors, Spacing, Radius, Shadow, FontSize } from "../constants/theme";

const APPLIANCE_ICONS = {
  cooling: "air-conditioner", ac: "air-conditioner",
  fridge: "fridge-outline", refrigerator: "fridge-outline",
  washing: "washing-machine", kitchen: "stove",
  tv: "television", default: "home-outline",
};
const getIcon = (type = "") => APPLIANCE_ICONS[type.toLowerCase()] || APPLIANCE_ICONS.default;

const getDaysUntil = (date) => {
  if (!date) return null;
  return Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
};

const getStatus = (days) => {
  if (days === null) return { label: "No date", color: Colors.gray500, bg: Colors.gray200 };
  if (days < 0) return { label: "Overdue", color: Colors.danger, bg: Colors.dangerLight };
  if (days <= 7) return { label: "Urgent", color: Colors.danger, bg: Colors.dangerLight };
  if (days <= 30) return { label: "Due soon", color: Colors.warning, bg: Colors.warningLight };
  return { label: "Good", color: Colors.success, bg: Colors.successLight };
};

export default function ApplianceListScreen({ navigation }) {
  const [appliances, setAppliances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppliances = useCallback(async () => {
    try {
      const res = await api.get("/api/appliances");
      setAppliances(res.data.data || []);
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to load appliances");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAppliances();
    const unsub = navigation.addListener("focus", fetchAppliances);
    return unsub;
  }, [navigation, fetchAppliances]);

  const handleDelete = (id) => {
    Alert.alert("Delete Appliance", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/api/appliances/${id}`);
            fetchAppliances();
          } catch (err) {
            Alert.alert("Error", err.message || "Delete failed");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const days = getDaysUntil(item.serviceDate);
    const status = getStatus(days);
    const imageUrl = item.image && item.image.trim() ? `${api.defaults.baseURL}${item.image}` : null;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          {}
          {imageUrl ? (
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.applianceImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.iconBox, { backgroundColor: Colors.primaryLight }]}>
              <MaterialCommunityIcons name={getIcon(item.type)} size={26} color={Colors.primary} />
            </View>
          )}
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardMeta}>{item.type} {item.brand ? `• ${item.brand}` : ""}</Text>
            {item.location && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color={Colors.gray500} />
                <Text style={styles.locationText}>{item.location}</Text>
              </View>
            )}
          </View>
          <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusPillText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {item.serviceDate && (
          <View style={styles.serviceDateRow}>
            <Ionicons name="calendar-outline" size={14} color={Colors.gray500} />
            <Text style={styles.serviceDateText}>
              Next service: {new Date(item.serviceDate).toDateString()}
              {days !== null && (
                <Text style={{ color: status.color }}>
                  {days < 0 ? ` (${Math.abs(days)}d overdue)` : days === 0 ? " (Today!)" : ` (${days}d)`}
                </Text>
              )}
            </Text>
          </View>
        )}

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("Upload", { applianceId: item._id })}
          >
            <Ionicons name="camera-outline" size={15} color={Colors.warning} />
            <Text style={[styles.actionBtnText, { color: Colors.warning }]}>Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("Edit Appliance", { item })}
          >
            <Ionicons name="create-outline" size={15} color={Colors.primary} />
            <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteActionBtn]}
            onPress={() => handleDelete(item._id)}
          >
            <Ionicons name="trash-outline" size={15} color={Colors.danger} />
            <Text style={[styles.actionBtnText, { color: Colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={appliances}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAppliances(); }} tintColor={Colors.primary} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="home-plus-outline" size={56} color={Colors.gray400} />
            <Text style={styles.emptyTitle}>No appliances found</Text>
            <Text style={styles.emptySubtitle}>Add your first appliance to get started</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate("Add Appliance")}>
              <Ionicons name="add" size={18} color={Colors.white} />
              <Text style={styles.addBtnText}>Add Appliance</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("Add Appliance")}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.lg, paddingBottom: 100 },
  card: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.md },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.md, marginBottom: Spacing.sm },
  iconBox: { width: 50, height: 50, borderRadius: Radius.lg, justifyContent: "center", alignItems: "center" },
  applianceImage: { 
    width: 50, 
    height: 50, 
    borderRadius: Radius.lg, 
    borderWidth: 2, 
    borderColor: Colors.border 
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  cardMeta: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 },
  locationText: { fontSize: FontSize.xs, color: Colors.gray500 },
  statusPill: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillText: { fontSize: FontSize.xs, fontWeight: "700" },
  serviceDateRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginBottom: Spacing.md, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  serviceDateText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  cardActions: { flexDirection: "row", gap: Spacing.sm },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8, borderRadius: Radius.md, backgroundColor: Colors.gray100 },
  deleteActionBtn: { backgroundColor: Colors.dangerLight },
  actionBtnText: { fontSize: FontSize.xs, fontWeight: "600" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  emptyState: { alignItems: "center", paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: "center" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, marginTop: Spacing.sm },
  addBtnText: { color: Colors.white, fontWeight: "700" },
  fab: { position: "absolute", bottom: 24, right: 24, width: 56, height: 56, borderRadius: Radius.full, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center", ...Shadow.lg },
});

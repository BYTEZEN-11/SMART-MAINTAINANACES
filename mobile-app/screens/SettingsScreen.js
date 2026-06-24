import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, Switch,
  TouchableOpacity, Alert, ActivityIndicator, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Colors, Spacing, Radius, FontSize, Shadow } from "../constants/theme";
import { APP_CONFIG } from "../constants/config";

const NOTIFICATION_KEY = "settings:notifications";

const loadNotificationPref = async () => {
  try {
    const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
    const v = await AsyncStorage.getItem(NOTIFICATION_KEY);
    return v === null ? true : v === "1";
  } catch { return true; }
};

const saveNotificationPref = async (enabled) => {
  try {
    const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
    await AsyncStorage.setItem(NOTIFICATION_KEY, enabled ? "1" : "0");
  } catch {  }
};

export default function SettingsScreen({ navigation }) {
  const { user, clearToken } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  const [accountInfo, setAccountInfo] = useState(null);

  const fetchAccount = useCallback(async () => {
    try {
      const res = await api.get("/api/users/me");
      setAccountInfo(res.data?.data ?? res.data ?? null);
    } catch (_) {
      
      setAccountInfo(user);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    (async () => {
      setNotifications(await loadNotificationPref());
    })();
    fetchAccount();
  }, [fetchAccount]);

  const toggleNotifications = async (val) => {
    setNotifications(val);
    await saveNotificationPref(val);
  };

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out", style: "destructive",
        onPress: async () => {
          try { await signOut(auth); } catch {  }
          await clearToken();
          navigation.replace("Login");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const displayName = accountInfo?.displayName || user?.displayName || user?.email || "User";
  const email = accountInfo?.email || user?.email || "—";

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: Spacing.xxl }}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Row icon="person-circle-outline" label="Name"  value={displayName} />
        <Row icon="mail-outline"        label="Email" value={email} />
        <Row icon="information-circle-outline" label="Version" value={APP_CONFIG.version} />
        <Row icon={Platform.OS === "ios" ? "logo-apple" : "logo-android"} label="Platform" value={`${Platform.OS} ${Platform.Version || ""}`} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
            <Text style={styles.toggleLabel}>Push notifications</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={toggleNotifications}
            trackColor={{ true: Colors.primary, false: Colors.gray200 }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <LinkRow icon="shield-checkmark-outline" label="Privacy policy" onPress={() => navigation.navigate?.("Privacy")} />
        <LinkRow icon="document-text-outline"     label="Terms of service" onPress={() => navigation.navigate?.("Terms")} />
        <LinkRow icon="help-circle-outline"       label="Help & support" onPress={() => navigation.navigate?.("Help")} />
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const Row = ({ icon, label, value }) => (
  <View style={styles.row}>
    <Ionicons name={icon} size={18} color={Colors.primary} />
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue} numberOfLines={1}>{value || "—"}</Text>
  </View>
);

const LinkRow = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
    <Ionicons name={icon} size={18} color={Colors.primary} />
    <Text style={[styles.rowLabel, { flex: 1 }]}>{label}</Text>
    <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },

  section: {
    margin: Spacing.lg,
    marginBottom: 0,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    ...Shadow.sm,
  },
  sectionTitle: {
    fontSize: FontSize.sm, fontWeight: "800", color: Colors.primary,
    marginBottom: Spacing.sm, letterSpacing: 0.5, textTransform: "uppercase",
  },
  row: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowLabel: { fontSize: FontSize.sm, color: Colors.text, width: 80 },
  rowValue: { flex: 1, fontSize: FontSize.sm, color: Colors.text, textAlign: "right" },

  toggleRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  toggleLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  toggleLabel: { fontSize: FontSize.md, color: Colors.text },

  signOutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6,
    margin: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.dangerLight,
  },
  signOutText: { color: Colors.danger, fontWeight: "700" },
});
import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Image, StatusBar, FlatList
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { syncAccount } from "../src/auth/authService";
import { Colors, Spacing, Radius, Shadow, FontSize, Gradients, FeatureColors } from "../constants/theme";
import {
  GradientHero, StatPill, FeatureTile, GlassCard, IconBadge,
  GradientChip, SectionHeader, DecorativeBlob, EmptyState,
} from "../components/UI";

const APPLIANCE_ICONS = {
  cooling: "air-conditioner", ac: "air-conditioner",
  fridge: "fridge-outline", refrigerator: "fridge-outline",
  washing: "washing-machine", washer: "washing-machine",
  kitchen: "stove", oven: "stove",
  tv: "television", television: "television",
  default: "home-outline",
};
const getIcon = (type = "") => APPLIANCE_ICONS[type.toLowerCase()] || APPLIANCE_ICONS.default;

const getDaysUntil = (date) => {
  if (!date) return null;
  return Math.ceil((new Date(date) - new Date()) / (86_400_000));
};

const STATUS_BY_DAYS = (days) => {
  if (days === null) return { label: "No date",  color: Colors.catBlue,    light: Colors.catBlueLight,    gradient: null };
  if (days < 0)        return { label: "Overdue", color: Colors.catRed,     light: Colors.catRedLight,     gradient: Gradients.danger };
  if (days <= 7)       return { label: "Urgent",  color: Colors.catOrange,  light: Colors.catOrangeLight,  gradient: Gradients.alerts };
  if (days <= 30)      return { label: "Due soon",color: Colors.catYellow,  light: Colors.catYellowLight,  gradient: Gradients.warning };
  return                       { label: "Good",    color: Colors.catGreen,   light: Colors.catGreenLight,   gradient: Gradients.health };
};

const QUICK_ACTIONS = [
  { key: "add",   icon: "add-circle-outline",  label: "Add\nAppliance",   route: "Add Appliance",     ...FeatureColors.appliances },
  { key: "issue", icon: "camera-outline",      label: "Report\nIssue",    route: "Upload",            ...FeatureColors.report },
  { key: "diag",  icon: "pulse-outline",       label: "Diag-\nnostics",   route: "DiagnosticHome",    ...FeatureColors.diagnostics },
  { key: "all",   icon: "list-outline",        label: "All\nAppliances",  route: "Appliance List",    ...FeatureColors.health },
  { key: "rem",   icon: "notifications-outline",label:"Reminder",         route: "Notifications",     ...FeatureColors.reminders },
  { key: "iot",   icon: "wifi-outline",        label: "IoT\nDevices",     route: "ConnectedDevices",  ...FeatureColors.iot },
  { key: "rule",  icon: "git-branch-outline",  label: "Rule\nEngine",     route: "RulesTrace",        ...FeatureColors.rules },
  { key: "desk",  icon: "desktop-outline",     label: "Desktop\nAgent",   route: "DesktopAgent",      ...FeatureColors.iot },
];

export default function HomeScreen({ navigation }) {
  const { user, token, clearToken, saveToken } = useAuth();
  const [appliances, setAppliances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [needsSync, setNeedsSync] = useState(false);

  const userName =
    user?.displayName?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    user?.uid?.substring(0, 8) ||
    "User";

useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      if (!user) return;
      if (!token) { setNeedsSync(true); return; }
      try {
        await api.get("/api/appliances");
        if (!cancelled) setNeedsSync(false);
      } catch (_) {
        if (!cancelled) setNeedsSync(true);
      }
    };
    sync();
    return () => { cancelled = true; };
  }, [user, token]);

const handleSyncAccount = async () => {
    if (!user) return Alert.alert("Error", "Cannot sync: not signed in");
    try {
      await syncAccount(user, user.displayName || (user.email ? user.email.split("@")[0] : undefined));
      setNeedsSync(false);
      Alert.alert("Success", "Account synced — AI features are enabled");
      fetchData();
    } catch (err) {
      Alert.alert("Sync Failed", err.message || "Please try again later");
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get("/api/appliances");
      setAppliances(res.data.data || []);
    } catch (err) {
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {

if (token) fetchData();
    navigation.setOptions({ headerShown: false });
  }, [token]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel" },
      {
        text: "Logout", style: "destructive", onPress: async () => {
          await signOut(auth);
          await clearToken();
          navigation.replace("Login");
        },
      },
    ]);
  };

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const total     = appliances.length;
  const urgent7   = appliances.filter((a) => { const d = getDaysUntil(a.serviceDate); return d !== null && d >= 0 && d <= 7; }).length;
  const overdue   = appliances.filter((a) => { const d = getDaysUntil(a.serviceDate); return d !== null && d < 0; }).length;
  const good      = appliances.filter((a) => { const d = getDaysUntil(a.serviceDate); return d !== null && d > 30; }).length;
  const dueSoon   = appliances.filter((a) => { const d = getDaysUntil(a.serviceDate); return d !== null && d >= 0 && d > 7 && d <= 30; }).length;
  const attention = urgent7 + overdue;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your home…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <StatusBar barStyle="light-content" />

      {}
      <GradientHero
        colors={Gradients.heroBerry}
        icon="home-heart"
        iconFamily="MaterialCommunityIcons"
        title={`Hi, ${userName} 👋`}
        subtitle="Your smart home command centre"
        height={undefined}
        style={{ paddingTop: 56 }}
      >
        <TouchableOpacity style={styles.avatar} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.avatarText}>{userName[0]?.toUpperCase()}</Text>
        </TouchableOpacity>
      </GradientHero>

      <View style={{ paddingHorizontal: Spacing.lg, marginTop: -Spacing.lg }}>
        {}
        <View style={{ flexDirection: "row", gap: Spacing.sm }}>
          <StatPill label="TOTAL"     value={total}     icon="home-outline"           gradient={Gradients.diagnostics} />
          <StatPill label="ATTENTION" value={attention} icon="alert-circle-outline"   gradient={Gradients.alerts} />
          <StatPill label="HEALTHY"   value={good}      icon="checkmark-circle-outline" gradient={Gradients.health} />
        </View>

        {}
        <View style={styles.section}>
          <SectionHeader title="Quick Actions" />
          <View style={styles.tilesGrid}>
            {QUICK_ACTIONS.map((qa) => (
              <FeatureTile
                key={qa.key}
                icon={qa.icon}
                label={qa.label}
                colors={qa.gradient}
                onPress={() => {
                  if (qa.route === "RulesTrace") {
                    navigation.navigate(qa.route, { deviceType: "fridge" });
                  } else {
                    navigation.navigate(qa.route);
                  }
                }}
                style={{ flex: 1, minWidth: 0 }}
              />
            ))}
          </View>
        </View>

        {}
        {needsSync && (
          <TouchableOpacity activeOpacity={0.85} onPress={handleSyncAccount}>
            <LinearGradient
              colors={Gradients.heroSunset}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.banner, { marginTop: Spacing.md }]}
            >
              <Ionicons name="cloud-offline-outline" size={22} color="#FFFFFF" />
              <Text style={styles.bannerText}>
                Sync your account to unlock AI features
              </Text>
              <View style={styles.bannerCta}>
                <Text style={styles.bannerCtaText}>Sync</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {attention > 0 && (
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate("Appliance List")}>
            <LinearGradient
              colors={Gradients.alerts}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.banner, { marginTop: Spacing.md }]}
            >
              <Ionicons name="warning-outline" size={22} color="#FFFFFF" />
              <Text style={styles.bannerText}>
                {attention} appliance{attention > 1 ? "s" : ""} need{attention === 1 ? "s" : ""} attention
              </Text>
              <View style={styles.bannerCta}>
                <Text style={styles.bannerCtaText}>View</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {}
        <SectionHeader title="Your Appliances" action="See all" onAction={() => navigation.navigate("Appliance List")} />

        {appliances.length === 0 ? (
          <EmptyState
            icon="add-circle-outline"
            title="No appliances yet"
            subtitle="Add your first appliance to get personalised diagnostics and reminders"
            actionLabel="Add Appliance"
            onAction={() => navigation.navigate("Add Appliance")}
            gradient={Gradients.heroPink}
          />
        ) : (
          <FlatList
            data={appliances.slice(0, 6)}
            horizontal
            keyExtractor={(item) => item._id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingVertical: Spacing.sm }}
            renderItem={({ item }) => {
              const days = getDaysUntil(item.serviceDate);
              const status = STATUS_BY_DAYS(days);
              const imageUrl = item.image && item.image.trim() ? `${api.defaults.baseURL}${item.image}` : null;
              return (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate("Appliance List")}
                  style={{
                    width: 150,
                    borderRadius: Radius.lg,
                    overflow: "hidden",
                    backgroundColor: Colors.white,
                    ...Shadow.colored(status.gradient ? status.gradient[0] : Colors.primary, 0.25),
                    borderWidth: 1.5,
                    borderColor: Colors.border,
                  }}
                >
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={{ width: "100%", height: 110 }} resizeMode="cover" />
                  ) : (
                    <LinearGradient
                      colors={status.gradient || Gradients.cardGlow}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ width: "100%", height: 110, justifyContent: "center", alignItems: "center" }}
                    >
                      <MaterialCommunityIcons name={getIcon(item.type)} size={42} color="#FFFFFF" />
                    </LinearGradient>
                  )}
                  <View style={{ padding: Spacing.md }}>
                    <Text style={{ fontSize: FontSize.md, fontWeight: "700", color: Colors.text }} numberOfLines={1}>{item.name}</Text>
                    <Text style={{ fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 }}>{item.type || "Appliance"}</Text>
                    <View style={{ marginTop: Spacing.sm }}>
                      <GradientChip
                        label={status.label.toUpperCase()}
                        color={status.gradient ? "#FFFFFF" : status.color}
                        light={status.gradient ? status.gradient[0] : status.light}
                      />
                    </View>
                    {item.serviceDate && (
                      <Text style={{ fontSize: 10, color: Colors.textSecondary, marginTop: 6 }}>
                        {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {}
        <SectionHeader title="Maintenance Reminders" />
        {appliances
          .filter((a) => a.serviceDate)
          .sort((a, b) => getDaysUntil(a.serviceDate) - getDaysUntil(b.serviceDate))
          .slice(0, 4)
          .map((item) => {
            const days = getDaysUntil(item.serviceDate);
            const status = STATUS_BY_DAYS(days);
            return (
              <GlassCard
                key={item._id}
                accent={(status.gradient ? status.gradient[0] : status.color) + "30"}
                onPress={() => navigation.navigate("Appliance List")}
                style={{ marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, flexDirection: "row", alignItems: "center", gap: Spacing.md }}
              >
                <IconBadge icon="calendar-outline" color={status.color} light={status.light} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: FontSize.md, fontWeight: "700", color: Colors.text }}>{item.name}</Text>
                  <Text style={{ fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 }}>
                    {new Date(item.serviceDate).toDateString()}
                  </Text>
                </View>
                <GradientChip
                  label={status.label.toUpperCase()}
                  color={status.gradient ? "#FFFFFF" : status.color}
                  light={status.gradient ? status.gradient[0] : status.light}
                />
              </GlassCard>
            );
          })}

        {dueSoon > 0 && (
          <GlassCard
            accent={Colors.catYellow + "30"}
            style={{ marginHorizontal: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.lg, flexDirection: "row", alignItems: "center", gap: Spacing.md }}
          >
            <IconBadge icon="calendar" color={Colors.catYellow} light={Colors.catYellowLight} iconSize={22} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: FontSize.md, fontWeight: "700", color: Colors.text }}>Upcoming service</Text>
              <Text style={{ fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 }}>
                {dueSoon} appliance{dueSoon > 1 ? "s" : ""} due within the next 30 days
              </Text>
            </View>
          </GlassCard>
        )}

        <View style={{ height: Spacing.xxl }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: Colors.background },
  loadingContainer:   { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  loadingText:        { marginTop: Spacing.md, color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: "500" },

avatar: {
    position: "absolute", top: 56, right: Spacing.lg,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.6)",
  },
  avatarText: { color: "#FFFFFF", fontWeight: "800", fontSize: FontSize.lg },

  section:      { marginTop: Spacing.md },
  tilesGrid:    { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: Spacing.lg, gap: Spacing.lg, rowGap: Spacing.lg, justifyContent: "space-between" },

  banner: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
    ...Shadow.md,
  },
  bannerText:      { flex: 1, fontSize: FontSize.sm, color: "#FFFFFF", fontWeight: "600" },
  bannerCta:       { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FFFFFF", paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full },
  bannerCtaText:   { color: Colors.primary, fontWeight: "800", fontSize: FontSize.xs },
});

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNetwork } from "../context/NetworkContext";
import { Colors, Spacing, FontSize, Shadow } from "../constants/theme";

const OfflineBanner = () => {
  const { isOnline, refresh } = useNetwork();

  if (isOnline) return null;

  return (
    <TouchableOpacity
      style={styles.banner}
      onPress={refresh}
      activeOpacity={0.8}
      accessibilityRole="alert"
      accessibilityLabel="You are offline. Tap to retry."
    >
      <Ionicons name="cloud-offline-outline" size={18} color={Colors.white} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>You are offline</Text>
        <Text style={styles.subtitle}>Some features may be unavailable. Tap to retry.</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.danger,
    gap: Spacing.sm,
    ...Shadow.md,
  },
  textContainer: { flex: 1 },
  title: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
  subtitle: {
    color: Colors.white,
    fontSize: FontSize.xs,
    opacity: 0.9,
  },
});

export default OfflineBanner;

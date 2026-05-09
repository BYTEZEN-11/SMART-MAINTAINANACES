import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, Radius, Shadow, FontSize } from "../constants/theme";

export default function QuickActionButton({
  label,
  icon,
  iconFamily = "Ionicons",
  colors = ["#EC4899", "#A855F7"],
  onPress,
  style,
  disabled,
}) {
  const IconComp = iconFamily === "MaterialCommunityIcons" ? MaterialCommunityIcons : Ionicons;

  const handlePress = () => {
    if (disabled) return;
    try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle?.Light); } catch {  }
    if (onPress) onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      disabled={disabled}
      style={[styles.wrap, style, disabled && { opacity: 0.5 }]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tile}
      >
        <View style={styles.iconCircle}>
          <IconComp name={icon} size={22} color="#FFFFFF" />
        </View>
        <Text style={styles.label} numberOfLines={2}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: Radius.lg, overflow: "hidden", flex: 1, minWidth: 0 },
  tile: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    ...Shadow.colored("#EC4899", 0.35),
  },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.5)",
  },
  label: {
    color: "#FFFFFF",
    fontSize: FontSize.xs,
    fontWeight: "700",
    textAlign: "center",
  },
});

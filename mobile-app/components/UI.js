

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors, Gradients, Spacing, Radius, Shadow, FontSize } from "../constants/theme";

const BLUR_BLOB_SIZE = 280;

export const DecorativeBlob = ({ color = Colors.primary, opacity = 0.18, size = BLUR_BLOB_SIZE, style }) => (
  <View
    pointerEvents="none"
    style={[
      {
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,

shadowColor: color,
        shadowOpacity: opacity * 1.5,
        shadowRadius: size / 2,
        shadowOffset: { width: 0, height: 0 },
      },
      style,
    ]}
  />
);

export const GradientHero = ({
  colors,
  title,
  subtitle,
  icon,
  iconFamily = "Ionicons",
  height = 240,
  children,
  style,
}) => {
  const IconComp = iconFamily === "MaterialCommunityIcons" ? MaterialCommunityIcons : Ionicons;
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ paddingTop: Spacing.xxl, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg }, style]}
    >
      <View style={{ position: "absolute", top: -60, right: -60 }}>
        <DecorativeBlob color="#FFFFFF" opacity={0.18} size={220} />
      </View>
      <View style={{ position: "absolute", bottom: -40, left: -40 }}>
        <DecorativeBlob color="#FFFFFF" opacity={0.12} size={160} />
      </View>
      {icon && (
        <View style={heroStyles.iconCircle}>
          <IconComp name={icon} size={32} color="#FFFFFF" />
        </View>
      )}
      {title && <Text style={heroStyles.title}>{title}</Text>}
      {subtitle && <Text style={heroStyles.subtitle}>{subtitle}</Text>}
      {children}
    </LinearGradient>
  );
};

const heroStyles = StyleSheet.create({
  iconCircle: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center", alignItems: "center",
    marginBottom: Spacing.md,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.35)",
  },
  title:    { fontSize: FontSize.xxl, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.5 },
  subtitle: { fontSize: FontSize.sm,  color: "rgba(255,255,255,0.92)", marginTop: 4, fontWeight: "500" },
});

export const GradientCard = ({
  colors,
  children,
  onPress,
  style,
  shadow = true,
  borderRadius = Radius.lg,
}) => {
  const Card = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { onPress, activeOpacity: 0.85 } : {};
  return (
    <Card {...wrapperProps} style={[{ borderRadius }, shadow && Shadow.colored(colors[0]), style]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius,
          padding: Spacing.md,
          borderWidth: 1.5,
          borderColor: "rgba(255,255,255,0.6)",
        }}
      >
        {children}
      </LinearGradient>
    </Card>
  );
};

export const GlassCard = ({ children, style, onPress, accent }) => {
  const Card = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { onPress, activeOpacity: 0.85 } : {};
  return (
    <Card
      {...wrapperProps}
      style={[
        {
          backgroundColor: Colors.card,
          borderRadius: Radius.lg,
          padding: Spacing.md,
          borderWidth: 1.5,
          borderColor: accent || Colors.border,
          ...Shadow.sm,
        },
        style,
      ]}
    >
      {children}
    </Card>
  );
};

export const FeatureTile = ({
  icon,
  label,
  colors,
  onPress,
  size = 64,
  iconSize = 28,
  style,
}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[{ alignItems: "center", gap: 6 }, style]}>
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size, height: size, borderRadius: size * 0.32,
        justifyContent: "center", alignItems: "center",
        ...Shadow.colored(colors[0], 0.45),
        borderWidth: 2, borderColor: "rgba(255,255,255,0.5)",
      }}
    >
      <Ionicons name={icon} size={iconSize} color="#FFFFFF" />
    </LinearGradient>
    <Text style={{ fontSize: FontSize.xs, fontWeight: "600", color: Colors.gray700, textAlign: "center", maxWidth: size + 20 }} numberOfLines={2}>
      {label}
    </Text>
  </TouchableOpacity>
);

export const StatPill = ({ label, value, icon, gradient, color, light }) => {
  const IconComp = icon && typeof icon === "object" ? icon.comp : Ionicons;
  const iconName = typeof icon === "string" ? icon : icon?.name;
  const inner = (
    <>
      {iconName && (
        <View style={{
          width: 32, height: 32, borderRadius: 12,
          backgroundColor: gradient ? "rgba(255,255,255,0.25)" : (light || Colors.primaryLight),
          justifyContent: "center", alignItems: "center",
        }}>
          <IconComp name={iconName} size={16} color={gradient ? "#FFFFFF" : (color || Colors.primary)} />
        </View>
      )}
      <Text style={{
        fontSize: FontSize.xxl, fontWeight: "800",
        color: gradient ? "#FFFFFF" : (color || Colors.primary),
        marginTop: 4,
      }}>
        {value}
      </Text>
      <Text style={{
        fontSize: FontSize.xs, fontWeight: "600",
        color: gradient ? "rgba(255,255,255,0.92)" : Colors.textSecondary,
        letterSpacing: 0.3,
      }}>
        {label}
      </Text>
    </>
  );

  if (gradient) {
    return (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flex: 1, borderRadius: Radius.lg, padding: Spacing.md,
          alignItems: "center", justifyContent: "center",
          ...Shadow.colored(gradient[0], 0.4),
          borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)",
        }}
      >
        {inner}
      </LinearGradient>
    );
  }

  return (
    <View style={{
      flex: 1, borderRadius: Radius.lg, padding: Spacing.md,
      alignItems: "center", justifyContent: "center",
      backgroundColor: light || Colors.primaryLight,
      ...Shadow.sm,
    }}>
      {inner}
    </View>
  );
};

export const GradientButton = ({
  label,
  onPress,
  colors = Gradients.primary,
  icon,
  loading,
  disabled,
  style,
}) => (
  <TouchableOpacity
    onPress={disabled || loading ? undefined : onPress}
    activeOpacity={0.85}
    style={[{ borderRadius: Radius.md, overflow: "hidden", opacity: disabled ? 0.6 : 1 }, style]}
  >
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{
        paddingVertical: 16, paddingHorizontal: Spacing.lg,
        flexDirection: "row", justifyContent: "center", alignItems: "center",
        gap: 8,
      }}
    >
      {loading ? null : icon ? <Ionicons name={icon} size={18} color="#FFFFFF" /> : null}
      <Text style={{ color: "#FFFFFF", fontSize: FontSize.md, fontWeight: "700", letterSpacing: 0.3 }}>
        {loading ? "Please wait…" : label}
      </Text>
    </LinearGradient>
  </TouchableOpacity>
);

export const GradientChip = ({ label, color, light, icon, style }) => (
  <View
    style={[
      {
        flexDirection: "row", alignItems: "center", gap: 4,
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: Radius.full,
        backgroundColor: light || Colors.primaryLight,
        alignSelf: "flex-start",
      },
      style,
    ]}
  >
    {icon && <Ionicons name={icon} size={11} color={color || Colors.primary} />}
    <Text style={{ fontSize: 10, fontWeight: "700", color: color || Colors.primary, letterSpacing: 0.3 }}>
      {label}
    </Text>
  </View>
);

export const GradientText = ({ colors = Gradients.primary, style, children }) => (
  <Text style={style}>
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}

>
      <Text style={[style, { color: colors[0] }]}>{children}</Text>
    </LinearGradient>
  </Text>
);

export const SectionHeader = ({ title, action, onAction, style }) => (
  <View
    style={[
      {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
      },
      style,
    ]}
  >
    <Text style={{ fontSize: FontSize.lg, fontWeight: "700", color: Colors.text, letterSpacing: -0.2 }}>
      {title}
    </Text>
    {action && (
      <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
        <Text style={{ fontSize: FontSize.sm, color: Colors.primary, fontWeight: "700" }}>{action} →</Text>
      </TouchableOpacity>
    )}
  </View>
);

export const IconBadge = ({ icon, color, light, size = 44, iconSize = 22, family = "Ionicons" }) => {
  const IconComp = family === "MaterialCommunityIcons" ? MaterialCommunityIcons : Ionicons;
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size * 0.3,
        backgroundColor: light || Colors.primaryLight,
        justifyContent: "center", alignItems: "center",
        borderWidth: 1.5, borderColor: (color || Colors.primary) + "30",
      }}
    >
      <IconComp name={icon} size={iconSize} color={color || Colors.primary} />
    </View>
  );
};

export const EmptyState = ({ icon, title, subtitle, actionLabel, onAction, gradient = Gradients.primary }) => (
  <View style={{
    alignItems: "center",
    padding: Spacing.xxl,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.sm,
  }}>
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: 80, height: 80, borderRadius: 24,
        justifyContent: "center", alignItems: "center",
        marginBottom: Spacing.md,
        ...Shadow.colored(gradient[0]),
      }}
    >
      <Ionicons name={icon} size={36} color="#FFFFFF" />
    </LinearGradient>
    <Text style={{ fontSize: FontSize.lg, fontWeight: "700", color: Colors.text }}>{title}</Text>
    {subtitle && (
      <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4, textAlign: "center" }}>
        {subtitle}
      </Text>
    )}
    {actionLabel && (
      <GradientButton label={actionLabel} onPress={onAction} colors={gradient} style={{ marginTop: Spacing.lg }} />
    )}
  </View>
);
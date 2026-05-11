import React, { useMemo } from "react";
import { View, Text, Dimensions, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, FontSize, Radius } from "../constants/theme";

const { width: SCREEN_W } = Dimensions.get("window");

export default function TelemetryChart({
  data = [],
  labels,
  unit = "",
  height = 140,
  color = Colors.primary,
  thresholds,
}) {
  const { points, min, max, stepX } = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return { points: [], min: 0, max: 0, stepX: 0 };
    }
    const clean = data.map((v) => (typeof v === "number" && Number.isFinite(v) ? v : null));
    const valid = clean.filter((v) => v !== null);
    if (valid.length === 0) return { points: [], min: 0, max: 0, stepX: 0 };
    const lo = Math.min(...valid);
    const hi = Math.max(...valid);
    const span = hi - lo || 1;
    const w = SCREEN_W - Spacing.lg * 2 - Spacing.md;
    const step = data.length > 1 ? w / (data.length - 1) : 0;
    return { min: lo, max: hi, stepX: step };
  }, [data]);

  if (!points) {
    return (
      <View style={[styles.empty, { height }]}>
        <Ionicons name="analytics-outline" size={28} color={Colors.gray400} />
        <Text style={styles.emptyText}>No telemetry data</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.row}>
        <Text style={styles.metric}>
          {Number.isFinite(max) ? max.toFixed(1) : "—"}
          <Text style={styles.metricUnit}> {unit} max</Text>
        </Text>
        <Text style={styles.metric}>
          {Number.isFinite(min) ? min.toFixed(1) : "—"}
          <Text style={styles.metricUnit}> {unit} min</Text>
        </Text>
      </View>

      <View style={styles.canvas}>
        {data.map((v, i) => {
          if (typeof v !== "number" || !Number.isFinite(v)) return null;
          const lo = min;
          const hi = max;
          const span = hi - lo || 1;
          const norm = (v - lo) / span;
          const barHeight = Math.max(2, Math.round(norm * (height - 36)));
          return (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  left: i * stepX,
                  height: barHeight,
                  backgroundColor: color,
                  bottom: 18,
                },
              ]}
            />
          );
        })}

        {thresholds?.warn !== undefined ? (
          <ThresholdLine
            value={thresholds.warn} min={min} max={max}
            color={Colors.warning} label="warn"
          />
        ) : null}
        {thresholds?.crit !== undefined ? (
          <ThresholdLine
            value={thresholds.crit} min={min} max={max}
            color={Colors.danger} label="crit"
          />
        ) : null}
      </View>

      {labels && labels.length > 0 ? (
        <View style={styles.labelsRow}>
          {labels.map((l, i) => (
            <Text key={i} style={styles.labelText}>{l}</Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const ThresholdLine = ({ value, min, max, color, label }) => {
  const span = max - min || 1;
  const norm = (value - min) / span;
  const top = (1 - norm) * 100;
  if (norm < 0 || norm > 1) return null;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.threshold,
        { top: `${top}%`, borderColor: color },
      ]}
    >
      <Text style={[styles.thresholdLabel, { color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.gray100,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    overflow: "hidden",
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  metric: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text },
  metricUnit: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: "500" },
  canvas: { flex: 1, position: "relative", marginTop: Spacing.xs },
  bar: {
    position: "absolute",
    width: 4,
    borderRadius: 2,
    opacity: 0.85,
  },
  threshold: {
    position: "absolute",
    left: 0, right: 0,
    borderTopWidth: 1,
    borderStyle: "dashed",
  },
  thresholdLabel: {
    position: "absolute", right: 4, top: -10,
    fontSize: 9, fontWeight: "700",
  },
  labelsRow: {
    flexDirection: "row", justifyContent: "space-between",
    marginTop: 4,
  },
  labelText: { fontSize: 9, color: Colors.textSecondary },
  empty: {
    backgroundColor: Colors.gray100,
    borderRadius: Radius.md,
    justifyContent: "center", alignItems: "center",
    gap: 6,
  },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.sm },
});
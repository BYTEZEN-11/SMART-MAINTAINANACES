import React from "react";
import {
  Modal, View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, FontSize, Shadow } from "../constants/theme";

export default function AIAnalysisModal({
  visible,
  onClose,
  result,
  loading,
  error,
  title = "AI Diagnosis",
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.muted}>Analyzing…</Text>
              </View>
            ) : error ? (
              <View style={styles.center}>
                <Ionicons name="alert-circle-outline" size={40} color={Colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : result ? (
              <>
                {result.issue ? (
                  <Section title="Issue" body={result.issue} />
                ) : null}
                {result.severity ? (
                  <Section title="Severity" body={String(result.severity).toUpperCase()} />
                ) : null}
                {result.rootCause ? (
                  <Section title="Root cause" body={result.rootCause} />
                ) : null}
                {result.solution ? (
                  <Section title="Recommended fix" body={result.solution} />
                ) : null}
                {Array.isArray(result.affectedComponents) && result.affectedComponents.length > 0 ? (
                  <Section
                    title="Affected components"
                    body={result.affectedComponents.join(", ")}
                  />
                ) : null}
                {Array.isArray(result.preventiveMeasures) && result.preventiveMeasures.length > 0 ? (
                  <Section
                    title="Preventive measures"
                    body={result.preventiveMeasures.map((m, i) => `${i + 1}. ${m}`).join("\n")}
                  />
                ) : null}
              </>
            ) : (
              <View style={styles.center}>
                <Text style={styles.muted}>No analysis available</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const Section = ({ title, body }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.sectionBody}>{body}</Text>
  </View>
);

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    maxHeight: "85%",
    ...Shadow.lg,
  },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: Spacing.md,
  },
  title: { fontSize: FontSize.xl, fontWeight: "800", color: Colors.text },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.gray100,
    justifyContent: "center", alignItems: "center",
  },
  body: { paddingBottom: Spacing.xxl },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: Spacing.xxl },
  muted: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.sm },
  errorText: { fontSize: FontSize.sm, color: Colors.danger, marginTop: Spacing.sm, textAlign: "center" },
  section: { marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.primary, marginBottom: 4 },
  sectionBody:  { fontSize: FontSize.md, color: Colors.text, lineHeight: 22 },
});
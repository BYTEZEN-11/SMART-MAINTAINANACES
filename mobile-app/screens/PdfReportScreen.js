import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors as COLORS, Spacing as SIZES } from "../constants/theme";
import pdfService from "../services/pdfService";

const TEMPLATES = [
  { key: "executive",  label: "Executive",  desc: "1–2 pages, summary + severity" },
  { key: "technician", label: "Technician", desc: "Full detail, tables, evidence" },
  { key: "insurance",  label: "Insurance",  desc: "Incident brief + signatures" },
];

const PdfReportScreen = ({ route, navigation }) => {
  const { analysisId, deviceName, deviceType, analysis } = route.params || {};
  const [template, setTemplate] = useState("executive");
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    if (!analysisId) {
      Alert.alert("Missing", "analysisId is required to generate a report.");
      return;
    }
    setBusy(true);
    try {
      const out = await pdfService.generate(analysisId, template);
      setReport(out);
      Alert.alert(
        "Report ready",
        "Open the PDF now?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open", onPress: () => pdfService.openReport(out) },
        ]
      );
    } catch (e) {
      Alert.alert("Generation failed", e?.message || "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  const openExisting = () => pdfService.openReport(report);

  const a = analysis?.analysis || analysis || {};
  const meta = [
    ["Device type", deviceType || analysis?.deviceType || "—"],
    ["Device name", deviceName || analysis?.deviceName || "—"],
    ["Severity", a.severity || "—"],
    ["Confidence", a.confidence != null ? `${a.confidence}%` : "—"],
    ["Generated", new Date().toLocaleString()],
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Diagnostic PDF Report</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>{a.issue || "Diagnostic summary"}</Text>
          {meta.map(([k, v]) => (
            <View key={k} style={styles.metaRow}>
              <Text style={styles.metaKey}>{k}</Text>
              <Text style={styles.metaVal}>{v}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Choose a template</Text>
        {TEMPLATES.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tplCard, template === t.key && styles.tplCardOn]}
            onPress={() => setTemplate(t.key)}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.tplLabel, template === t.key && { color: COLORS.primary }]}>
                {t.label}
              </Text>
              <Text style={styles.tplDesc}>{t.desc}</Text>
            </View>
            <Ionicons
              name={template === t.key ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={template === t.key ? COLORS.primary : COLORS.textLight}
            />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.genBtn, busy && { opacity: 0.5 }]}
          onPress={generate}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="document-text-outline" size={18} color={COLORS.white} />
              <Text style={styles.genText}>Generate PDF</Text>
            </>
          )}
        </TouchableOpacity>

        {report && (
          <View style={styles.doneCard}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success || "#10B981"} />
            <View style={{ flex: 1 }}>
              <Text style={styles.doneTitle}>{report.fileName || "Report.pdf"}</Text>
              <Text style={styles.doneSize}>
                {(report.fileSize / 1024).toFixed(1)} KB • Template: {template}
              </Text>
            </View>
            <TouchableOpacity style={styles.openBtn} onPress={openExisting}>
              <Text style={styles.openText}>Open</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    padding: SIZES.lg,
    paddingTop: SIZES.lg * 2,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.white },
  content: { flex: 1, padding: SIZES.lg },
  summary: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  summaryTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  metaKey: { fontSize: 12, color: COLORS.textLight },
  metaVal: { fontSize: 13, color: COLORS.text, fontWeight: "600" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text, marginTop: 8, marginBottom: 8 },
  tplCard: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  tplCardOn: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  tplLabel: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  tplDesc: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  genBtn: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  genText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
  doneCard: {
    marginTop: 16,
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.success || "#10B981",
  },
  doneTitle: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  doneSize: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  openBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  openText: { color: COLORS.white, fontWeight: "700", fontSize: 13 },
});

export default PdfReportScreen;
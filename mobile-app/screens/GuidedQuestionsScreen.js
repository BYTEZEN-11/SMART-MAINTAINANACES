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
import multimodalService from "../services/multimodalService";

const GuidedQuestionsScreen = ({ route, navigation }) => {
  const { session, questions } = route.params;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  if (!questions || !questions.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Guided Diagnosis</Text>
        </View>
        <View style={styles.empty}>
          <Ionicons name="help-circle-outline" size={48} color={COLORS.textLight} />
          <Text style={styles.emptyText}>No follow-up questions needed — your initial description was enough.</Text>
        </View>
      </View>
    );
  }

  const q = questions[step];

  const pickOption = async (option) => {
    const next = [...answers, { question: q.question || q.text || q.id, answer: option }];
    setAnswers(next);
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      
      setSubmitting(true);
      try {
        const res = await multimodalService.answerTroubleshoot(session._id, {
          answers: next,
        });
        navigation.replace("DiagnosticResult", {
          result: res.analysis || res,
          testType: "Guided Diagnosis",
        });
      } catch (e) {
        Alert.alert("Submission failed", e?.message || "Unknown error");
        setSubmitting(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guided Diagnosis</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.progressRow}>
          {questions.map((_, i) => (
            <View
              key={i}
              style={[styles.progressDot, i <= step && styles.progressDotOn]}
            />
          ))}
          <Text style={styles.progressText}>
            {step + 1} / {questions.length}
          </Text>
        </View>

        <Text style={styles.purpose}>{q.purpose || "Question"}</Text>
        <Text style={styles.question}>{q.question || q.text || "—"}</Text>

        <View style={styles.options}>
          {(q.options || []).map((opt, i) => {
            const label = typeof opt === "string" ? opt : opt.label || opt.value;
            return (
              <TouchableOpacity
                key={i}
                style={styles.option}
                onPress={() => pickOption(label)}
                disabled={submitting}
              >
                <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
                <Text style={styles.optionLabel}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {submitting && (
          <View style={styles.submitWrap}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.submitText}>Generating diagnosis…</Text>
          </View>
        )}

        {answers.length > 0 && (
          <View style={styles.historyBox}>
            <Text style={styles.historyTitle}>Your answers</Text>
            {answers.map((a, i) => (
              <Text key={i} style={styles.historyLine}>
                <Text style={{ fontWeight: "700" }}>Q{i + 1}: </Text>
                {a.answer}
              </Text>
            ))}
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
  progressRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 4 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.lightGray },
  progressDotOn: { backgroundColor: COLORS.primary },
  progressText: { marginLeft: 8, fontSize: 12, color: COLORS.textLight },
  purpose: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  question: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginBottom: 18 },
  options: { gap: 10 },
  option: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  optionLabel: { flex: 1, fontSize: 15, color: COLORS.text },
  submitWrap: { alignItems: "center", marginTop: 24 },
  submitText: { marginTop: 8, color: COLORS.textLight, fontSize: 13 },
  historyBox: {
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
  },
  historyTitle: { fontSize: 13, fontWeight: "700", color: COLORS.primary, marginBottom: 6 },
  historyLine: { fontSize: 13, color: COLORS.text, marginVertical: 2 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyText: { marginTop: 12, color: COLORS.textLight, fontSize: 14, textAlign: "center" },
});

export default GuidedQuestionsScreen;
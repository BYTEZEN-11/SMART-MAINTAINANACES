import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Colors as COLORS, Spacing as SIZES } from "../constants/theme";
import multimodalService from "../services/multimodalService";
import storageService from "../services/storageService";

const DEVICE_TYPES = [
  { key: "fridge", label: "Refrigerator", icon: "snow-outline" },
  { key: "ac", label: "Air Conditioner", icon: "thermometer-outline" },
  { key: "washing-machine", label: "Washing Machine", icon: "water-outline" },
  { key: "phone", label: "Phone", icon: "phone-portrait-outline" },
  { key: "laptop", label: "Laptop", icon: "laptop-outline" },
  { key: "other", label: "Other", icon: "hardware-chip-outline" },
];

const SENSOR_FIELDS = [
  { key: "tempC", label: "Temperature (°C)" },
  { key: "humidity", label: "Humidity (%)" },
  { key: "vibrationMag", label: "Vibration (g)" },
  { key: "current", label: "Current (A)" },
  { key: "voltage", label: "Voltage (V)" },
  { key: "gasPpm", label: "Gas (ppm)" },
];

const MultmodalDiagnosticScreen = ({ navigation }) => {
  const [deviceType, setDeviceType] = useState(null);
  const [deviceName, setDeviceName] = useState("");
  const [textDescription, setTextDescription] = useState("");
  const [images, setImages] = useState([]);          
  const [sensorEnabled, setSensorEnabled] = useState(false);
  const [sensorData, setSensorData] = useState({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please grant photo library access to attach images.");
      return;
    }
    const pick = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 4,
    });
    if (!pick.canceled && pick.assets) {
      const newOnes = pick.assets.map((a) => ({ uri: a.uri, remoteUrl: null, uploading: false }));
      setImages((prev) => [...prev, ...newOnes].slice(0, 4));
    }
  };

  const removeImage = (idx) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const uploadAllImages = async () => {
    const updated = [...images];
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].remoteUrl || updated[i].uploading) continue;
      updated[i].uploading = true;
      setImages([...updated]);
      try {
        const url = await storageService.uploadFile(updated[i].uri, "image");
        updated[i].remoteUrl = url;
      } catch (e) {
        console.warn("Image upload failed:", e?.message);
      } finally {
        updated[i].uploading = false;
        setImages([...updated]);
      }
    }
    return updated.map((i) => i.remoteUrl).filter(Boolean);
  };

  const updateSensor = (key, raw) => {
    const v = raw.trim();
    setSensorData((prev) => {
      const next = { ...prev };
      if (v === "") delete next[key];
      else if (!Number.isNaN(Number(v))) next[key] = Number(v);
      else next[key] = v;
      return next;
    });
  };

  const runAnalysis = async () => {
    if (!deviceType || !deviceName.trim()) {
      Alert.alert("Missing info", "Pick a device type and enter a device name.");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const imageUrls = images.length ? await uploadAllImages() : [];
      const payload = {
        deviceType,
        deviceName: deviceName.trim(),
        textDescription: textDescription.trim() || undefined,
        imageUrls: imageUrls.length ? imageUrls : undefined,
        sensorData: sensorEnabled ? sensorData : undefined,
      };
      const out = await multimodalService.analyzeMultimodal(payload);
      setResult(out);
    } catch (e) {
      Alert.alert("Analysis failed", e?.message || "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  const goToResult = () => {
    if (!result) return;
    navigation.navigate("DiagnosticResult", { result, testType: "Multimodal Diagnostic" });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Multimodal Diagnostic</Text>
      </View>

      <ScrollView style={styles.content}>
        {}
        <Text style={styles.step}>1 — Device</Text>
        <View style={styles.row}>
          {DEVICE_TYPES.map((d) => (
            <TouchableOpacity
              key={d.key}
              style={[styles.chip, deviceType === d.key && styles.chipOn]}
              onPress={() => setDeviceType(d.key)}
            >
              <Ionicons
                name={d.icon}
                size={16}
                color={deviceType === d.key ? COLORS.white : COLORS.text}
              />
              <Text style={[styles.chipText, deviceType === d.key && styles.chipTextOn]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.input}
          value={deviceName}
          onChangeText={setDeviceName}
          placeholder="Device name (e.g. Living-room AC)"
        />

        {}
        <Text style={styles.step}>2 — Describe the problem</Text>
        <TextInput
          style={styles.textArea}
          multiline
          value={textDescription}
          onChangeText={setTextDescription}
          placeholder="What's wrong? When did it start? Any noise, smell, leak?"
        />

        {}
        <Text style={styles.step}>3 — Photos (optional, up to 4)</Text>
        <View style={styles.imagesRow}>
          {images.map((img, i) => (
            <View key={i} style={styles.imageThumb}>
              <Image source={{ uri: img.uri }} style={styles.imageInner} />
              {img.uploading && (
                <ActivityIndicator style={styles.thumbSpinner} color={COLORS.white} />
              )}
              <TouchableOpacity style={styles.imageRemove} onPress={() => removeImage(i)}>
                <Ionicons name="close-circle" size={20} color={COLORS.critical || "#EF4444"} />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 4 && (
            <TouchableOpacity style={styles.imageAdd} onPress={pickImage}>
              <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
              <Text style={styles.imageAddLabel}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {}
        <View style={styles.sensorHeader}>
          <Text style={styles.step}>4 — Sensor readings (optional)</Text>
          <Switch
            value={sensorEnabled}
            onValueChange={setSensorEnabled}
            trackColor={{ false: COLORS.lightGray, true: COLORS.primaryLight }}
            thumbColor={sensorEnabled ? COLORS.primary : COLORS.white}
          />
        </View>
        {sensorEnabled && (
          <View style={styles.sensorGrid}>
            {SENSOR_FIELDS.map((s) => (
              <View key={s.key} style={styles.sensorCell}>
                <Text style={styles.sensorLabel}>{s.label}</Text>
                <TextInput
                  style={styles.sensorInput}
                  keyboardType="numeric"
                  onChangeText={(v) => updateSensor(s.key, v)}
                  placeholder="—"
                />
              </View>
            ))}
          </View>
        )}

        {}
        <TouchableOpacity
          style={[styles.runBtn, busy && styles.runBtnDisabled]}
          onPress={runAnalysis}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="flash-outline" size={18} color={COLORS.white} />
              <Text style={styles.runText}>Run Multimodal Analysis</Text>
            </>
          )}
        </TouchableOpacity>

        {}
        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>{result.analysis?.issue || "Analysis complete"}</Text>
              <View
                style={[
                  styles.sevBadge,
                  {
                    backgroundColor:
                      result.analysis?.severity === "Critical"
                        ? "#EF4444"
                        : result.analysis?.severity === "High"
                        ? "#F59E0B"
                        : result.analysis?.severity === "Medium"
                        ? "#FBBF24"
                        : "#10B981",
                  },
                ]}
              >
                <Text style={styles.sevText}>{result.analysis?.severity || "Low"}</Text>
              </View>
            </View>
            <Text style={styles.resultConf}>
              Confidence: {result.analysis?.confidence ?? 0}%
            </Text>
            {result.analysis?.rootCause && (
              <Text style={styles.resultLine}>
                <Text style={{ fontWeight: "700" }}>Root cause: </Text>
                {result.analysis.rootCause}
              </Text>
            )}
            {result.matchedRules?.length > 0 && (
              <View style={styles.ruleChips}>
                <Text style={styles.resultSub}>Rules fired:</Text>
                <View style={styles.chipRow}>
                  {result.matchedRules.map((r) => (
                    <View key={r} style={styles.ruleChip}>
                      <Text style={styles.ruleChipText}>{r}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {result.sensorAnomalies?.length > 0 && (
              <View style={styles.anomBox}>
                <Text style={styles.resultSub}>Sensor anomalies:</Text>
                {result.sensorAnomalies.slice(0, 4).map((a, i) => (
                  <Text key={i} style={styles.anomLine}>
                    • [{String(a.severity || "—").toUpperCase()}] {a.message || a.sensor}
                  </Text>
                ))}
              </View>
            )}
            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.resultBtn} onPress={goToResult}>
                <Ionicons name="document-text-outline" size={16} color={COLORS.white} />
                <Text style={styles.resultBtnText}>Full Report</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.resultBtn, styles.resultBtnGhost]}
                onPress={() =>
                  navigation.navigate("RulesTrace", { deviceType })
                }
              >
                <Ionicons name="git-branch-outline" size={16} color={COLORS.primary} />
                <Text style={[styles.resultBtnText, { color: COLORS.primary }]}>
                  Rules Trace
                </Text>
              </TouchableOpacity>
            </View>
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
  step: { fontSize: 14, fontWeight: "700", color: COLORS.primary, marginTop: 14, marginBottom: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.text },
  chipTextOn: { color: COLORS.white, fontWeight: "600" },
  input: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    marginTop: 8,
    fontSize: 15,
    color: COLORS.text,
  },
  textArea: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 12,
    minHeight: 90,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    fontSize: 14,
    color: COLORS.text,
  },
  imagesRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  imageThumb: { width: 70, height: 70, borderRadius: 10, overflow: "hidden", backgroundColor: COLORS.lightGray },
  imageInner: { width: "100%", height: "100%" },
  thumbSpinner: { position: "absolute", top: 24, left: 24 },
  imageRemove: { position: "absolute", top: -6, right: -6, backgroundColor: COLORS.white, borderRadius: 12 },
  imageAdd: {
    width: 70,
    height: 70,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  imageAddLabel: { fontSize: 11, color: COLORS.primary, marginTop: 2 },
  sensorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 8,
  },
  sensorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sensorCell: { width: "48%", marginBottom: 4 },
  sensorLabel: { fontSize: 12, color: COLORS.textLight, marginBottom: 4 },
  sensorInput: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    fontSize: 14,
    color: COLORS.text,
  },
  runBtn: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    marginBottom: 32,
  },
  runBtnDisabled: { opacity: 0.5 },
  runText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
  resultCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 14,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  resultTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: COLORS.text, marginRight: 8 },
  sevBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  sevText: { color: COLORS.white, fontSize: 11, fontWeight: "700" },
  resultConf: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  resultLine: { fontSize: 13, color: COLORS.text, marginTop: 8 },
  resultSub: { fontSize: 12, fontWeight: "700", color: COLORS.textLight, marginTop: 8, marginBottom: 4 },
  ruleChips: { marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  ruleChip: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ruleChipText: { fontSize: 11, color: COLORS.primary, fontWeight: "600" },
  anomBox: { marginTop: 4 },
  anomLine: { fontSize: 12, color: COLORS.text, marginVertical: 1 },
  resultActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  resultBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  resultBtnGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: COLORS.primary },
  resultBtnText: { color: COLORS.white, fontSize: 13, fontWeight: "700" },
});

export default MultmodalDiagnosticScreen;
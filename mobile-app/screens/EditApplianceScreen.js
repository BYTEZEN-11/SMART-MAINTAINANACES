import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";
import { Colors, Spacing, Radius, Shadow, FontSize } from "../constants/theme";

const TYPES = ["Cooling", "Kitchen", "Washing", "TV", "Heating", "Another"];

export default function EditApplianceScreen({ route, navigation }) {
  const { item } = route.params;

  const [name, setName] = useState(item.name || "");
  const [type, setType] = useState(item.type || "");
  const [brand, setBrand] = useState(item.brand || "");
  const [serviceDate, setServiceDate] = useState(item.serviceDate?.split("T")[0] || "");
  const [location, setLocation] = useState(item.location || "");
  const [notes, setNotes] = useState(item.notes || "");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleUpdate = async () => {
    if (!name || !type) return Alert.alert("Error", "Name and Type are required");
    try {
      setLoading(true);
      await api.put(`/api/appliances/${item._id}`, { name, type, brand, serviceDate, location, notes });
      Alert.alert("Success", "Updated successfully");
      navigation.goBack();
    } catch (err) {
      Alert.alert("Error", err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, placeholder, value, onChangeText, fieldKey, multiline }) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputBox, focusedField === fieldKey && styles.inputFocused, multiline && { height: 80 }]}>
        <TextInput
          style={[styles.input, multiline && { textAlignVertical: "top" }]}
          placeholder={placeholder}
          placeholderTextColor={Colors.gray400}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          onFocus={() => setFocusedField(fieldKey)}
          onBlur={() => setFocusedField(null)}
        />
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Edit Appliance</Text>
        <Text style={styles.subtitle}>Update the details below</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <Field label="Name *" placeholder="e.g. Samsung AC" value={name} onChangeText={setName} fieldKey="name" />
        <Field label="Brand" placeholder="e.g. Samsung, LG" value={brand} onChangeText={setBrand} fieldKey="brand" />
        <Field label="Location" placeholder="e.g. Bedroom, Kitchen" value={location} onChangeText={setLocation} fieldKey="location" />

        <Text style={styles.fieldLabel}>Type *</Text>
        <View style={styles.typeGrid}>
          {TYPES.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.typeChip, type === t && styles.typeChipActive]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Date</Text>
        <Field label="Next Service Date" placeholder="YYYY-MM-DD" value={serviceDate} onChangeText={setServiceDate} fieldKey="service" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <Field label="Additional Notes" placeholder="Any notes..." value={notes} onChangeText={setNotes} fieldKey="notes" multiline />
      </View>

      <TouchableOpacity
        style={[styles.btn, loading && { opacity: 0.7 }]}
        onPress={handleUpdate}
        disabled={loading}
        activeOpacity={0.85}
      >
        <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
        <Text style={styles.btnText}>{loading ? "Updating..." : "Update Appliance"}</Text>
      </TouchableOpacity>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.white, padding: Spacing.lg, paddingTop: Spacing.xl, ...Shadow.sm },
  title: { fontSize: FontSize.xxl, fontWeight: "700", color: Colors.text },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  section: { backgroundColor: Colors.white, margin: Spacing.lg, marginBottom: 0, borderRadius: Radius.xl, padding: Spacing.lg, ...Shadow.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text, marginBottom: Spacing.md },
  fieldGroup: { marginBottom: Spacing.md },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.gray700, marginBottom: Spacing.xs },
  inputBox: { backgroundColor: Colors.gray100, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: Spacing.md },
  inputFocused: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  input: { paddingVertical: 13, fontSize: FontSize.md, color: Colors.text },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.sm },
  typeChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.gray100 },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipText: { fontSize: FontSize.sm, color: Colors.gray700, fontWeight: "500" },
  typeChipTextActive: { color: Colors.white, fontWeight: "700" },
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: Spacing.sm, backgroundColor: Colors.primary, margin: Spacing.lg,
    borderRadius: Radius.lg, padding: 16, ...Shadow.lg,
  },
  btnText: { color: Colors.white, fontWeight: "700", fontSize: FontSize.lg },
});

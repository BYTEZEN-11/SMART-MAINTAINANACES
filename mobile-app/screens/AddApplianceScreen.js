import React, { useState } from "react";
import {
  View, Text, TextInput, StyleSheet, Alert,
  TouchableOpacity, ScrollView, Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import api from "../services/api";
import { Colors, Spacing, Radius, Shadow, FontSize } from "../constants/theme";

const TYPES = ["Cooling", "Kitchen", "Washing", "TV", "Heating", "Another"];

export default function AddApplianceScreen({ navigation, route }) {
  const editItem = route.params?.item;
  const [name, setName] = useState(editItem?.name || "");
  const [type, setType] = useState(editItem?.type || "");
  const [customType, setCustomType] = useState("");
  const [showCustomType, setShowCustomType] = useState(false);
  const [brand, setBrand] = useState(editItem?.brand || "");
  const [modelNumber, setModelNumber] = useState(editItem?.modelNumber || "");
  const [purchaseDate, setPurchaseDate] = useState(editItem?.purchaseDate?.split("T")[0] || "");
  const [serviceDate, setServiceDate] = useState(editItem?.serviceDate?.split("T")[0] || "");
  const [location, setLocation] = useState(editItem?.location || "");
  const [notes, setNotes] = useState(editItem?.notes || "");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const pickImage = async () => {
    
    Alert.alert(
      "Add Photo",
      "Choose an option",
      [
        {
          text: "Take Photo",
          onPress: async () => {
            const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
            if (!cameraPerm.granted) {
              Alert.alert("Permission Required", "Camera permission is needed to take photos");
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              quality: 0.7,
              allowsEditing: true,
              aspect: [4, 3]
            });
            if (!result.canceled) {
              setImage(result.assets[0].uri);
            }
          }
        },
        {
          text: "Choose from Gallery",
          onPress: async () => {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) {
              Alert.alert("Permission Required", "Gallery permission is needed to select photos");
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              quality: 0.7,
              allowsEditing: true,
              aspect: [4, 3]
            });
            if (!result.canceled) {
              setImage(result.assets[0].uri);
            }
          }
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleSubmit = async () => {
    const finalType = type === "Another" ? customType : type;
    
    if (!name.trim() || !finalType || !serviceDate)
      return Alert.alert("Required Fields", "Name, Type, and Service Date are required");

    if (name.trim().length < 2)
      return Alert.alert("Invalid Name", "Appliance name must be at least 2 characters");

    if (type === "Another" && !customType.trim())
      return Alert.alert("Custom Type Required", "Please enter a custom appliance type");

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(serviceDate))
      return Alert.alert("Invalid Date", "Service date must be in YYYY-MM-DD format");

    if (purchaseDate && !dateRegex.test(purchaseDate))
      return Alert.alert("Invalid Date", "Purchase date must be in YYYY-MM-DD format");

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("type", finalType.trim());
      formData.append("brand", brand.trim());
      formData.append("modelNumber", modelNumber.trim());
      formData.append("purchaseDate", purchaseDate);
      formData.append("serviceDate", serviceDate);
      formData.append("location", location.trim());
      formData.append("notes", notes.trim());
      if (image) formData.append("image", { uri: image, name: "appliance.jpg", type: "image/jpeg" });

      if (editItem) {
        await api.put(`/api/appliances/${editItem._id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
        Alert.alert("Updated", "Appliance updated successfully");
      } else {
        await api.post("/api/appliances", formData, { headers: { "Content-Type": "multipart/form-data" } });
        Alert.alert("Added", "Appliance added successfully");
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>{editItem ? "Edit Appliance" : "Add Appliance"}</Text>
        <Text style={styles.subtitle}>Fill in the details below</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appliance Photo</Text>
        <TouchableOpacity style={styles.imageBox} onPress={pickImage} activeOpacity={0.8}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={32} color={Colors.gray400} />
              <Text style={styles.imagePlaceholderText}>Tap to take or choose photo</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <InputField label="Appliance Name *" placeholder="e.g. Samsung AC" value={name} onChangeText={setName} fieldKey="name" focusedField={focusedField} setFocusedField={setFocusedField} />
        <InputField label="Brand" placeholder="e.g. Samsung, LG" value={brand} onChangeText={setBrand} fieldKey="brand" focusedField={focusedField} setFocusedField={setFocusedField} />
        <InputField label="Model Number" placeholder="e.g. AR18TYHYEWKN" value={modelNumber} onChangeText={setModelNumber} fieldKey="model" focusedField={focusedField} setFocusedField={setFocusedField} />
        <InputField label="Location" placeholder="e.g. Bedroom, Kitchen" value={location} onChangeText={setLocation} fieldKey="location" focusedField={focusedField} setFocusedField={setFocusedField} />

        <Text style={styles.fieldLabel}>Type *</Text>
        <View style={styles.typeGrid}>
          {TYPES.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.typeChip, type === t && styles.typeChipActive]}
              onPress={() => {
                setType(t);
                setShowCustomType(t === "Another");
              }}
            >
              <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {showCustomType && (
          <View style={styles.customTypeContainer}>
            <Text style={styles.customTypeLabel}>Enter Custom Appliance Type</Text>
            <View style={[styles.inputBox, focusedField === "customType" && styles.inputFocused]}>
              <Ionicons name="create-outline" size={18} color={focusedField === "customType" ? Colors.primary : Colors.gray500} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Air Purifier, Water Heater, etc."
                placeholderTextColor={Colors.gray400}
                value={customType}
                onChangeText={setCustomType}
                onFocus={() => setFocusedField("customType")}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            <Text style={styles.customTypeHint}>Describe the type of appliance you want to add</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dates</Text>
        <InputField label="Purchase Date" placeholder="YYYY-MM-DD" value={purchaseDate} onChangeText={setPurchaseDate} fieldKey="purchase" focusedField={focusedField} setFocusedField={setFocusedField} />
        <InputField label="Next Service Date *" placeholder="YYYY-MM-DD" value={serviceDate} onChangeText={setServiceDate} fieldKey="service" focusedField={focusedField} setFocusedField={setFocusedField} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Notes</Text>
        <InputField label="Notes" placeholder="Any additional information..." value={notes} onChangeText={setNotes} fieldKey="notes" multiline focusedField={focusedField} setFocusedField={setFocusedField} />
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, loading && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.85}
      >
        <Ionicons name={editItem ? "checkmark-circle-outline" : "add-circle-outline"} size={20} color={Colors.white} />
        <Text style={styles.submitBtnText}>{loading ? "Saving..." : editItem ? "Update Appliance" : "Add Appliance"}</Text>
      </TouchableOpacity>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

const InputField = ({ label, placeholder, value, onChangeText, fieldKey, keyboard, multiline, focusedField, setFocusedField }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.inputBox, focusedField === fieldKey && styles.inputFocused, multiline && { height: 80 }]}>
      <TextInput
        style={[styles.input, multiline && { textAlignVertical: "top" }]}
        placeholder={placeholder}
        placeholderTextColor={Colors.gray400}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboard || "default"}
        multiline={multiline}
        onFocus={() => setFocusedField(fieldKey)}
        onBlur={() => setFocusedField(null)}
      />
    </View>
  </View>
);

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
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  typeChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.gray100 },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipText: { fontSize: FontSize.sm, color: Colors.gray700, fontWeight: "500" },
  typeChipTextActive: { color: Colors.white, fontWeight: "700" },
  customTypeContainer: { marginTop: Spacing.md, padding: Spacing.md, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primary },
  customTypeLabel: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.primary, marginBottom: Spacing.xs },
  customTypeHint: { fontSize: FontSize.xs, color: Colors.gray600, marginTop: Spacing.xs, fontStyle: "italic" },
  imageBox: { borderRadius: Radius.lg, overflow: "hidden", height: 160, backgroundColor: Colors.gray100, borderWidth: 2, borderColor: Colors.border, borderStyle: "dashed" },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, justifyContent: "center", alignItems: "center", gap: Spacing.sm },
  imagePlaceholderText: { fontSize: FontSize.sm, color: Colors.gray500 },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: Spacing.sm, backgroundColor: Colors.primary, margin: Spacing.lg,
    borderRadius: Radius.lg, padding: 16, ...Shadow.lg,
  },
  submitBtnText: { color: Colors.white, fontWeight: "700", fontSize: FontSize.lg },
});

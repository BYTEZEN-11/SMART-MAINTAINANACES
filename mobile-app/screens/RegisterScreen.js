import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../services/firebase";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Colors, Spacing, Radius, Shadow, FontSize, Gradients } from "../constants/theme";
import { testBackendConnection } from "../utils/testBackend";
import { GradientButton, DecorativeBlob } from "../components/UI";

export default function RegisterScreen({ navigation }) {
  const { saveToken } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const isValidEmail = (e) => /\S+@\S+\.\S+/.test(e);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword)
      return Alert.alert("Missing Fields", "Please fill all fields");
    if (!isValidEmail(email)) return Alert.alert("Invalid Email", "Enter a valid email");
    if (name.trim().length < 2) return Alert.alert("Invalid Name", "Name must be at least 2 characters");
    if (password.length < 6) return Alert.alert("Weak Password", "Minimum 6 characters required");
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password))
      return Alert.alert("Weak Password", "Password must contain letters and numbers");
    if (password !== confirmPassword) return Alert.alert("Mismatch", "Passwords do not match");

    try {
      setLoading(true);
      const isConnected = await testBackendConnection();
      if (!isConnected) {
        Alert.alert(
          "Backend Unreachable",
          "Cannot connect to server. Please check:\n\n1. Backend is running\n2. Correct API URL in .env\n3. Internet connection"
        );
        return;
      }

      let backendToken = null;
      try {
        const backendRes = await api.post("/api/auth/register", { name, email, password });
        if (backendRes.data?.data?.token) {
          backendToken = backendRes.data.data.token;
          await saveToken(backendToken);
        }
      } catch (backendErr) {
        Alert.alert("Registration Failed", "Could not connect to server. Please check your connection and try again.");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      navigation.replace("Home");
    } catch (error) {
      let msg = "Signup failed";
      if (error.code === "auth/email-already-in-use") msg = "Email already registered";
      else if (error.code === "auth/weak-password") msg = "Weak password";
      else if (error.code === "auth/invalid-email") msg = "Invalid email address";
      else if (error.message) msg = error.message;
      Alert.alert("Signup Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <LinearGradient
          colors={Gradients.heroSunset}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <DecorativeBlob color="#FFFFFF" opacity={0.18} size={220} style={{ top: -60, right: -60 }} />
          <DecorativeBlob color="#FFFFFF" opacity={0.14} size={160} style={{ bottom: -40, left: -40 }} />

          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="account-plus-outline" size={42} color="#FFFFFF" />
          </View>
          <Text style={styles.appName}>Create Account</Text>
          <Text style={styles.tagline}>Join AI Home Assistant today</Text>
        </LinearGradient>

        <View style={styles.card}>
          <Field
            label="Full Name"
            icon="person-outline"
            value={name}
            onChangeText={setName}
            fieldKey="name"
            focusedField={focusedField}
            setFocusedField={setFocusedField}
            placeholder="Your name"
          />

          <Field
            label="Email"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            fieldKey="email"
            focusedField={focusedField}
            setFocusedField={setFocusedField}
            placeholder="you@example.com"
            keyboard="email-address"
          />

          <Field
            label="Password"
            icon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            fieldKey="password"
            focusedField={focusedField}
            setFocusedField={setFocusedField}
            placeholder="At least 6 characters"
            secure
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />

          <Field
            label="Confirm Password"
            icon="shield-checkmark-outline"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            fieldKey="confirm"
            focusedField={focusedField}
            setFocusedField={setFocusedField}
            placeholder="Repeat password"
            secure
            showPassword={showConfirmPassword}
            setShowPassword={setShowConfirmPassword}
          />

          <GradientButton
            label="Create Account"
            icon="checkmark-circle-outline"
            onPress={handleSignup}
            loading={loading}
            colors={Gradients.heroSunset}
            style={{ marginTop: Spacing.lg }}
          />

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginLinkText}>Already have an account? </Text>
            <Text style={[styles.loginLinkText, { color: Colors.primary, fontWeight: "800" }]}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const Field = ({
  label, icon, value, onChangeText, secure, fieldKey, focusedField, setFocusedField,
  placeholder, keyboard, showPassword, setShowPassword,
}) => {
  const shouldHidePassword = secure && !showPassword;
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputBox, focusedField === fieldKey && styles.inputFocused]}>
        <Ionicons name={icon} size={18} color={focusedField === fieldKey ? Colors.primary : Colors.gray500} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.gray400}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={shouldHidePassword}
          keyboardType={keyboard || "default"}
          autoCapitalize={secure || keyboard === "email-address" ? "none" : "words"}
          onFocus={() => setFocusedField(fieldKey)}
          onBlur={() => setFocusedField(null)}
        />
        {secure && (
          <TouchableOpacity
            onPress={() => setShowPassword((p) => !p)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.gray600} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  hero: {
    paddingTop: 70, paddingBottom: 60, paddingHorizontal: Spacing.lg,
    alignItems: "center",
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
  },
  logoCircle: {
    width: 90, height: 90, borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center", alignItems: "center",
    marginBottom: Spacing.md,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.4)",
    ...Shadow.lg,
  },
  appName: { fontSize: FontSize.xxxl, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.6 },
  tagline: { fontSize: FontSize.sm, color: "rgba(255,255,255,0.92)", marginTop: 6, fontWeight: "500" },

  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: -Spacing.xl,
    borderWidth: 1.5, borderColor: Colors.border,
    ...Shadow.lg,
  },

  label: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.gray700, marginBottom: Spacing.xs },
  inputBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.gray100,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  inputFocused: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  input: { flex: 1, paddingVertical: 14, paddingHorizontal: Spacing.sm, fontSize: FontSize.md, color: Colors.text },

  loginLink: { flexDirection: "row", justifyContent: "center", marginTop: Spacing.md },
  loginLinkText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: "500" },
});
import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Colors, Spacing, Radius, Shadow, FontSize, Gradients } from "../constants/theme";
import { GradientButton, DecorativeBlob } from "../components/UI";

export default function LoginScreen({ navigation }) {
  const { saveToken } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const isValidEmail = (e) => /\S+@\S+\.\S+/.test(e);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Missing Fields", "Please enter email and password");
    if (!isValidEmail(email)) return Alert.alert("Invalid Email", "Enter a valid email address");

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      try {
        const backendRes = await api.post("/api/auth/login", { email, password });
        if (backendRes.data?.data?.token) {
          await saveToken(backendRes.data.data.token);
        }
      } catch (_) {  }
      navigation.replace("Home");
    } catch (error) {
      let msg = "Login failed. Please try again.";
      if (error.code === "auth/user-not-found") msg = "No account found with this email";
      else if (error.code === "auth/wrong-password") msg = "Incorrect password";
      else if (error.code === "auth/invalid-credential") msg = "Invalid credentials";
      else if (error.code === "auth/too-many-requests") msg = "Too many login attempts. Try again later.";
      else if (error.message) msg = error.message;
      Alert.alert("Login Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) return Alert.alert("Enter Email", "Please enter your email first");
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Email Sent", "Password reset link sent to your inbox");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {}
        <LinearGradient
          colors={Gradients.heroIndigo}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <DecorativeBlob color="#FFFFFF" opacity={0.18} size={220} style={{ top: -60, right: -60 }} />
          <DecorativeBlob color="#FFFFFF" opacity={0.14} size={160} style={{ bottom: -40, left: -40 }} />

          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="home-lightning-bolt" size={42} color="#FFFFFF" />
          </View>
          <Text style={styles.appName}>AI Home Assistant</Text>
          <Text style={styles.tagline}>Smart maintenance, powered by AI</Text>
        </LinearGradient>

        {}
        <View style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          {}
          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputBox, focusedField === "email" && styles.inputFocused]}>
            <Ionicons name="mail-outline" size={18} color={focusedField === "email" ? Colors.primary : Colors.gray500} />
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.gray400}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {}
          <View style={[styles.labelRow, { marginTop: Spacing.md }]}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity onPress={handleResetPassword} activeOpacity={0.7}>
              <Text style={styles.forgotText}>Forgot?</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.inputBox, focusedField === "password" && styles.inputFocused]}>
            <Ionicons name="lock-closed-outline" size={18} color={focusedField === "password" ? Colors.primary : Colors.gray500} />
            <TextInput
              style={styles.input}
              placeholder="Your password"
              placeholderTextColor={Colors.gray400}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword((p) => !p)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.gray600} />
            </TouchableOpacity>
          </View>

          {}
          <GradientButton
            label="Sign In"
            icon="arrow-forward"
            onPress={handleLogin}
            loading={loading}
            colors={Gradients.primary}
            style={{ marginTop: Spacing.lg }}
          />

          {}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {}
          <TouchableOpacity
            style={styles.signupBtn}
            onPress={() => navigation.navigate("Register")}
            activeOpacity={0.8}
          >
            <Text style={styles.signupBtnText}>Create an account</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  hero: {
    paddingTop: 80, paddingBottom: 60, paddingHorizontal: Spacing.lg,
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
  appName: { fontSize: FontSize.display, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.8 },
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

  title: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.text, letterSpacing: -0.4 },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.lg },

  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.xs },
  label: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.gray700 },
  forgotText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: "700" },

  inputBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.gray100,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  inputFocused: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  input: { flex: 1, paddingVertical: 14, paddingHorizontal: Spacing.sm, fontSize: FontSize.md, color: Colors.text },

  divider: { flexDirection: "row", alignItems: "center", marginVertical: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: Spacing.sm, color: Colors.gray500, fontSize: FontSize.sm, fontWeight: "600" },

  signupBtn: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    paddingVertical: 14, alignItems: "center",
    backgroundColor: Colors.white,
  },
  signupBtnText: { color: Colors.text, fontWeight: "700", fontSize: FontSize.md },
});
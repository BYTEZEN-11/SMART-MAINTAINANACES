import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function CustomInput({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  error = "",
  style = {}
}) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = secureTextEntry;

  return (
    <View style={{ marginBottom: 15 }}>
      
      {}
      <View style={[styles.inputContainer, style]}>
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          style={styles.input}
        />

        {}
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color="#555"
            />
          </TouchableOpacity>
        )}
      </View>

      {}
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    padding: 14,
  },
  error: {
    color: "red",
    marginTop: 5,
    fontSize: 12,
  },
});
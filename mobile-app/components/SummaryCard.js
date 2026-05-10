import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function SummaryCard({
  title = "Title",
  value = 0,
  color = "#2196F3"
}) {
  return (
    <View style={[styles.card, { backgroundColor: color }]}>
      
      {}
      <Text style={styles.title}>
        {title}
      </Text>

      {}
      <Text style={styles.value}>
        {value}
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },

  title: {
    color: "#fff",
    fontSize: 14,
  },

  value: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 5,
  },
});
import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert
} from "react-native";
import API from "../services/api";

export default function ApplianceCard({ item, navigation, onRefresh }) {

const isDue = (date) => {
    if (!date) return false;
    return new Date(date) <= new Date();
  };

  const due = isDue(item.serviceDate);

const handleDelete = () => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await API.delete(`/appliances/${item._id}`);
            onRefresh && onRefresh(); 
          } catch (err) {
            Alert.alert("Error", "Delete failed");
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.card, due && styles.dueCard]}>
      
      {}
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.image} />
      ) : (
        <View style={styles.placeholder}>
          <Text>No Image</Text>
        </View>
      )}

      {}
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>

        <Text>Type: {item.type}</Text>
        <Text>Brand: {item.brand}</Text>
        <Text>Model: {item.modelNumber}</Text>
        <Text>Location: {item.location}</Text>
        <Text>Usage: {item.usageFrequency}</Text>

        <Text style={styles.service}>
          Service: {item.serviceDate}
        </Text>

        {}
        <Text style={[styles.status, due ? styles.due : styles.safe]}>
          {due ? "Service Due" : "Safe"}
        </Text>

        {}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() =>
              navigation.navigate("Edit Appliance", { item })
            }
          >
            <Text style={styles.btnText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
          >
            <Text style={styles.btnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
  },
  dueCard: {
    borderWidth: 2,
    borderColor: "red",
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginRight: 10,
  },
  placeholder: {
    width: 90,
    height: 90,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginRight: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  service: {
    fontWeight: "bold",
    marginTop: 5,
  },
  status: {
    marginTop: 5,
    fontWeight: "bold",
  },
  due: {
    color: "red",
  },
  safe: {
    color: "green",
  },
  actions: {
    flexDirection: "row",
    marginTop: 10,
  },
  editBtn: {
    backgroundColor: "#2196F3",
    padding: 6,
    borderRadius: 6,
    marginRight: 10,
  },
  deleteBtn: {
    backgroundColor: "red",
    padding: 6,
    borderRadius: 6,
  },
  btnText: {
    color: "#fff",
  },
});
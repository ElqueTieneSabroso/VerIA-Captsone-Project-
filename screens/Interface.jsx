import React, { useState } from "react";
import { View, Text, Switch, TouchableOpacity, StyleSheet } from "react-native";

export default function Interface() {
  const [contrast, setContrast] = useState(false);
  const [minimal, setMinimal] = useState(false);
  const [size, setSize] = useState("Medium");
  return (
    <View style={styles.container} testID="interface-screen">
      <Text style={styles.title}>Interface</Text>

      <Text style={styles.subtitle}>Button Size</Text>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={size == "Small" ? styles.selected : styles.normal}
          onPress={() => setSize("Small")}
          testID="interface-size-small-button"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Small</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={size == "Medium" ? styles.selected : styles.normal}
          onPress={() => setSize("Medium")}
          testID="interface-size-medium-button"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Medium</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={size == "Large" ? styles.selected : styles.normal}
          onPress={() => setSize("Large")}
          testID="interface-size-large-button"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Large</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <Text style={styles.text}>Minimal Mode</Text>

        <Switch
          value={minimal}
          onValueChange={setMinimal}
          testID="interface-minimal-switch"
          accessibilityLabel="Modo mínimo"
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.text}>High Contrast</Text>

        <Switch
          value={contrast}
          onValueChange={setContrast}
          testID="interface-contrast-switch"
          accessibilityLabel="Alto contraste"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    padding: 25,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 30,
  },

  subtitle: {
    fontSize: 20,
    color: "white",
    marginBottom: 20,
  },

  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },

  normal: {
    borderWidth: 2,
    borderColor: "#2EA8FF",
    padding: 12,
    borderRadius: 20,
  },

  selected: {
    backgroundColor: "#2EA8FF",
    padding: 12,
    borderRadius: 20,
  },

  buttonText: {
    color: "white",
    fontSize: 16,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#555",
  },

  text: {
    color: "white",
    fontSize: 18,
  },
});

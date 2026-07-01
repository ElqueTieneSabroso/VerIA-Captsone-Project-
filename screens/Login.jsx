import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export default function LoginScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        VERIA
      </Text>

      <TextInput
        placeholder="correo"
        style={styles.input}
        accessibilityLabel="Email"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        placeholder="contrasena"
        secureTextEntry
        style={styles.input}
        accessibilityLabel="Password"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Camera")}
        accessibilityRole="button"
        accessibilityLabel="Iniciar sesion"
        accessibilityHint="Sign in and go to the camera screen"
      >
        <Text style={styles.buttonText}>Iniciar Sesion</Text>
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Crear cuenta"
        onPress={() => navigation.navigate("Register")}
      >
        <Text>Crear cuenta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    minHeight: 48,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    minHeight: 48,
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
});

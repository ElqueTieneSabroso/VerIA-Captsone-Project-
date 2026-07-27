import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

import { login } from "../services/auth";
import { isValidEmail } from "../utils/validation";
export default function LoginScreen({ navigation }) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const iniciarSesion = async () => {
    if (!correo.trim() || !contrasena.trim()) {
      Alert.alert("Campos incompletos", "Ingrese su correo y contraseña.");
      return;
    }

    if (!isValidEmail(correo)) {
      Alert.alert("Correo inválido", "Ingrese un correo electrónico válido.");
      return;
    }
    try {
      const respuesta = await login({ correo, contrasena });
      Alert.alert("Bienvenido", respuesta.mensaje);
      navigation.replace("Camera");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", error.message || "No se pudo iniciar sesión.");
    }
  };
  return (
    <View style={styles.container} testID="login-screen">
      <Text style={styles.title}>VerIA</Text>
      <TextInput
        placeholder="E-mail"
        placeholderTextColor="#E8E8E8"
        value={correo}
        onChangeText={setCorreo}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        testID="login-email-input"
        accessibilityLabel="Correo electrónico"
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#E8E8E8"
        value={contrasena}
        onChangeText={setContrasena}
        secureTextEntry
        style={styles.input}
        testID="login-password-input"
        accessibilityLabel="Contraseña"
      />
      <TouchableOpacity
        style={styles.button}
        onPress={iniciarSesion}
        testID="login-submit-button"
        accessibilityRole="button"
        accessibilityLabel="Iniciar sesión"
      >
        <Text style={styles.buttonText}>Log in</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate("Register")}
        testID="login-register-link"
        accessibilityRole="button"
        accessibilityLabel="Crear una cuenta"
      >
        <Text style={styles.registerText}>Don't have an account?</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate("Welcome")}
        testID="login-back-link"
        accessibilityRole="button"
        accessibilityLabel="Volver a bienvenida"
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#171717",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },
  title: {
    color: "white",
    fontSize: 68,
    fontWeight: "900",
    marginBottom: 90,
  },
  input: {
    width: "85%",
    height: 55,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#36AFFF",
    color: "white",
    fontSize: 22,
    paddingHorizontal: 20,
    marginBottom: 18,
    backgroundColor: "#171717",
    shadowColor: "#2FA8FF",
    shadowOpacity: 0.9,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    elevation: 14,
  },
  button: {
    width: "85%",
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
    backgroundColor: "#58B6FF",
    borderWidth: 2,
    borderColor: "#D8F1FF",
    marginTop: 35,
    shadowColor: "#2FA8FF",
    shadowOpacity: 1,
    shadowRadius: 22,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    elevation: 18,
  },
  buttonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "500",
  },
  registerText: {
    color: "#DDDDDD",
    fontSize: 18,
    marginTop: 30,
  },
  backText: {
    color: "#9A9A9A",
    fontSize: 18,
    marginTop: 15,
  },
});

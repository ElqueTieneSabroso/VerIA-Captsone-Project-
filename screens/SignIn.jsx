import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { register } from "../services/auth";
import { isStrongPassword, isValidEmail } from "../utils/validation";

export default function RegisterScreen({ navigation }) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const registrar = async () => {
    if (
      !nombre.trim() ||
      !correo.trim() ||
      !contrasena.trim() ||
      !confirmarContrasena.trim()
    ) {
      Alert.alert("Campos incompletos", "Complete todos los campos.");
      return;
    }
    if (!isValidEmail(correo)) {
      Alert.alert("Correo inválido", "Ingrese un correo electrónico válido.");
      return;
    }
    if (!isStrongPassword(contrasena)) {
      Alert.alert(
        "Contraseña insegura",
        "La contraseña debe contener:\n\n• 8 caracteres mínimo\n• Una mayúscula\n• Una minúscula\n• Un número\n• Un carácter especial.",
      );
      return;
    }
    if (contrasena !== confirmarContrasena) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }
    try {
      const respuesta = await register({ nombre, correo, contrasena });
      Alert.alert("Registro exitoso", respuesta.mensaje);
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo registrar.");
    }
  };
  return (
    <View style={styles.container} testID="register-screen">
      <Text style={styles.title}>VerIA</Text>
      <TextInput
        placeholder="Name"
        placeholderTextColor="#E8E8E8"
        value={nombre}
        onChangeText={setNombre}
        style={styles.input}
        testID="register-name-input"
        accessibilityLabel="Nombre"
      />
      <TextInput
        placeholder="E-mail"
        placeholderTextColor="#E8E8E8"
        value={correo}
        onChangeText={setCorreo}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        testID="register-email-input"
        accessibilityLabel="Correo electrónico"
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#E8E8E8"
        value={contrasena}
        onChangeText={setContrasena}
        secureTextEntry
        style={styles.input}
        testID="register-password-input"
        accessibilityLabel="Contraseña"
      />
      <TextInput
        placeholder="Confirm Password"
        placeholderTextColor="#E8E8E8"
        value={confirmarContrasena}
        onChangeText={setConfirmarContrasena}
        secureTextEntry
        style={styles.input}
        testID="register-confirm-password-input"
        accessibilityLabel="Confirmar contraseña"
      />
      <TouchableOpacity
        style={styles.button}
        onPress={registrar}
        testID="register-submit-button"
        accessibilityRole="button"
        accessibilityLabel="Registrar cuenta"
      >
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate("Login")}
        testID="register-login-link"
        accessibilityRole="button"
        accessibilityLabel="Ir a iniciar sesión"
      >
        <Text style={styles.registerText}>Already have an account?</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate("Welcome")}
        testID="register-back-link"
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
    marginBottom: 60,
  },
  input: {
    width: "85%",
    height: 55,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#36AFFF",
    color: "white",
    fontSize: 20,
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
    marginTop: 25,
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
    fontSize: 22,
    fontWeight: "600",
  },
  registerText: {
    color: "#DDDDDD",
    fontSize: 17,
    marginTop: 25,
  },
  backText: {
    color: "#9A9A9A",
    fontSize: 17,
    marginTop: 15,
  },
});

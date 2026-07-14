import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import axios from "axios";

export default function LoginScreen({ navigation }) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");

const iniciarSesion = async () => {
    if (!correo.trim() || !contrasena.trim()) {
    Alert.alert(
        "Campos incompletos",
        "Ingrese su correo y contraseña."
    );
    return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
    Alert.alert(
        "Correo inválido",
        "Ingrese un correo válido."
    );
    return;
}
}
  try {const respuesta = await axios.post("http://192.168.1.10:3000/api/auth/login",
    {
      correo: correo,
      contrasena: contrasena
      
    }
    
  );
    alert(respuesta.data.mensaje);
    navigation.replace("Camera");
    }
    catch (error) {
      console.log(error);
      if (error.response) {
        console.log("STATUS:", error.response.status);
        console.log("DATA:", error.response.data);
        Alert.alert("Error", error.response.data.mensaje);
      } else if (error.request) {
        console.log("REQUEST:", error.request);
        Alert.alert("Error", "El servidor no respondió.");
      } else {
        console.log("MENSAJE:", error.message);
        Alert.alert("Error", error.message);
      }
       
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>VERIA</Text>
      <TextInput
        placeholder="Correo electrónico"
        value={correo}
        onChangeText={setCorreo}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        accessibilityLabel="Email"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Contraseña"
        value={contrasena}
        onChangeText={setContrasena}
        secureTextEntry
        style={styles.input}
        accessibilityLabel="Password"
      />
      <TouchableOpacity
    style={styles.button}
    onPress={iniciarSesion}
>
    <Text style={styles.buttonText}>
        Iniciar Sesión
    </Text>
</TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Register")}>
        <Text style={styles.buttonText}>¿No tienes cuenta?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Welcome")}>
        <Text style={styles.buttonText}>Regresar</Text>
      </TouchableOpacity>
    </View>
  );
};


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
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  backButton: {
    backgroundColor: '#666',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  }
});

import React from 'react';
import { useState } from 'react';
import axios from 'axios';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  alert,
} from 'react-native';


export default function RegisterScreen() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");

    const register = async () => {
    if (!nombre.trim()) {
        Alert.alert("Error", "Ingrese su nombre.");
        return;
    }
    if (!correo.trim()) {
        Alert.alert("Error", "Ingrese su correo electrónico.");
        return;
    }
    if (!contrasena.trim()) {
        Alert.alert("Error", "Ingrese una contraseña.");
        return;
    }
    if (!confirmarContrasena.trim()) {
        Alert.alert("Error", "Confirme su contraseña.");
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
        Alert.alert("Error", "Correo electrónico inválido.");
        return;
    }
    const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;
    if (!passwordRegex.test(contrasena)) {
        Alert.alert(
            "Contraseña insegura",
            "Debe contener al menos:\n\n• 8 caracteres\n• Una mayúscula\n• Una minúscula\n• Un número\n• Un carácter especial."
        );
        return;
    }
    if (contrasena !== confirmarContrasena) {
        Alert.alert("Error", "Las contraseñas no coinciden.");
        return;
    }
    try {
        const respuesta = await axios.post(
            "http://192.168.1.10:3000/api/auth/register",
            {nombre,correo,contrasena}
        );
        Alert.alert(
            "Registro exitoso",
            respuesta.data.mensaje
        );
        navigation.replace("Login");
    } catch (error) {

    console.log("=========== ERROR LOGIN ===========");
    console.log(error);
    console.log("CODE:", error.code);
    console.log("MESSAGE:", error.message);
    console.log("SQL:", error.sql);
    console.log("SQL MESSAGE:", error.sqlMessage);
    console.log("STACK:", error.stack);
    console.log("==================================");



    }
};
  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
        />

      <TextInput
        placeholder="Correo"
        value={correo}
        onChangeText={setCorreo}
        keyboardType="email-address"
        autoCapitalize="none"
        />

      <TextInput
        placeholder="Contraseña"
        value={contrasena}
        onChangeText={setContrasena}
        secureTextEntry
        />

      <TextInput
        placeholder="Confirmar contraseña"
        value={confirmarContrasena}
        onChangeText={setConfirmarContrasena}
        secureTextEntry
        />

      <TouchableOpacity
    style={styles.button}
    onPress={register}
>
    <Text style={styles.buttonText}>
        Registrarse
    </Text>
</TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    justifyContent:'center',
    padding:20,
  },
  title:{
    fontSize:28,
    marginBottom:30,
    textAlign:'center',
  },
  input:{
    borderWidth:1,
    borderRadius:10,
    padding:12,
    marginBottom:15,
  },
  button:{
    backgroundColor:'#007AFF',
    padding:15,
    borderRadius:10,
  },
  buttonText:{
    textAlign:'center',
    color:'white',
    fontWeight:'bold',
  },
});
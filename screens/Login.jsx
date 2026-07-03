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


export default function LoginScreen( { navigation } ) {
    const [correo, setCorreo] = useState("");
    const [contrasena, setContrasena] = useState("");

const iniciarSesion = async () => {
  try {const respuesta = await axios.post("http://192.168.1.18:3000/api/auth/login",
    {
      correo: correo,
      contrasena: contrasena
    }
  );
      alert(respuesta.data.mensaje);
      navigation.navigate("Welcome");
}
  catch(error){
    if(error.response){
      alert(error.response.data.mensaje);
    }else{
          alert("No se pudo conectar con el servidor.");
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
      />
      <TextInput
        placeholder="Contraseña"
        value={contrasena}
        onChangeText={setContrasena}
        secureTextEntry
        style={styles.input}
      />
      <TouchableOpacity style={styles.button} onPress={iniciarSesion}>
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
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
  container:{
    flex:1,
    justifyContent:'center',
    padding:20,
  },
  title:{
    fontSize:32,
    fontWeight:'bold',
    textAlign:'center',
    marginBottom:40,
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
    marginBottom:15,
  },
  backButton:{
    backgroundColor:'#666',
    padding:15,
    borderRadius:10,
    marginTop:10,
  },
  buttonText:{
    color:'white',
    textAlign:'center',
    fontWeight:'bold',
  }
});
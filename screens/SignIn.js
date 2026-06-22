import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro</Text>

      <TextInput
        placeholder="Nombre"
        style={styles.input}
      />

      <TextInput
        placeholder="Correo"
        style={styles.input}
      />

      <TextInput
        placeholder="Contraseña"
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Registrarse</Text>
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
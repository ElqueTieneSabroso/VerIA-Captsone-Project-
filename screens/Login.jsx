import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from "@react-navigation/native";

import AppNavigator from '../navigator/Application_nav';

export default function LoginScreen( { navigation } ) {
  return (

  <>

          
      <TouchableOpacity onPress={() =>navigation.navigate("App")} style={styles.button}>
      <Text style={styles.buttonText}>Regresar</Text>
      </TouchableOpacity>

    <View style={styles.container}>
      <Text style={styles.title}>VERIA</Text>

      <TextInput
        placeholder="correo"
        style={styles.input}
      />

      <TextInput
        placeholder="contrasena"
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity onPress={() =>navigation.navigate("Register")} style={styles.button}>
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
      </TouchableOpacity>

      <TouchableOpacity>
        <Text>Crear cuenta</Text>
      </TouchableOpacity>
    </View>
     </>
  );
}


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
    marginBottom:20,
  },
  buttonText:{
    color:'white',
    textAlign:'center',
    fontWeight:'bold',
  },
});
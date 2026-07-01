import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import AppNavigator from '/capstone/navigator/Application_nav';

export default function LoginScreen( {navigation} ) {
  return (

  <>
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
exports.login = async (req,res)=>{ const {correo,contrasena} = req.body;
    if(!correo || !contrasena){
        return res.status(400).json({
            mensaje:"Todos los campos son obligatorios"
        });
    }
    try{
        const [usuario] = await db.query(
            "SELECT * FROM Usuarios WHERE Correo=?",
            [correo]
        );
        if(usuario.length==0){
            return res.status(404).json({
                mensaje:"Usuario no encontrado"
            });
        }
        const valido = await bcrypt.compare(
            contrasena,
            usuario[0].Contrasena
        );
        if(!valido){
            return res.status(401).json({
                mensaje:"Contraseña incorrecta"
            });
        }
        res.json({
            mensaje:"Inicio de sesión correcto",
            usuario:usuario[0]
        });
    }
    catch(error){
        res.status(500).json({
            mensaje:"Error del servidor"
        });
    }
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
    marginBottom:20,
  },
  buttonText:{
    color:'white',
    textAlign:'center',
    fontWeight:'bold',
  },
});
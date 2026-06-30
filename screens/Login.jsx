import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

<<<<<<< HEAD
export default function LoginScreen({ navigation }) {
=======
import AppNavigator from '/capstone/navigator/Application_nav';

export default function LoginScreen( {navigation} ) {
>>>>>>> 6aafc439183061fe49d75272e12fecfd7571b28c
  return (

  <>
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        VERIA
      </Text>

      <TextInput
        placeholder="Correo"
        style={styles.input}
        accessibilityLabel="Email"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Contraseña"
        secureTextEntry
        style={styles.input}
        accessibilityLabel="Password"
      />

<<<<<<< HEAD
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Camera')}
        accessibilityRole="button"
        accessibilityLabel="Iniciar sesión"
        accessibilityHint="Sign in and go to the camera screen"
      >
=======
      <TouchableOpacity onPress={() =>navigation.navigate("Register")} style={styles.button}>
>>>>>>> 6aafc439183061fe49d75272e12fecfd7571b28c
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
      </TouchableOpacity>

      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Crear cuenta">
        <Text>Crear cuenta</Text>
      </TouchableOpacity>
    </View>
     </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
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
    marginBottom: 20,
    minHeight: 48,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

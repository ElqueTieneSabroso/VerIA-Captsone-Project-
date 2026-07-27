import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image } from "react-native";

export default function WelcomeScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Login");
    }, 7000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container} testID="welcome-screen">
      <Image
        source={require("../assets/LOGO_2.png")}
        style={styles.logo}
        accessibilityLabel="Logotipo de VerIA"
      />

      <Text style={styles.title}>VERIA</Text>

      <Text style={styles.subtitle}>
        Ayuda visual para personas debiles visuales
      </Text>

      <Text style={styles.loading}>Cargando...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  logo: {
    width: 180,
    height: 180,
    resizeMode: "contain",
    marginBottom: 30,
  },

  title: {
    fontSize: 38,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 60,
  },

  loading: {
    fontSize: 16,
    color: "#999",
  },
});

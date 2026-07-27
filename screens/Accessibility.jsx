import React, { useState } from "react";
import { View, Text, Switch, StyleSheet } from "react-native";

export default function Accessibility() {
  const [talkback, setTalkback] = useState(false);
  const [description, setDescription] = useState(true);
  return (
    <View style={styles.container} testID="accessibility-screen">
      <Text style={styles.title}>Accessibility</Text>
      <View style={styles.row}>
        <Text style={styles.text}>TalkBack Mode</Text>
        <Switch
          value={talkback}
          onValueChange={setTalkback}
          testID="accessibility-talkback-switch"
          accessibilityLabel="Modo TalkBack"
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.text}>Detailed Descriptions</Text>

        <Switch
          value={description}
          onValueChange={setDescription}
          testID="accessibility-description-switch"
          accessibilityLabel="Descripciones detalladas"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    padding: 25,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 30,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#555",
  },

  text: {
    fontSize: 20,
    color: "white",
  },
});

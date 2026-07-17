import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export default function Settings({ navigation }) {
  return (
    <View style={styles.container}>

      <Text style={styles.title}>⚙ Settings</Text>

      <TouchableOpacity
        style={styles.option}
        onPress={() => navigation.navigate("Accessibility")}
      >
        <Text style={styles.optionText}>
          Accessibility
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.option}
        onPress={() => navigation.navigate("Interface")}
      >
        <Text style={styles.optionText}>
          Interface
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.option}
        onPress={() => navigation.navigate("Feedback")}
      >
        <Text style={styles.optionText}>
          Feedback
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logout}
        onPress={() => navigation.replace("Welcome")}
      >
        <Text style={styles.logoutText}>
          Log Out
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:"#111",
    padding:25,
  },

  title:{
    color:"white",
    fontSize:28,
    fontWeight:"bold",
    marginTop:40,
    marginBottom:40,
  },

  option:{
    borderBottomWidth:1,
    borderBottomColor:"#555",
    paddingVertical:20,
  },

  optionText:{
    color:"white",
    fontSize:20,
  },

  logout:{
    marginTop:"auto",
    alignSelf:"flex-end",
    borderWidth:2,
    borderColor:"#2EA8FF",
    borderRadius:30,
    paddingHorizontal:25,
    paddingVertical:10,
  },

  logoutText:{
    color:"white",
    fontSize:18,
  }

});
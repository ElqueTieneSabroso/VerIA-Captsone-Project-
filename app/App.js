import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import AppNavigator from '/capstone/navigator/Application_nav';


const nav = AppNavigator(Navigation);
export default function App() {
  return (
    <view>
      <text>Hola mundo</text>
      <button onClick={navigation.navigate(LoginScreen)}>Ir a login</button>
    </view>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

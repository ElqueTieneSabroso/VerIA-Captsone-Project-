<<<<<<< HEAD:Application_nav.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "./screens/Login";
import SignInScreen from "./screens/SignIn";
import CameraScreen from "./screens/CameraScreen";
=======
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {text, view, button} from 'react-native'
import LoginScreen from '/capstone/screens/Login'
import RegisterScreen from '/capstone/screens/SignIn';
>>>>>>> 6aafc439183061fe49d75272e12fecfd7571b28c:navigator/Application_nav.js

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
<<<<<<< HEAD:Application_nav.js
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="Register"
          component={SignInScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{
            headerShown: false,
          }}
        />
=======
        <Stack.Screen name="Login" component={LoginScreen}/>
        <Stack.Screen name="Register" component={RegisterScreen}/>
>>>>>>> 6aafc439183061fe49d75272e12fecfd7571b28c:navigator/Application_nav.js
      </Stack.Navigator>
    </NavigationContainer>
  );
}

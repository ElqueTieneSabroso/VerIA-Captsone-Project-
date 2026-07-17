import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from '../screens/Login';
import RegisterScreen from '../screens/SignIn';
import WelcomeScreen from '../screens/Welcome';
import CameraScreen from '../screens/CameraScreen';
import Settings from "../screens/Settings";
import Accessibility from "../screens/Accessibility";
import Interface from "../screens/Interface";
import Feedback from "../screens/feedback";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Welcome">
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
          />
          <Stack.Screen
            name="Camera"
            component={CameraScreen}
          />
          <Stack.Screen 
          name="Settings" 
          component={Settings} />

          <Stack.Screen 
          name="Accessibility" 
          component={Accessibility} />
          
          <Stack.Screen 
          name="Interface" 
          component={Interface} />
          
          <Stack.Screen 
          name="Feedback" 
          component={Feedback} />
        </Stack.Navigator>
      </NavigationContainer>
  );
}
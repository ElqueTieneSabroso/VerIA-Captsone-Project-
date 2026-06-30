import React from 'react';
<<<<<<< HEAD:App.js
import AppNavigator from './Application_nav';

export default function App() {
  return <AppNavigator />;
}
=======
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
>>>>>>> 6aafc439183061fe49d75272e12fecfd7571b28c:app/App.js

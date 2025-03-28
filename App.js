import React, {useEffect, useState} from 'react';

import TestScreen from './screens/TestScreen';
import ControlScreen from './screens/ControlScreen';
import SplashScreen from './screens/SplashScreen';
import LoadingScreen from './screens/SearchScreen';
import {DarkTheme, NavigationContainer} from '@react-navigation/native';
import {TransitionPresets, createStackNavigator} from '@react-navigation/stack';
import store from './redux/store/store';
import {Provider} from 'react-redux';
import FanControlScreen from './screens/FanControlScreen';
const Stack = createStackNavigator();

const App = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 3200);
    return () => {
      clearTimeout();
    };
  }, []);
  return (
    <Provider store={store}>
      <NavigationContainer theme={DarkTheme}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            ...TransitionPresets.SlideFromRightIOS,
          }}>
          {loading ? (
            <Stack.Screen name="Splash" component={SplashScreen} />
          ) : (
            <>
              <Stack.Screen name="NewDevice" component={TestScreen} />
              <Stack.Screen
                name="FanControlScreen"
                component={FanControlScreen}
              />
              <Stack.Screen name="LoadingScreen" component={LoadingScreen} />
              <Stack.Screen name="Control" component={ControlScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
};

export default App;

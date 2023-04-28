import React from 'react'

import TestScreen from './screens/TestScreen'
import ControlScreen from './screens/ControlScreen'

import { DarkTheme, NavigationContainer, useTheme } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'

import store from './redux/store/store'
import { Provider } from 'react-redux'


const Stack = createStackNavigator()

const App = () => {
  return (
    <Provider store={store}>
    <NavigationContainer
      theme={DarkTheme}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        
      >
        <Stack.Screen name="Test" component={TestScreen} />
        <Stack.Screen name="Control" component={ControlScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    </Provider>
  )
}

export default App



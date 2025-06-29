import {View, Text, StyleSheet, Image} from 'react-native';
import React from 'react';
import Lottie from 'lottie-react-native';

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Lottie source={require('../screens/lottie/game.json')} autoPlay loop />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});

export default SplashScreen;

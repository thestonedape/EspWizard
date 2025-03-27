import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Alert,
  BackHandler,
  ToastAndroid,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Lottie from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedButton } from 'react-native-really-awesome-button';

export default function LoadingScreen({ navigation }) {
  const dispatch = useDispatch();
  const server = useSelector((state) => state.server);
  const connectedDevices = useSelector((state) => state.connectedDevices || []);
  const sockets = useSelector((state) => state.sockets || []);
  const isMounted = useRef(true);
  const isStopping = useRef(false);
  const hasNavigated = useRef(false);
  const navigationTimeout = useRef(null);
  const [serverAddress, setServerAddress] = useState({ ip: 'Unknown', port: 'Unknown' });

  // Safely fetch server address
  useEffect(() => {
    if (server) {
      try {
        const address = server.address();
        setServerAddress({
          ip: address?.address || 'Unknown',
          port: address?.port || 'Unknown',
        });
      } catch (error) {
        console.error('Error getting server address:', error);
        setServerAddress({ ip: 'Unknown', port: 'Unknown' });
      }
    } else {
      setServerAddress({ ip: 'Server stopped', port: 'Server stopped' });
    }
  }, [server]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (server && !isStopping.current) {
        stopServer();
      }
      if (navigationTimeout.current) {
        clearTimeout(navigationTimeout.current);
      }
    };
  }, [server]);

  const stopServer = async () => {
    if (isStopping.current) {
      console.log('Stop server already in progress, ignoring');
      return;
    }
    isStopping.current = true;

    try {
      console.log('Server state:', server ? 'active' : 'null');
      console.log('Connected devices:', connectedDevices.length);
      console.log('Sockets:', sockets.length);

      if (server) {
        sockets.forEach((socket) => {
          console.log(`Destroying socket: ${socket.remoteAddress}:${socket.remotePort}`);
          try {
            socket.removeAllListeners();
            socket.destroy();
          } catch (e) {
            console.error(`Failed to destroy socket ${socket.remoteAddress}:${socket.remotePort}:`, e);
          }
        });

        server.removeAllListeners();
        console.log('Server listeners removed, closing server');
        server.close(() => {
          console.log('Server closed in stopServer');
        });

        await AsyncStorage.setItem('serverState', JSON.stringify({ isRunning: false }));
        console.log('AsyncStorage updated');

        if (isMounted.current) {
          dispatch({ type: 'STOP_SERVER' });
          console.log('STOP_SERVER dispatched');
          console.log('Navigating back to NewDevice');
          try {
            navigation.reset({
              index: 0,
              routes: [{ name: 'NewDevice' }],
            });
          } catch (navError) {
            console.error('Navigation error:', navError);
            ToastAndroid.show('Navigation failed: ' + navError.message, ToastAndroid.LONG);
          }
        }
      } else {
        console.log('No server to stop');
        if (isMounted.current) {
          dispatch({ type: 'STOP_SERVER' });
          console.log('Navigating back to NewDevice');
          try {
            navigation.reset({
              index: 0,
              routes: [{ name: 'NewDevice' }],
            });
          } catch (navError) {
            console.error('Navigation error:', navError);
            ToastAndroid.show('Navigation failed: ' + navError.message, ToastAndroid.LONG);
          }
        }
      }
    } catch (error) {
      console.error('Error during stopServer:', error);
      if (isMounted.current) {
        ToastAndroid.show('Error stopping server: ' + error.message, ToastAndroid.SHORT);
        console.log('Navigating back to NewDevice despite error');
        try {
          navigation.reset({
            index: 0,
            routes: [{ name: 'NewDevice' }],
          });
        } catch (navError) {
          console.error('Navigation error:', navError);
          ToastAndroid.show('Navigation failed: ' + navError.message, ToastAndroid.LONG);
        }
      }
    } finally {
      isStopping.current = false;
      console.log('Stop server process completed');
    }
  };

  const handleStopServer = () => {
    Alert.alert(
      'Stop Server?',
      'Are you sure you want to stop the server?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            await stopServer();
          },
        },
      ],
      { cancelable: false }
    );
  };

  useEffect(() => {
    const backAction = () => {
      if (isStopping.current) {
        console.log('Back press ignored, server stopping in progress');
        return true;
      }
      Alert.alert(
        'Stop Server?',
        'Are you sure you want to stop the server and go back?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes',
            onPress: async () => {
              await stopServer();
            },
          },
        ],
        { cancelable: false }
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => {
      backHandler.remove();
    };
  }, [dispatch, navigation, server]);

  useFocusEffect(
    React.useCallback(() => {
      console.log('LoadingScreen focused, resetting hasNavigated');
      hasNavigated.current = false;
      return () => {
        console.log('LoadingScreen unfocused');
        if (navigationTimeout.current) {
          clearTimeout(navigationTimeout.current);
        }
      };
    }, [])
  );

  useEffect(() => {
    if (!isMounted.current || hasNavigated.current) return;

    console.log('LoadingScreen useEffect - Server:', server ? 'active' : 'null');
    console.log('Connected devices:', connectedDevices.length);

    if (!server) {
      console.log('Server stopped unexpectedly, navigating to NewDevice');
      ToastAndroid.show('Server stopped unexpectedly', ToastAndroid.SHORT);
      hasNavigated.current = true;
      if (navigationTimeout.current) clearTimeout(navigationTimeout.current);
      navigationTimeout.current = setTimeout(() => {
        try {
          navigation.reset({
            index: 0,
            routes: [{ name: 'NewDevice' }],
          });
        } catch (navError) {
          console.error('Navigation error:', navError);
          ToastAndroid.show('Navigation failed: ' + navError.message, ToastAndroid.LONG);
        }
      }, 500);
      return;
    }

    if (connectedDevices.length > 0) {
      console.log('Devices connected, navigating to Control');
      hasNavigated.current = true;
      if (navigationTimeout.current) clearTimeout(navigationTimeout.current);
      navigationTimeout.current = setTimeout(() => {
        navigation.navigate('Control');
      }, 500);
    }
  }, [server, connectedDevices, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <View style={styles.header}>
        <View style={[styles.statusDot, { backgroundColor: server ? '#5dbe74' : '#ff4d4d' }]} />
        <Text style={styles.statusText}>
          {server ? 'Online' : 'Server stopped'}
        </Text>
      </View>
      <View style={styles.lottieContainer}>
      <Lottie
          style={styles.lottie}
          source={require('../screens/lottie/loading.json')}
          autoPlay
          loop
          onError={(error) => console.error('Lottie error:', error)}
        />
      </View>
      <Text style={styles.infoText}>{serverAddress.ip}:{serverAddress.port}</Text>
      <ThemedButton name="bruce" type="primary" onPress={handleStopServer} style={styles.button}>
      <Text style={styles.buttonText}>Stop Server</Text>
      </ThemedButton>
        
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    width: width,
    alignItems: 'center',
    height: height * 0.12,
    justifyContent: 'center',
  },
  title: {
    fontSize: width * 0.08,
    fontFamily: 'NeueMetana-Bold',
    color: '#EEE',
    textAlign: 'center',
  },
  lottieContainer: {
    width: width,
    height: height * 0.65,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: width * 0.9,
    height: width * 0.9,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    width: width *
    0.9,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: width * 0.045,
    fontFamily: 'NeueMetana-Bold',
  },
  infoText: {
    color: '#fff',
    fontSize: width * 0.04,
    fontFamily: 'Gilroy-ExtraBold',
    marginBottom: height * 0.04,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: height * 0.10, 
  },
  buttonText: {
    color: '#5dbe74',
    fontSize: width * 0.045,
    fontFamily: 'Gilroy-ExtraBold',
    textAlign: 'center',
  },
});
import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  Text,
  View,
  StatusBar,
  StyleSheet,
  ToastAndroid,
  Image,
  TextInput,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {ThemedButton} from 'react-native-really-awesome-button';
import {useNavigation, useRoute} from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import {useDispatch, useSelector} from 'react-redux';
import TcpSocket from 'react-native-tcp-socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import debounce from 'lodash/debounce';

export default function NewDevice() {
  console.log('NewDevice component mounted');
  const navigation = useNavigation();
  const route = useRoute();
  const [foundDevices, setFoundDevices] = useState([]);
  const [customIp, setCustomIp] = useState('');
  const [networkType, setNetworkType] = useState(null);
  const serverRef = useRef(null);
  const dispatch = useDispatch();
  const server = useSelector(state => state.server);
  const isStopping = useRef(false);
  const isMounted = useRef(true);
  const hasCheckedServerState = useRef(false);
  const hasNavigated = useRef(false);

  const opacity = useSharedValue(1);

  const debouncedSetNetworkType = useCallback(
    debounce(type => {
      if (isMounted.current) {
        setNetworkType(type);
      }
    }, 500),
    [],
  );

  useEffect(() => {
    isMounted.current = true;
    const loadSavedIp = async () => {
      try {
        const savedIp = await AsyncStorage.getItem('hotspotIp');
        if (savedIp) {
          console.log('Loaded saved hotspot IP:', savedIp);
          setCustomIp(savedIp);
        }
      } catch (error) {
        console.error('Failed to load saved hotspot IP:', error);
      }
    };
    loadSavedIp();

    return () => {
      isMounted.current = false;
      console.log('NewDevice unmounted, keeping server alive');
    };
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('Network state changed:', state);
      debouncedSetNetworkType(state.type);
      if (state.type !== 'wifi' && state.type !== 'cellular') {
        ToastAndroid.show(
          'Please connect to WiFi or enable hotspot',
          ToastAndroid.SHORT,
        );
      }
      opacity.value = withTiming(0, {duration: 300}, () => {
        opacity.value = withTiming(1, {duration: 300});
      });
    });

    NetInfo.fetch().then(state => {
      console.log('Initial network state:', state);
      debouncedSetNetworkType(state.type);
    });

    return () => {
      console.log('Unsubscribing from NetInfo listener');
      unsubscribe();
      debouncedSetNetworkType.cancel();
    };
  }, [debouncedSetNetworkType]);

  const getLocalIp = async () => {
    try {
      const connectionInfo = await NetInfo.fetch();
      console.log('Fetching IP - Network type:', connectionInfo.type);
      console.log('Connection details:', connectionInfo.details);

      if (
        connectionInfo.type !== 'wifi' &&
        connectionInfo.type !== 'cellular'
      ) {
        console.log('Invalid network type, aborting IP fetch');
        ToastAndroid.show(
          'Please connect to WiFi or enable hotspot',
          ToastAndroid.SHORT,
        );
        return null;
      }

      let ipAddress = connectionInfo.details.ipAddress;
      console.log('Detected IP from NetInfo:', ipAddress);

      if (connectionInfo.type === 'wifi') {
        if (
          !ipAddress ||
          ipAddress === '0.0.0.0' ||
          ipAddress.startsWith('169.254')
        ) {
          console.log('Invalid WiFi IP, falling back to default');
          ipAddress = '192.168.1.1';
          ToastAndroid.show(
            'Could not detect WiFi IP, using default: 192.168.1.1',
            ToastAndroid.LONG,
          );
          return {bindAddress: '0.0.0.0', displayAddress: ipAddress};
        }
        console.log('Using detected WiFi IP:', ipAddress);
        return {bindAddress: ipAddress, displayAddress: ipAddress};
      }

      if (connectionInfo.type === 'cellular') {
        if (!customIp) {
          console.log('No custom IP provided for hotspot');
          ToastAndroid.show(
            'Please enter your hotspot IP (check in Hotspot Settings)',
            ToastAndroid.LONG,
          );
          return null;
        }

        const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
        if (!ipRegex.test(customIp)) {
          console.log('Invalid IP format:', customIp);
          ToastAndroid.show(
            'Invalid IP format. Use format like 192.168.19.131',
            ToastAndroid.LONG,
          );
          return null;
        }

        try {
          await AsyncStorage.setItem('hotspotIp', customIp);
          console.log('Saved hotspot IP to AsyncStorage:', customIp);
        } catch (error) {
          console.error('Failed to save hotspot IP to AsyncStorage:', error);
        }

        console.log('Using custom hotspot IP:', customIp);
        ToastAndroid.show(`Using hotspot IP: ${customIp}`, ToastAndroid.SHORT);
        return {bindAddress: '0.0.0.0', displayAddress: customIp};
      }

      return null;
    } catch (error) {
      console.error('Error in getLocalIp:', error);
      ToastAndroid.show(
        'Failed to detect network: ' + error.message,
        ToastAndroid.SHORT,
      );
      return null;
    }
  };

  const startTCPServer = async () => {
    if (server) {
      console.log('Server already running, navigating to LoadingScreen');
      ToastAndroid.show('Server is already running', ToastAndroid.SHORT);
      hasNavigated.current = true;
      navigation.replace('LoadingScreen');
      return;
    }

    const ipResult = await getLocalIp();
    if (!ipResult) {
      console.log('Failed to get IP, aborting server start');
      return;
    }

    const {bindAddress, displayAddress} = ipResult;
    let port = 8080;
    let serverInstance;

    const tryListen = port => {
      return new Promise((resolve, reject) => {
        console.log('Creating TCP server on port:', port);
        serverInstance = TcpSocket.createServer(socket => {
          console.log(
            `Client connected: ${socket.remoteAddress}:${socket.remotePort}`,
          );
          setFoundDevices(prev => {
            const exists = prev.some(dev => dev.ip === socket.remoteAddress);
            console.log('Updating foundDevices, device exists:', exists);
            return exists
              ? prev
              : [...prev, {ip: socket.remoteAddress, message: 'Connected'}];
          });
          dispatch({
            type: 'ADD_CONNECTED_DEVICE',
            payload: {
              ip: socket.remoteAddress,
              port: socket.remotePort,
              socket,
            },
          });

          socket.on('data', data => {
            const message = data.toString();
            console.log(
              'Received data from',
              socket.remoteAddress,
              ':',
              message,
            );
            dispatch({
              type: 'ADD_MESSAGE',
              payload: {
                ip: socket.remoteAddress,
                port: socket.remotePort,
                message,
              },
            });
          });

          socket.on('close', () => {
            console.log('Client disconnected:', socket.remoteAddress);
            dispatch({
              type: 'REMOVE_CONNECTED_DEVICE',
              payload: {ip: socket.remoteAddress, port: socket.remotePort},
            });
          });

          socket.on('error', error => {
            console.error('Socket error:', error);
            socket.destroy();
            dispatch({
              type: 'REMOVE_CONNECTED_DEVICE',
              payload: {ip: socket.remoteAddress, port: socket.remotePort},
            });
          });
        });

        serverInstance.on('error', error => {
          console.error('Server error:', error || 'Unknown error');
          reject(error || new Error('Unknown server error'));
        });

        serverInstance.on('close', () => {
          console.log('Server closed');
        });

        console.log(`Attempting to listen on ${bindAddress}:${port}`);
        serverInstance.listen(
          {port, host: bindAddress, reuseAddress: true},
          () => {
            console.log(
              `TCP Server started at tcp://${displayAddress}:${port}`,
            );
            resolve();
          },
        );
      });
    };

    try {
      await tryListen(port);
    } catch (error) {
      console.error('Error starting server on port', port, ':', error);
      const errorMessage = error.message || String(error);
      if (errorMessage.includes('EADDRINUSE') && port === 8080) {
        console.log('Port 8080 in use, trying 8081');
        port = 8081;
        try {
          await tryListen(port);
        } catch (fallbackError) {
          console.error(
            'Failed to start server on fallback port 8081:',
            fallbackError,
          );
          ToastAndroid.show(
            'Failed to start server: ' +
              (fallbackError.message || 'Unknown error'),
            ToastAndroid.SHORT,
          );
          dispatch({type: 'SET_SERVER', payload: null});
          await AsyncStorage.setItem(
            'serverState',
            JSON.stringify({isRunning: false}),
          );
          return;
        }
      } else {
        ToastAndroid.show(
          'Failed to start server: ' + errorMessage,
          ToastAndroid.SHORT,
        );
        dispatch({type: 'SET_SERVER', payload: null});
        await AsyncStorage.setItem(
          'serverState',
          JSON.stringify({isRunning: false}),
        );
        return;
      }
    }

    console.log('Dispatching SET_SERVER with server instance');
    dispatch({type: 'SET_SERVER', payload: serverInstance});
    try {
      await AsyncStorage.setItem(
        'serverState',
        JSON.stringify({isRunning: true, ip: displayAddress, port}),
      );
      console.log('Server state saved to AsyncStorage:', {
        isRunning: true,
        ip: displayAddress,
        port,
      });
    } catch (error) {
      console.error('Failed to save server state to AsyncStorage:', error);
    }
    ToastAndroid.show(
      `Server started at ${displayAddress}:${port}`,
      ToastAndroid.SHORT,
    );
    hasNavigated.current = true;
    navigation.replace('LoadingScreen');

    serverRef.current = serverInstance;
  };

  useEffect(() => {
    console.log('Running checkServerState useEffect');
    if (hasCheckedServerState.current || hasNavigated.current) {
      console.log('Server state already checked or navigated, skipping');
      return;
    }

    const checkServerState = async () => {
      console.log('Starting checkServerState');
      try {
        const storedState = await AsyncStorage.getItem('serverState');
        console.log('Checking server state from AsyncStorage:', storedState);
        if (storedState) {
          const {isRunning} = JSON.parse(storedState);
          const fromLoadingScreen = route.params?.fromLoadingScreen || false;
          console.log('From LoadingScreen:', fromLoadingScreen);

          if (isRunning && server && !fromLoadingScreen) {
            console.log('Server is running, navigating to LoadingScreen');
            hasNavigated.current = true;
            navigation.replace('LoadingScreen');
          } else if (isRunning && !server) {
            console.log('Server state mismatch, resetting server state');
            await AsyncStorage.setItem(
              'serverState',
              JSON.stringify({isRunning: false}),
            );
            dispatch({type: 'STOP_SERVER'});
          } else if (fromLoadingScreen) {
            console.log(
              'Navigation from LoadingScreen detected, skipping auto-navigation',
            );
          }
        }
      } catch (error) {
        console.error('Error checking server state:', error);
      }
      console.log('Finished checkServerState');
    };

    checkServerState();
    hasCheckedServerState.current = true;

    return () => {
      console.log('Cleaning up NewDevice component');
    };
  }, [server, navigation, dispatch, route.params]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{translateY: withTiming(opacity.value === 1 ? 0 : 10)}],
    };
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar backgroundColor="#000" barStyle="light-content" />
        <View style={styles.header}>
          <Text style={styles.title}>ESP Wizard</Text>
        </View>
        <View style={styles.imageContainer}>
          <Image
            source={require('../screens/lottie/homeanimation.gif')}
            style={styles.image}
          />
        </View>
        <Animated.View style={[styles.bottomContainer, animatedStyle]}>
          {networkType === 'cellular' ? (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Enter Hotspot IP:</Text>
              <Text style={styles.hint}>
                Find your hotspot IP in Settings {'>'} Hotspot {'>'} Advanced
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 192.168.19.131"
                  placeholderTextColor="#888"
                  value={customIp}
                  onChangeText={setCustomIp}
                  keyboardType="numeric"
                />
                <View
                  style={{
                    width: 1,
                    height: '100%',
                    backgroundColor: '#555',
                  }}
                />
                <TouchableOpacity
                  onPress={startTCPServer}
                  style={styles.smallButton}>
                  <Text style={styles.smallButtonText}>Start</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <ThemedButton
                name="bruce"
                type="primary"
                onPress={startTCPServer}
                style={styles.button}>
                <Text style={styles.buttonText}>Start Server</Text>
              </ThemedButton>
            </View>
          )}
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const {width, height} = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  header: {
    height: height * 0.12,
    justifyContent: 'center',
  },
  title: {
    fontSize: width * 0.08,
    fontFamily: 'NeueMetana-Bold',
    color: '#EEE',
    textAlign: 'center',
  },
  imageContainer: {
    flex: 1,
  },
  image: {
    width: width * 1.2,
    height: width * 1.2,
    resizeMode: 'contain',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: height * 0.1,
    width: '100%',
    alignItems: 'center',
  },
  inputContainer: {
    width: width * 0.85,
    alignItems: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    backgroundColor: '#333',
    borderRadius: 5,
    padding: 5,
  },
  label: {
    color: '#EEE',
    fontSize: width * 0.045,
    marginBottom: height * 0.01,
    textAlign: 'center',
  },
  hint: {
    color: '#AAA',
    fontSize: width * 0.035,
    marginBottom: height * 0.015,
    textAlign: 'center',
  },
  input: {
    color: '#FFF',
    padding: height * 0.015,
    borderRadius: 5,
    textAlign: 'center',
    fontSize: width * 0.04,
    flex: 1,
    marginRight: width * 0.03,
  },
  button: {
    width: width * 0.55,
    height: height * 0.07,
  },
  smallButton: {
    width: width * 0.25,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  buttonText: {
    fontSize: width * 0.055,
    fontFamily: 'Gilroy-ExtraBold',
    color: '#5dbe74',
  },
  smallButtonText: {
    fontSize: width * 0.04,
    fontFamily: 'Gilroy-ExtraBold',
    color: '#5dbe74',
  },
});

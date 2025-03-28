import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ToastAndroid,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import dgram from 'react-native-udp';
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';

const {width, height} = Dimensions.get('window');

export default function FanControlUDPScreen({navigation, route}) {
  const selectedDeviceId = route?.params?.deviceId || 'dc54750db3b8';
  const [fanState, setFanState] = useState({
    power: false,
    speed: 0,
    sleep: false,
    led: false,
    fanTimer: 0,
    fanTimerElapsedMins: 0,
    brightness: 0,
    cool: false,
    warm: false,
    color: 'Unknown',
    isOnline: false,
  });

  const rotate = useSharedValue(0);
  const bounce = useSharedValue(1);

  useEffect(() => {
    if (fanState.power) {
      rotate.value = withRepeat(
        withTiming(360, {duration: 2000, easing: Easing.linear}),
        -1,
        false,
      );
    } else {
      rotate.value = withTiming(0, {duration: 200, easing: Easing.linear});
    }
  }, [fanState.power]);

  const animatedRotateStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${rotate.value}deg`}],
  }));

  const animatedBounceStyle = useAnimatedStyle(() => ({
    transform: [{scale: bounce.value}],
  }));

  const triggerBounce = () => {
    bounce.value = withTiming(0.9, {duration: 100}, () =>
      withTiming(1, {duration: 100}),
    );
  };

  useEffect(() => {
    let udpSocket = null;
    let isMounted = true;
    let timeoutId = null;

    const setupSocket = async () => {
      try {
        console.log('dgram object:', dgram);
        console.log('dgram.createSocket:', dgram.createSocket);
        console.log('Creating UDP socket with react-native-udp...');
        if (typeof dgram.createSocket !== 'function') {
          throw new Error(
            'createSocket is not a function. Check react-native-udp version and linking.',
          );
        }
        udpSocket = dgram.createSocket('udp4');
        console.log('UDP socket created:', udpSocket);

        console.log('Attempting to bind to port 5625...');
        udpSocket.bind(5625, () => {
          console.log('UDP Socket bound to port: 5625');
          try {
            console.log('Setting broadcast to true...');
            udpSocket.setBroadcast(true);
            console.log('Broadcast set to true');
          } catch (broadcastError) {
            console.error('Error setting broadcast:', broadcastError);
            if (isMounted) {
              ToastAndroid.show(
                'Error setting broadcast: ' + broadcastError.message,
                ToastAndroid.LONG,
              );
            }
          }
        });

        udpSocket.on('error', error => {
          console.error('UDP Socket Error:', error);
          if (isMounted) {
            ToastAndroid.show(
              'UDP Socket Error: ' + error.message,
              ToastAndroid.LONG,
            );
          }
        });

        udpSocket.on('close', () => {
          console.log('UDP socket closed');
        });

        udpSocket.on('message', (msg, rinfo) => {
          console.log(
            'Received UDP message:',
            msg.toString('hex'),
            'from',
            rinfo.address,
            ':',
            rinfo.port,
          );
          const asciiMessage = msg
            .toString('hex')
            .match(/.{1,2}/g)
            .map(hex => String.fromCharCode(parseInt(hex, 16)))
            .join('');
          console.log('ASCII Message:', asciiMessage);

          try {
            const parsedMessage = JSON.parse(asciiMessage);
            if (
              parsedMessage.device_id === selectedDeviceId &&
              parsedMessage.state_string
            ) {
              const stateFields = parsedMessage.state_string.split(',');
              const value = parseInt(stateFields[0], 10);

              const newState = {
                power: (0x10 & value) > 0,
                led: (0x20 & value) > 0,
                sleep: (0x80 & value) > 0,
                speed: 0x07 & value,
                fanTimer: Math.round((0x0f0000 & value) / 65536),
                fanTimerElapsedMins: Math.round(
                  ((0xff000000 & value) * 4) / 16777216,
                ),
                brightness: Math.round((0x7f00 & value) / 256),
                cool: (0x08 & value) > 0,
                warm: (0x8000 & value) > 0,
                isOnline: true,
              };
              newState.color =
                newState.cool && newState.warm
                  ? 'Daylight'
                  : newState.cool
                  ? 'Cool'
                  : newState.warm
                  ? 'Warm'
                  : 'Unknown';

              console.log('Parsed Fan State:', newState);
              if (isMounted) {
                setFanState(newState);
                // Reset the timeout since we received a message
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                  if (isMounted) {
                    setFanState(prevState => ({...prevState, isOnline: false}));
                    ToastAndroid.show(
                      'Fan is offline (no messages received)',
                      ToastAndroid.LONG,
                    );
                  }
                }, 30000); // 30 seconds timeout
              }
            }
          } catch (error) {
            console.error('Error parsing UDP message:', error);
          }
        });

        udpSocket.on('listening', () => {
          const address = udpSocket.address();
          console.log(
            'Socket listening on',
            address.address,
            ':',
            address.port,
          );
        });

        // Initial timeout to set fan as offline if no messages are received
        timeoutId = setTimeout(() => {
          if (isMounted) {
            setFanState(prevState => ({...prevState, isOnline: false}));
            ToastAndroid.show(
              'Fan is offline (no messages received)',
              ToastAndroid.LONG,
            );
          }
        }, 30000); // 30 seconds timeout
      } catch (error) {
        console.error('Failed to set up UDP socket:', error);
        if (isMounted) {
          ToastAndroid.show(
            'Failed to set up UDP socket: ' + error.message,
            ToastAndroid.LONG,
          );
        }
        if (udpSocket) {
          try {
            console.log('Closing UDP socket due to setup failure...');
            udpSocket.close();
          } catch (closeError) {
            console.error(
              'Error closing UDP socket after setup failure:',
              closeError,
            );
          }
        }
      }
    };

    setupSocket();

    return () => {
      console.log('Unmounting FanControlUDPScreen, cleaning up UDP socket...');
      isMounted = false;
      clearTimeout(timeoutId);
      if (udpSocket) {
        try {
          udpSocket.close();
          console.log('UDP socket closed during cleanup');
        } catch (closeError) {
          console.error('Error closing UDP socket during cleanup:', closeError);
        }
      }
    };
  }, [selectedDeviceId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation && typeof navigation.goBack === 'function') {
              navigation.goBack();
            } else {
              ToastAndroid.show('Cannot go back', ToastAndroid.SHORT);
            }
          }}
          style={styles.backButton}>
          <Icon name="arrow-left" size={width * 0.06} color="#EEE" />
        </TouchableOpacity>
        <Text style={styles.title}>Fan Control (UDP)</Text>
      </View>

      <Animated.View style={[styles.statusCard, {opacity: 1}]}>
        <View style={styles.statusRow}>
          <Icon
            name="wifi"
            size={width * 0.05}
            color={fanState.isOnline ? '#5dbe74' : '#ff4d4d'}
            style={styles.statusIcon}
          />
          <Text style={styles.statusText}>
            Fan is {fanState.isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Icon
            name="fan"
            size={width * 0.05}
            color={fanState.power ? '#5dbe74' : '#ff4d4d'}
            style={styles.statusIcon}
          />
          <Text style={styles.statusText}>
            Fan is {fanState.power ? 'ON' : 'OFF'}
          </Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.speedContainer, {transform: [{scale: 1}]}]}>
        <LinearGradient
          colors={['#5dbe74', '#3d8b4f']}
          style={styles.speedCircle}>
          <Animated.View style={[styles.fanIconContainer, animatedRotateStyle]}>
            <Icon name="fan" size={width * 0.12} color="#fff" />
          </Animated.View>
          <Text style={styles.speedText}>{fanState.speed || 'N/A'}</Text>
          <Text style={styles.speedLabel}>Speed</Text>
        </LinearGradient>
      </Animated.View>

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Icon
            name="moon"
            size={width * 0.04}
            color="#fff"
            style={styles.infoIcon}
          />
          <Text style={styles.infoText}>
            Sleep Mode: {fanState.sleep ? 'ON' : 'OFF'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Icon
            name="clock"
            size={width * 0.04}
            color="#fff"
            style={styles.infoIcon}
          />
          <Text style={styles.infoText}>
            Timer: {fanState.fanTimer || 0} hours
          </Text>
        </View>
        {fanState.brightness > 0 && (
          <View style={styles.infoRow}>
            <Icon
              name="lightbulb"
              size={width * 0.04}
              color="#fff"
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              Brightness: {fanState.brightness}%, Color: {fanState.color}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.noteContainer}>
        <Text style={styles.noteText}>
          Note: Control buttons are disabled as the HTTP API is unavailable.
          This screen displays the fan's state received via UDP broadcasts on
          port 5625.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  header: {
    height: height * 0.12,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    left: 20,
  },
  title: {
    fontSize: width * 0.08,
    color: '#EEE',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 15,
    marginVertical: 10,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  statusIcon: {
    marginRight: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: width * 0.045,
  },
  speedContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  speedCircle: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5dbe74',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  fanIconContainer: {
    marginBottom: 10,
  },
  speedText: {
    color: '#fff',
    fontSize: width * 0.1,
  },
  speedLabel: {
    color: '#fff',
    fontSize: width * 0.04,
    marginTop: 5,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    marginVertical: 10,
    flexWrap: 'wrap',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    color: '#fff',
    fontSize: width * 0.04,
  },
  noteContainer: {
    width: '90%',
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    marginTop: 20,
  },
  noteText: {
    color: '#fff',
    fontSize: width * 0.04,
    textAlign: 'center',
  },
});

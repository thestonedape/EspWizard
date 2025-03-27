import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ToastAndroid,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';


const { width, height } = Dimensions.get('window');
const API_BASE_URL = 'https://api.developer.atomberg-iot.com';

const API_KEY = 'jFDpKLUQQr3xv1vzelbORanNNE0b0E3w1im1dMUF';
const REFRESH_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6Imdvb2dsZV8xMDM3ODE0MTg4MzYzNDk1NTI3NjkiLCJ0eXBlIjoicmVmcmVzaCIsImlzcyI6ImRldmVsb3Blci5hdG9tYmVyZy1pb3QuY29tIiwiZGV2ZWxvcGVyX2lkIjoidzZobW16ZmNpaiIsImp0aSI6ImY5ZjdiNzA4LTYyYmUtNDFjNC05NTQ1LTk5NjAwMzMyMzI2MSIsImlhdCI6MTc0MjkwMjE1NCwiZXhwIjoyMDU4MjYyMTU0fQ.sAKpC_xzkRrnude0uDoiDvYHo6dz_s0L10m5jhgJin4';

export default function FanControlScreen({ navigation }) {
  const [devices, setDevices] = useState([]);
  const [fanState, setFanState] = useState(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [rateLimitExceeded, setRateLimitExceeded] = useState(false);

  // Store API credentials in AsyncStorage
  useEffect(() => {
    const storeApiCredentials = async () => {
      try {
        console.log('Storing API credentials:', { API_KEY, REFRESH_TOKEN });
        await AsyncStorage.setItem('atombergApiKey', API_KEY);
        await AsyncStorage.setItem('atombergRefreshToken', REFRESH_TOKEN);
        console.log('API credentials stored successfully');
      } catch (error) {
        console.error('Error storing API credentials:', error);
        ToastAndroid.show('Failed to store API credentials', ToastAndroid.SHORT);
      }
    };
    storeApiCredentials();
  }, []);

  const getApiCredentials = async () => {
    try {
      const apiKey = await AsyncStorage.getItem('atombergApiKey');
      const refreshToken = await AsyncStorage.getItem('atombergRefreshToken');
      console.log('Retrieved API credentials:', { apiKey, refreshToken });
      return { apiKey, refreshToken };
    } catch (error) {
      console.error('Error retrieving API credentials:', error);
      return { apiKey: null, refreshToken: null };
    }
  };

  const fetchAccessToken = async () => {
    const { apiKey, refreshToken } = await getApiCredentials();
    console.log('Fetching access token with credentials:', { apiKey, refreshToken });

    if (!apiKey || !refreshToken) {
      console.error('API key or refresh token is missing');
      throw new Error('API key or refresh token not found');
    }

    try {
      console.log('Making API request to get_access_token');
      const response = await axios.get(`${API_BASE_URL}/v1/get_access_token`, {
        headers: {
          'x-api-key': apiKey,
          Authorization: `Bearer ${refreshToken}`,
        },
      });
      console.log('Get access token response:', response.data);

      const newAccessToken = response.data.message?.access_token;
      console.log('Extracted access token:', newAccessToken);

      if (!newAccessToken) {
        console.error('Access token is undefined in the response');
        throw new Error('Access token not found in response');
      }

      await AsyncStorage.setItem('atombergAccessToken', String(newAccessToken));
      await AsyncStorage.setItem('accessTokenTimestamp', Date.now().toString());
      console.log('Access token stored successfully:', newAccessToken);
      setAccessToken(newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error('Error fetching access token:', error.response?.data || error.message);
      ToastAndroid.show(
        'Failed to fetch access token: ' + (error.response?.data?.message || error.message),
        ToastAndroid.LONG
      );
      throw error;
    }
  };

  const getValidAccessToken = async () => {
    const storedAccessToken = await AsyncStorage.getItem('atombergAccessToken');
    const timestamp = await AsyncStorage.getItem('accessTokenTimestamp');
    console.log('Stored access token and timestamp:', { storedAccessToken, timestamp });

    const currentTime = Date.now();
    const tokenAge = timestamp ? (currentTime - parseInt(timestamp)) / 1000 : Infinity;
    console.log('Token age (seconds):', tokenAge);

    if (!storedAccessToken || tokenAge > 86400) {
      console.log('Access token is missing or expired, fetching new token');
      return await fetchAccessToken();
    }
    console.log('Using stored access token:', storedAccessToken);
    setAccessToken(storedAccessToken);
    return storedAccessToken;
  };

  const fetchDevices = async () => {
    try {
      console.log('Fetching devices');
      const token = await getValidAccessToken();
      const { apiKey } = await getApiCredentials();
      console.log('Using access token for device fetch:', token);
      const response = await axios.get(`${API_BASE_URL}/v1/get_list_of_devices`, {
        headers: {
          'x-api-key': apiKey,
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Get list of devices response:', response.data);
      const deviceList = response.data.message?.devices_list || [];
      console.log('Device list:', deviceList);
  
      setDevices(deviceList);
  
      const fanModels = ['renesa', 'aris', 'efficio', 'mist', 'studio'];
      const fanDevice = deviceList.find((device) =>
        fanModels.includes(device.model?.toLowerCase())
      );
  
      if (fanDevice) {
        console.log('Selected fan device:', fanDevice);
        setSelectedDeviceId(fanDevice.device_id);
      } else {
        console.log('No fan device found in the device list');
      }
      setRateLimitExceeded(false); // Reset rate limit flag if the request succeeds
    } catch (error) {
      console.error('Error fetching devices:', error.response?.data || error.message);
      ToastAndroid.show('Failed to fetch devices', ToastAndroid.SHORT);
      if (error.response?.data?.message === 'Limit Exceeded') {
        setRateLimitExceeded(true); // Set rate limit flag
      }
    }
  };

  const fetchFanState = async () => {
    if (!selectedDeviceId) {
      console.log('No selected device ID, skipping fetchFanState');
      return;
    }
    try {
      console.log('Fetching fan state for device ID:', selectedDeviceId);
      const token = await getValidAccessToken();
      const { apiKey } = await getApiCredentials();
      const response = await axios.get(`${API_BASE_URL}/v1/get_device_state`, {
        params: { device_id: selectedDeviceId },
        headers: {
          'x-api-key': apiKey,
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Get device state response:', response.data);
      const deviceState = response.data.message.device_state[0];
      console.log('Device state:', deviceState);
      setFanState(deviceState);
      setRateLimitExceeded(false);
    } catch (error) {
      console.error('Error fetching fan state:', error.response?.data || error.message);
      ToastAndroid.show('Failed to fetch fan state', ToastAndroid.SHORT);
      if (error.response?.data?.message === 'Limit Exceeded') {
        setRateLimitExceeded(true);
      }
    }
  };

  const sendCommand = async (command) => {
    if (!selectedDeviceId) {
      console.log('No selected device ID, cannot send command');
      ToastAndroid.show('No fan selected', ToastAndroid.SHORT);
      return;
    }
    try {
      console.log('Sending command:', command);
      const token = await getValidAccessToken();
      const { apiKey } = await getApiCredentials();
      const response = await axios.post(
        `${API_BASE_URL}/v1/send_command`,
        {
          device_id: selectedDeviceId,
          command,
        },
        {
          headers: {
            'x-api-key': apiKey,
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('Send command response:', response.data);
      ToastAndroid.show('Command sent successfully', ToastAndroid.SHORT);
      await fetchFanState();
    } catch (error) {
      console.error('Error sending command:', error.response?.data || error.message);
      ToastAndroid.show('Failed to send command: ' + (error.response?.data?.message || error.message), ToastAndroid.SHORT);
    }
  };

  useEffect(() => {
    console.log('FanControlScreen mounted, fetching devices');
    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedDeviceId) {
      console.log('Selected device ID changed, fetching fan state');
      fetchFanState();
    }
  }, [selectedDeviceId]);

  return (
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-left" size={width * 0.06} color="#EEE" />
            </TouchableOpacity>
            <Text style={styles.title}>Fan Control</Text>
            <TouchableOpacity onPress={fetchDevices} style={styles.refreshButton}>
              <Icon name="sync" size={width * 0.06} color="#EEE" />
            </TouchableOpacity>
          </View>
      
          {rateLimitExceeded ? (
            <View style={styles.errorContainer}>
              <Icon name="exclamation-triangle" size={width * 0.1} color="#ff4d4d" />
              <Text style={styles.errorText}>
                API Rate Limit Exceeded. Please wait until the limit resets (usually 24 hours) or contact Atomberg support.
              </Text>
            </View>
          ) : selectedDeviceId ? (
            fanState ? (
              <>
                {/* Status Card */}
                <Animatable.View animation="fadeInDown" style={styles.statusCard}>
                  <View style={styles.statusRow}>
                    <Icon
                      name="wifi"
                      size={width * 0.05}
                      color={fanState.is_online ? '#5dbe74' : '#ff4d4d'}
                      style={styles.statusIcon}
                    />
                    <Text style={styles.statusText}>
                      Fan is {fanState.is_online ? 'Online' : 'Offline'}
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
                </Animatable.View>
      
                {/* Speed Display */}
                <Animatable.View animation="zoomIn" style={styles.speedContainer}>
                  <LinearGradient
                    colors={['#5dbe74', '#3d8b4f']}
                    style={styles.speedCircle}
                  >
                    <Animatable.View
                      animation={fanState.power ? 'rotate' : null}
                      iterationCount="infinite"
                      duration={2000}
                      style={styles.fanIconContainer}
                    >
                      <Icon name="fan" size={width * 0.12} color="#fff" />
                    </Animatable.View>
                    <Text style={styles.speedText}>
                      {fanState.last_recorded_speed || 'N/A'}
                    </Text>
                    <Text style={styles.speedLabel}>Speed</Text>
                  </LinearGradient>
                </Animatable.View>
      
                {/* Additional Info */}
                <View style={styles.infoContainer}>
                  <View style={styles.infoRow}>
                    <Icon name="moon" size={width * 0.04} color="#fff" style={styles.infoIcon} />
                    <Text style={styles.infoText}>
                      Sleep Mode: {fanState.sleep_mode ? 'ON' : 'OFF'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Icon name="clock" size={width * 0.04} color="#fff" style={styles.infoIcon} />
                    <Text style={styles.infoText}>
                      Timer: {fanState.timer_hours || 0} hours
                    </Text>
                  </View>
                </View>
      
                {/* Control Buttons */}
                <View style={styles.controlContainer}>
                  {/* Power Button */}
                  <Animatable.View animation="bounceIn" style={styles.buttonWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.controlButton,
                        !fanState.is_online && styles.buttonDisabled,
                      ]}
                      onPress={() => sendCommand({ power: !fanState.power })}
                      disabled={!fanState.is_online}
                    >
                      <LinearGradient
                        colors={
                          fanState.is_online
                            ? fanState.power
                              ? ['#ff4d4d', '#cc3a3a']
                              : ['#5dbe74', '#3d8b4f']
                            : ['#888', '#666']
                        }
                        style={styles.buttonGradient}
                      >
                        <Icon
                          name="power-off"
                          size={width * 0.06}
                          color="#fff"
                        />
                      </LinearGradient>
                    </TouchableOpacity>
                    <Text style={styles.buttonLabel}>
                      {fanState.power ? 'Turn OFF' : 'Turn ON'}
                    </Text>
                  </Animatable.View>
      
                  {/* Speed Buttons */}
                  <Animatable.View animation="bounceIn" style={styles.buttonWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.controlButton,
                        (!fanState.is_online || !fanState.power || fanState.last_recorded_speed <= 1) && styles.buttonDisabled,
                      ]}
                      onPress={() => sendCommand({ speedDelta: -1 })}
                      disabled={!fanState.is_online || !fanState.power || fanState.last_recorded_speed <= 1}
                    >
                      <LinearGradient
                        colors={
                          fanState.is_online && fanState.power && fanState.last_recorded_speed > 1
                            ? ['#5dbe74', '#3d8b4f']
                            : ['#888', '#666']
                        }
                        style={styles.buttonGradient}
                      >
                        <Icon name="minus" size={width * 0.06} color="#fff" />
                      </LinearGradient>
                    </TouchableOpacity>
                    <Text style={styles.buttonLabel}>Speed -</Text>
                  </Animatable.View>
      
                  <Animatable.View animation="bounceIn" style={styles.buttonWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.controlButton,
                        (!fanState.is_online || !fanState.power || fanState.last_recorded_speed >= 6) && styles.buttonDisabled,
                      ]}
                      onPress={() => sendCommand({ speedDelta: 1 })}
                      disabled={!fanState.is_online || !fanState.power || fanState.last_recorded_speed >= 6}
                    >
                      <LinearGradient
                        colors={
                          fanState.is_online && fanState.power && fanState.last_recorded_speed < 6
                            ? ['#5dbe74', '#3d8b4f']
                            : ['#888', '#666']
                        }
                        style={styles.buttonGradient}
                      >
                        <Icon name="plus" size={width * 0.06} color="#fff" />
                      </LinearGradient>
                    </TouchableOpacity>
                    <Text style={styles.buttonLabel}>Speed +</Text>
                  </Animatable.View>
      
                  {/* Timer Buttons */}
                  <Animatable.View animation="bounceIn" style={styles.buttonWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.controlButton,
                        (!fanState.is_online || !fanState.power) && styles.buttonDisabled,
                      ]}
                      onPress={() => sendCommand({ timer: 0 })}
                      disabled={!fanState.is_online || !fanState.power}
                    >
                      <LinearGradient
                        colors={
                          fanState.is_online && fanState.power
                            ? ['#5dbe74', '#3d8b4f']
                            : ['#888', '#666']
                        }
                        style={styles.buttonGradient}
                      >
                        <Icon name="times" size={width * 0.06} color="#fff" />
                      </LinearGradient>
                    </TouchableOpacity>
                    <Text style={styles.buttonLabel}>Clear Timer</Text>
                  </Animatable.View>
      
                  <Animatable.View animation="bounceIn" style={styles.buttonWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.controlButton,
                        (!fanState.is_online || !fanState.power) && styles.buttonDisabled,
                      ]}
                      onPress={() => sendCommand({ timer: 1 })}
                      disabled={!fanState.is_online || !fanState.power}
                    >
                      <LinearGradient
                        colors={
                          fanState.is_online && fanState.power
                            ? ['#5dbe74', '#3d8b4f']
                            : ['#888', '#666']
                        }
                        style={styles.buttonGradient}
                      >
                        <Icon name="clock" size={width * 0.06} color="#fff" />
                      </LinearGradient>
                    </TouchableOpacity>
                    <Text style={styles.buttonLabel}>Set 1h Timer</Text>
                  </Animatable.View>
      
                  {/* Sleep Mode and Boost Mode */}
                  <Animatable.View animation="bounceIn" style={styles.buttonWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.controlButton,
                        (!fanState.is_online || !fanState.power) && styles.buttonDisabled,
                      ]}
                      onPress={() => sendCommand({ sleep: !fanState.sleep_mode })}
                      disabled={!fanState.is_online || !fanState.power}
                    >
                      <LinearGradient
                        colors={
                          fanState.is_online && fanState.power
                            ? fanState.sleep_mode
                              ? ['#ff4d4d', '#cc3a3a']
                              : ['#5dbe74', '#3d8b4f']
                            : ['#888', '#666']
                        }
                        style={styles.buttonGradient}
                      >
                        <Icon name="moon" size={width * 0.06} color="#fff" />
                      </LinearGradient>
                    </TouchableOpacity>
                    <Text style={styles.buttonLabel}>
                      Sleep Mode {fanState.sleep_mode ? 'OFF' : 'ON'}
                    </Text>
                  </Animatable.View>
      
                  <Animatable.View animation="bounceIn" style={styles.buttonWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.controlButton,
                        (!fanState.is_online || !fanState.power) && styles.buttonDisabled,
                      ]}
                      onPress={() => sendCommand({ speed: 6 })}
                      disabled={!fanState.is_online || !fanState.power}
                    >
                      <LinearGradient
                        colors={
                          fanState.is_online && fanState.power
                            ? ['#5dbe74', '#3d8b4f']
                            : ['#888', '#666']
                        }
                        style={styles.buttonGradient}
                      >
                        <Icon name="bolt" size={width * 0.06} color="#fff" />
                      </LinearGradient>
                    </TouchableOpacity>
                    <Text style={styles.buttonLabel}>Boost Mode</Text>
                  </Animatable.View>
                </View>
              </>
            ) : (
              <View style={styles.errorContainer}>
                <Icon name="exclamation-circle" size={width * 0.1} color="#ff4d4d" />
                <Text style={styles.errorText}>
                  Unable to fetch fan state. Tap the refresh button to try again.
                </Text>
              </View>
            )
          ) : (
            <View style={styles.errorContainer}>
              <Icon name="exclamation-circle" size={width * 0.1} color="#ff4d4d" />
              <Text style={styles.errorText}>
                Unable to fetch devices. Tap the refresh button to try again.
              </Text>
            </View>
          )}
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
  refreshButton: {
    position: 'absolute',
    right: 20,
  },
  title: {
    fontSize: width * 0.08,
    fontFamily: 'NeueMetana-Bold',
    color: '#EEE',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: width * 0.045,
    fontFamily: 'Gilroy-Medium',
    textAlign: 'center',
    marginTop: 10,
  },
  statusCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 15,
    marginVertical: 10,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
    fontFamily: 'Gilroy-Medium',
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
    shadowOffset: { width: 0, height: 0 },
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
    fontFamily: 'Gilroy-ExtraBold',
  },
  speedLabel: {
    color: '#fff',
    fontSize: width * 0.04,
    fontFamily: 'Gilroy-Medium',
    marginTop: 5,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    color: '#fff',
    fontSize: width * 0.04,
    fontFamily: 'Gilroy-Medium',
  },
  controlContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '90%',
    marginTop: 20,
  },
  buttonWrapper: {
    alignItems: 'center',
    marginVertical: 10,
    width: '33%',
  },
  controlButton: {
    width: width * 0.18,
    height: width * 0.18,
    borderRadius: width * 0.09,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.09,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: width * 0.035,
    fontFamily: 'Gilroy-Medium',
    marginTop: 5,
    textAlign: 'center',
  },
});
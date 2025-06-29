import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  FlatList,
  TextInput,
  Alert,
  ScrollView,
  Animated,
  Image,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import debounce from 'lodash/debounce';

const ControlScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const connectedDevices = useSelector(state => state.connectedDevices || []);
  const sockets = useSelector(state => state.sockets || []);
  const server = useSelector(state => state.server);
  const hasNavigated = useRef(false);
  const navigationTimeout = useRef(null);
  const ref = useRef(null);

  const [controller, setController] = useState('car');
  const [isDevicePanelVisible, setDevicePanelVisible] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [commandSelectedDevices, setCommandSelectedDevices] = useState([]);
  const [isCommandPanelVisible, setCommandPanelVisible] = useState(false);
  const [currentButton, setCurrentButton] = useState(null);
  const [customCommand, setCustomCommand] = useState('');
  const [customCommands, setCustomCommands] = useState({
    forward: 'forward',
    backward: 'backward',
    left: 'left',
    right: 'right',
    light: 'on',
    fan: 'fan_on',
    bot: 'fan_on',
  });
  const [isCustomControllerPanelVisible, setCustomControllerPanelVisible] = useState(false);
  const [customControllerName, setCustomControllerName] = useState('');
  const [customControllerIcon, setCustomControllerIcon] = useState({
    library: 'FontAwesome5',
    name: 'cog',
  });
  const [customControllerButtons, setCustomControllerButtons] = useState([]);
  const [customControllers, setCustomControllers] = useState([]);
  const [selectedIconLibrary, setSelectedIconLibrary] = useState('FontAwesome5');
  const [isLightOn, setIsLightOn] = useState(false);
  const [hasBackPressed, setHasBackPressed] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [isMessagesPanelVisible, setMessagesPanelVisible] = useState(false);
  const [isModesPanelVisible, setModesPanelVisible] = useState(false);

  const fadeAnimDevice = useRef(new Animated.Value(0)).current;
  const fadeAnimCommand = useRef(new Animated.Value(0)).current;
  const fadeAnimCustom = useRef(new Animated.Value(0)).current;
  const fadeAnimMessages = useRef(new Animated.Value(0)).current;
  const fadeAnimModes = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef({}).current;

  const fontAwesomeIcons = [
    'cog', 'rocket', 'bolt', 'plug', 'microchip', 'satellite', 'shield-alt', 'wrench', 'tools',
    'camera', 'heart', 'star', 'home', 'user', 'lock', 'unlock', 'bell', 'envelope', 'phone',
    'map', 'globe', 'car', 'plane', 'ship', 'bicycle', 'bus', 'truck', 'train', 'subway', 'taxi',
    'lightbulb', 'fan', 'robot', 'desktop', 'laptop', 'mobile-alt', 'tablet-alt', 'tv', 'gamepad',
    'keyboard', 'music', 'headphones', 'microphone', 'volume-up', 'volume-down', 'play', 'pause',
    'stop', 'forward', 'backward', 'sun', 'moon', 'cloud', 'umbrella', 'snowflake', 'fire', 'leaf', 'tree',
  ];

  const materialIcons = [
    'settings', 'bolt', 'memory', 'satellite', 'security', 'build', 'construction', 'camera-alt',
    'favorite', 'star', 'home', 'person', 'lock', 'lock-open', 'notifications', 'email', 'phone', 'map',
    'public', 'directions-car', 'airplanemode-active', 'directions-boat', 'directions-bike', 'directions-bus',
    'local-shipping', 'train', 'tram', 'local-taxi', 'lightbulb-outline', 'toys', 'android', 'computer',
    'laptop', 'smartphone', 'tablet', 'tv', 'videogame-asset', 'keyboard', 'music-note', 'headset', 'mic',
    'volume-up', 'volume-down', 'play-arrow', 'pause', 'stop', 'fast-forward', 'fast-rewind', 'wb-sunny',
    'nights-stay', 'cloud', 'umbrella', 'ac-unit', 'local-fire-department', 'local-florist', 'park',
  ];

  const availableIcons = selectedIconLibrary === 'FontAwesome5' ? fontAwesomeIcons : materialIcons;

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const storedControllers = await AsyncStorage.getItem('customControllers');
        if (isMounted && storedControllers) {
          setCustomControllers(JSON.parse(storedControllers));
        }
        const storedCommands = await AsyncStorage.getItem('customCommands');
        if (isMounted && storedCommands) {
          setCustomCommands(JSON.parse(storedCommands));
        }
      } catch (error) {
        console.error('Error loading data from AsyncStorage:', error);
        if (isMounted) {
          Alert.alert('Error', 'Failed to load saved data. Please try again.');
        }
      }
    };
    loadData();

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(timeInterval);
    };
  }, []);

  const saveData = useCallback(
    debounce(async () => {
      try {
        await AsyncStorage.setItem('customControllers', JSON.stringify(customControllers));
        await AsyncStorage.setItem('customCommands', JSON.stringify(customCommands));
        console.log('Data saved to AsyncStorage:', { customControllers, customCommands });
      } catch (error) {
        console.error('Error saving data to AsyncStorage:', error);
        Alert.alert('Error', 'Failed to save data. Changes may not persist.');
      }
    }, 1000),
    [customControllers, customCommands],
  );

  useEffect(() => {
    saveData();
    return () => saveData.cancel();
  }, [customControllers, customCommands, saveData]);

  useEffect(() => {
    console.log('ControlScreen loaded');
    console.log('Connected devices:', connectedDevices.length);
    console.log('Sockets:', sockets.length);
    console.log('Server:', server ? 'active' : 'null');

    setHasBackPressed(false);

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress();
      return true;
    });

    return () => {
      backHandler.remove();
      if (navigationTimeout.current) {
        clearTimeout(navigationTimeout.current);
      }
      console.log('ControlScreen unmounted, keeping server alive');
    };
  }, [handleBackPress]);

  useEffect(() => {
    if (hasNavigated.current || hasBackPressed) return;

    if (!server) {
      console.log('Server stopped unexpectedly, navigating to NewDevice');
      hasNavigated.current = true;
      if (navigationTimeout.current) clearTimeout(navigationTimeout.current);
      navigationTimeout.current = setTimeout(() => navigation.navigate('NewDevice'), 500);
      return;
    }

    if (connectedDevices.length === 0) {
      console.log('No devices connected, server still running, navigating to LoadingScreen');
      hasNavigated.current = true;
      if (navigationTimeout.current) clearTimeout(navigationTimeout.current);
      navigationTimeout.current = setTimeout(() => navigation.navigate('LoadingScreen', { fromControlScreen: true }), 500);
    }
  }, [connectedDevices, server, navigation, hasBackPressed]);

  useEffect(() => {
    const validConnectedDevices = connectedDevices.filter(
      device => device && typeof device.ip === 'string' && typeof device.port === 'number'
    );
    if (validConnectedDevices.length > 0 && commandSelectedDevices.length === 0) {
      setCommandSelectedDevices([validConnectedDevices[0]]);
      console.log('Default selected first device for commands:', validConnectedDevices[0]);
    }
  }, [connectedDevices, commandSelectedDevices]);

  const onPress = useCallback(() => {
    togglePanel(setModesPanelVisible, fadeAnimModes, !isModesPanelVisible);
  }, [isModesPanelVisible, togglePanel]);

  const togglePanel = useCallback((setVisible, fadeAnim, visible) => {
    // Close all other panels
    setDevicePanelVisible(false);
    setMessagesPanelVisible(false);
    setCommandPanelVisible(false);
    setCustomControllerPanelVisible(false);
    setModesPanelVisible(false);
    fadeAnimDevice.setValue(0);
    fadeAnimMessages.setValue(0);
    fadeAnimCommand.setValue(0);
    fadeAnimCustom.setValue(0);
    fadeAnimModes.setValue(0);
    // Open the requested panel
    setVisible(visible);
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, []);

  const renderMessageItem = useCallback(
    ({ item, index }) => (
      <View style={styles.messageItem}>
        {item.type === 'image' ? (
          <Image
            source={{ uri: item.content }}
            style={styles.messageImage}
            resizeMode="contain"
            onError={(e) => console.error('Image load error:', e)}
          />
        ) : (
          <Text style={styles.messageText}>{item.content}</Text>
        )}
        <Text style={styles.messageTimestamp}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
    ),
    [],
  );

  const clearMessages = useCallback((deviceIp, devicePort) => {
    dispatch({
      type: 'CLEAR_MESSAGES',
      payload: { ip: deviceIp, port: devicePort },
    });
  }, [dispatch]);

  const toggleDeviceSelection = useCallback(device => {
    setSelectedDevices(prev =>
      prev.some(d => d.ip === device.ip && d.port === device.port)
        ? prev.filter(d => !(d.ip === device.ip && d.port === device.port))
        : [...prev, device],
    );
  }, []);

  const toggleCommandDeviceSelection = useCallback(device => {
    setCommandSelectedDevices(prev =>
      prev.some(d => d.ip === device.ip && d.port === device.port)
        ? prev.filter(d => !(d.ip === device.ip && d.port === device.port))
        : [...prev, device],
    );
  }, []);

  const sendCommand = useCallback(
    debounce((command) => {
      if (sockets.length === 0) {
        console.error('No sockets available to send command');
        Alert.alert('Error', 'No devices connected to send command.');
        return;
      }
      if (commandSelectedDevices.length === 0) {
        console.error('No devices selected to send command');
        Alert.alert('Error', 'Please select at least one device to send command.');
        return;
      }
      const targetSockets = sockets.filter(socket =>
        commandSelectedDevices.some(
          device => device.ip === socket.remoteAddress && device.port === socket.remotePort
        )
      );
      if (targetSockets.length === 0) {
        console.error('No matching sockets for selected devices');
        Alert.alert('Error', 'Selected devices are not connected.');
        return;
      }
      targetSockets.forEach(socket => {
        try {
          socket.write(command, err => {
            if (err) {
              console.error(`Error sending command to ${socket.remoteAddress}:${socket.remotePort}:`, err);
              Alert.alert('Error', `Failed to send command to ${socket.remoteAddress}:${socket.remotePort}`);
              return;
            }
            console.log(`Sent command: ${command} to ${socket.remoteAddress}:${socket.remotePort}`);
          });
        } catch (error) {
          console.error(`Error in sendCommand to ${socket.remoteAddress}:${socket.remotePort}:`, error);
          Alert.alert('Error', `Unexpected error sending command to ${socket.remoteAddress}:${socket.remotePort}`);
        }
      });
    }, 300),
    [commandSelectedDevices, sockets],
  );

  const disconnectSelectedDevices = useCallback(() => {
    if (selectedDevices.length === 0) {
      console.log('No devices selected to disconnect');
      return;
    }

    console.log('Disconnecting selected devices:', selectedDevices);
    selectedDevices.forEach(device => {
      const socket = sockets.find(s => s.remoteAddress === device.ip && s.remotePort === device.port);
      if (socket) {
        try {
          socket.removeAllListeners();
          socket.destroy(() => {
            console.log(`Socket closed for ${device.ip}:${device.port}`);
          });
        } catch (error) {
          console.error(`Error closing socket for ${device.ip}:${device.port}:`, error);
        }
      } else {
        console.log(`Socket not found for ${device.ip}:${device.port}`);
      }
      dispatch({ type: 'REMOVE_CONNECTED_DEVICE', payload: { ip: device.ip, port: device.port } });
    });

    setSelectedDevices([]);
    const remainingDevices = connectedDevices.filter(
      d => !selectedDevices.some(sd => sd.ip === d.ip && d.port === d.port),
    );
    if (remainingDevices.length === 0) {
      console.log('No devices left, navigating to LoadingScreen');
      navigation.navigate('LoadingScreen', { fromControlScreen: true });
    }
    togglePanel(setDevicePanelVisible, fadeAnimDevice, false);
  }, [selectedDevices, sockets, dispatch, connectedDevices, navigation, togglePanel]);

  const renderDeviceItem = useCallback(
    ({ item }) => {
      const isSelectedForDisconnect = selectedDevices.some(d => d.ip === item.ip && d.port === item.port);
      const isSelectedForCommand = commandSelectedDevices.some(d => d.ip === item.ip && d.port === item.port);
      return (
        <View style={styles.deviceItem}>
          <TouchableOpacity
            style={styles.customCheckbox}
            onPress={() => toggleDeviceSelection(item)}
          >
            <Icon
              name={isSelectedForDisconnect ? 'check-square' : 'square'}
              size={20}
              color={isSelectedForDisconnect ? '#5dbe74' : '#fff'}
            />
          </TouchableOpacity>
          <Text style={styles.deviceText}>{`${item.ip}:${item.port}`}</Text>
          <TouchableOpacity
            style={styles.commandCheckbox}
            onPress={() => toggleCommandDeviceSelection(item)}
          >
            <MaterialIcon
              name={isSelectedForCommand ? 'circle' : 'panorama-fish-eye'}
              size={20}
              color={isSelectedForCommand ? '#0288d1' : '#fff'}
            />
          </TouchableOpacity>
        </View>
      );
    },
    [selectedDevices, commandSelectedDevices, toggleDeviceSelection, toggleCommandDeviceSelection],
  );

  const handleBackPress = useCallback(() => {
    if (connectedDevices.length > 0) {
      Alert.alert(
        'Warning',
        'Navigating back will disconnect all devices. Are you sure you want to proceed?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => console.log('User canceled navigation') },
          {
            text: 'Disconnect & Proceed',
            style: 'destructive',
            onPress: () => {
              console.log('Disconnecting all devices...');
              connectedDevices.forEach(device => {
                const socket = sockets.find(s => s.remoteAddress === device.ip && s.remotePort === device.port);
                if (socket) {
                  try {
                    socket.removeAllListeners();
                    socket.destroy(() => console.log(`Socket closed for ${device.ip}:${device.port}`));
                  } catch (error) {
                    console.error(`Error closing socket for ${device.ip}:${device.port}:`, error);
                  }
                }
                dispatch({ type: 'REMOVE_CONNECTED_DEVICE', payload: { ip: device.ip, port: device.port } });
              });
              setSelectedDevices([]);
              setHasBackPressed(true);
              navigation.navigate('LoadingScreen', { fromControlScreen: true });
            },
          },
        ],
        { cancelable: false },
      );
    } else {
      console.log('No devices connected, navigating to LoadingScreen');
      setHasBackPressed(true);
      navigation.navigate('LoadingScreen', { fromControlScreen: true });
    }
  }, [connectedDevices, sockets, dispatch, navigation]);

  const handleLightPress = useCallback(() => {
    if (isLightOn) {
      sendCommand(customCommands.light === 'on' ? 'off' : customCommands.light);
      setIsLightOn(false);
    } else {
      sendCommand(customCommands.light);
      setIsLightOn(true);
    }
  }, [isLightOn, customCommands.light, sendCommand]);

  const handleLongPress = useCallback(
    buttonKey => {
      setCurrentButton(buttonKey);
      setCustomCommand(customCommands[buttonKey] || '');
      togglePanel(setCommandPanelVisible, fadeAnimCommand, true);
    },
    [customCommands, togglePanel],
  );

  const animateButtonPress = (buttonKey, callback) => {
    if (!scaleAnims[buttonKey]) {
      scaleAnims[buttonKey] = new Animated.Value(1);
    }
    Animated.sequence([
      Animated.timing(scaleAnims[buttonKey], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[buttonKey], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => callback());
  };

  const saveCustomCommand = useCallback(() => {
    if (!customCommand.trim()) return Alert.alert('Error', 'Enter a valid command.');
    setCustomCommands(prev => ({ ...prev, [currentButton]: customCommand.trim() }));
    togglePanel(setCommandPanelVisible, fadeAnimCommand, false);
    setCustomCommand('');
    setCurrentButton(null);
  }, [customCommand, currentButton, togglePanel]);

  const addCustomControllerButton = useCallback(() => {
    setCustomControllerButtons(prev => [
      ...prev,
      { id: Date.now().toString(), icon: { library: 'FontAwesome5', name: 'cog' }, message: 'custom_action' },
    ]);
  }, []);

  const updateCustomControllerButton = useCallback((id, field, value) => {
    setCustomControllerButtons(prev =>
      prev.map(button => (button.id === id ? { ...button, [field]: value } : button)),
    );
  }, []);

  const removeCustomControllerButton = useCallback(id => {
    setCustomControllerButtons(prev => prev.filter(button => button.id !== id));
  }, []);

  const saveCustomController = useCallback(() => {
    if (!customControllerName.trim()) return Alert.alert('Error', 'Enter a controller name.');
    if (!customControllerButtons.length) return Alert.alert('Error', 'Add at least one button.');
    const newController = {
      key: `custom_${Date.now()}`,
      name: customControllerName.trim(),
      icon: customControllerIcon,
      buttons: customControllerButtons,
    };
    setCustomControllers(prev => [...prev, newController]);
    setCustomCommands(prev => {
      const updated = { ...prev };
      newController.buttons.forEach(button => {
        updated[`${newController.key}_${button.id}`] = button.message;
      });
      return updated;
    });
    setCustomControllerName('');
    setCustomControllerIcon({ library: 'FontAwesome5', name: 'cog' });
    setCustomControllerButtons([]);
    togglePanel(setCustomControllerPanelVisible, fadeAnimCustom, false);
  }, [customControllerName, customControllerIcon, customControllerButtons, togglePanel]);

  const deleteCustomController = useCallback(
    key => {
      Alert.alert('Delete Controller', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setCustomControllers(prev => prev.filter(c => c.key !== key));
            setCustomCommands(prev => {
              const updated = { ...prev };
              Object.keys(updated).forEach(cmdKey => {
                if (cmdKey.startsWith(`${key}_`)) delete updated[cmdKey];
              });
              return updated;
            });
            if (controller === key) setController('car');
          },
        },
      ]);
    },
    [controller],
  );

  const validateIconName = (library, name) => {
    const defaultIcon = library === 'FontAwesome5' ? 'cog' : 'settings';
    const isValid = library === 'FontAwesome5' ? fontAwesomeIcons.includes(name) : materialIcons.includes(name);
    return isValid ? name : defaultIcon;
  };

  const renderIcon = useCallback((library, name, size, color) => {
    const validatedName = validateIconName(library, name);
    return library === 'FontAwesome5' ? (
      <Icon name={validatedName} size={size} color={color} />
    ) : (
      <MaterialIcon name={validatedName} size={size} color={color} />
    );
  }, []);

  const CarController = React.memo(() => (
    <View style={styles.controlContainer}>
      <Text style={styles.headerText}>Car Control</Text>
      <Animated.View style={{ transform: [{ scale: scaleAnims['car_forward'] || 1 }] }}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => animateButtonPress('car_forward', () => sendCommand(customCommands.forward))}
          onLongPress={() => handleLongPress('forward')}
        >
          <Icon name="arrow-up" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
      <View style={styles.carButtonRow}>
        <Animated.View style={{ transform: [{ scale: scaleAnims['car_left'] || 1 }] }}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => animateButtonPress('car_left', () => sendCommand(customCommands.left))}
            onLongPress={() => handleLongPress('left')}
          >
            <Icon name="arrow-left" size={30} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={{ transform: [{ scale: scaleAnims['car_backward'] || 1 }] }}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => animateButtonPress('car_backward', () => sendCommand(customCommands.backward))}
            onLongPress={() => handleLongPress('backward')}
          >
            <Icon name="arrow-down" size={30} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={{ transform: [{ scale: scaleAnims['car_right'] || 1 }] }}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => animateButtonPress('car_right', () => sendCommand(customCommands.right))}
            onLongPress={() => handleLongPress('right')}
          >
            <Icon name="arrow-right" size={30} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  ));

  const LightController = React.memo(() => (
    <View style={styles.controlContainer}>
      <Text style={styles.headerText}>Light Control</Text>
      <Animated.View style={{ transform: [{ scale: scaleAnims['light'] || 1 }] }}>
        <TouchableOpacity
          onPress={() => animateButtonPress('light', handleLightPress)}
          onLongPress={() => handleLongPress('light')}
        >
          <View style={styles.lightContainer}>
            <Icon name="lightbulb" size={60} color={isLightOn ? '#FFD700' : '#EEE'} style={{ alignSelf: 'center' }} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  ));

  const FanController = React.memo(() => (
    <View style={styles.controlContainer}>
      <Text style={styles.headerText}>Fan Control</Text>
      <Animated.View style={{ transform: [{ scale: scaleAnims['fan'] || 1 }] }}>
        <TouchableOpacity
          style={styles.lightContainer}
          onPress={() => animateButtonPress('fan', () => sendCommand(customCommands.fan))}
          onLongPress={() => handleLongPress('fan')}
        >
          <Icon name="power-off" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  ));

  const BotController = React.memo(() => (
    <View style={styles.controlContainer}>
      <Text style={styles.headerText}>Bot Control</Text>
      <Animated.View style={{ transform: [{ scale: scaleAnims['bot'] || 1 }] }}>
        <TouchableOpacity
          style={styles.lightContainer}
          onPress={() => animateButtonPress('bot', () => sendCommand(customCommands.bot))}
          onLongPress={() => handleLongPress('bot')}
        >
          <Icon name="power-off" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  ));

  const CustomController = React.memo(({ customController }) => (
    <View style={styles.controlContainer}>
      <Text style={styles.headerText}>{customController.name}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
        {customController.buttons.map(button => {
          const buttonKey = `${customController.key}_${button.id}`;
          return (
            <Animated.View key={button.id} style={{ transform: [{ scale: scaleAnims[buttonKey] || 1 }] }}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => animateButtonPress(buttonKey, () => sendCommand(customCommands[buttonKey]))}
                onLongPress={() => handleLongPress(buttonKey)}
              >
                {renderIcon(button.icon.library, button.icon.name, 30, '#FFFFFF')}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  ));

  const renderController = useMemo(() => {
    const customController = customControllers.find(c => c.key === controller);
    if (customController) return <CustomController customController={customController} />;
    switch (controller) {
      case 'car': return <CarController />;
      case 'light': return <LightController />;
      case 'fan': return <FanController />;
      case 'bot': return <BotController />;
      default: return <CarController />;
    }
  }, [controller, customControllers, isLightOn, handleLightPress]);

  const modes = useMemo(() => {
    const modeItems = [
      { key: 'light', icon: 'lightbulb', label: 'Light' },
      { key: 'car', icon: 'car', label: 'Car' },
      { key: 'fan', icon: 'fan', label: 'Fan' },
      { key: 'bot', icon: 'robot', label: 'Bot' },
      ...customControllers.map(c => ({
        key: c.key,
        icon: c.icon.name,
        iconLibrary: c.icon.library,
        label: c.name,
        isCustom: true,
      })),
      { key: 'add', icon: 'plus-circle', label: 'Add', color: '#0288d1', onPress: () => togglePanel(setCustomControllerPanelVisible, fadeAnimCustom, true) },
    ];
    console.log('Modes array:', modeItems);
    return modeItems;
  }, [customControllers, togglePanel]);

  const renderContent = useMemo(
    () => (
      <View style={styles.bottomSheet}>
        <FlatList
          data={modes}
          numColumns={3}
          keyExtractor={item => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.bottomSheetMode}
              onPress={item.onPress || (() => setController(item.key))}
              onLongPress={item.isCustom ? () => deleteCustomController(item.key) : undefined}
            >
              {item.iconLibrary ? (
                renderIcon(item.iconLibrary, item.icon, 30, item.color || '#fff')
              ) : (
                <Icon name={item.icon} size={30} color={item.color || '#fff'} />
              )}
              <Text style={styles.bottomSheetModeText}>{item.label}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.bottomSheetModes}
        />
      </View>
    ),
    [modes, deleteCustomController, renderIcon],
  );

  const debouncedSetIcon = useCallback(
    debounce((id, icon) => updateCustomControllerButton(id, 'icon', icon), 300),
    [updateCustomControllerButton],
  );

  const debouncedSetControllerIcon = useCallback(debounce(icon => setCustomControllerIcon(icon), 300), []);

  const validConnectedDevices = useMemo(() =>
    connectedDevices.filter(device => device && typeof device.ip === 'string' && typeof device.port === 'number'),
    [connectedDevices]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.mainContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={() => togglePanel(setMessagesPanelVisible, fadeAnimMessages, true)}>
            <Icon name="envelope" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Control Hub</Text>
          <TouchableOpacity style={styles.headerRight} onPress={() => togglePanel(setDevicePanelVisible, fadeAnimDevice, true)}>
            <Text style={styles.deviceCount}>{validConnectedDevices.length} Device{validConnectedDevices.length !== 1 ? 's' : ''}</Text>
            <Text style={styles.currentTime}>{currentTime}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.controllerArea}>{renderController}</View>

        <TouchableOpacity
          style={styles.modeButton}
          onPress={onPress}
        >
          <Text style={styles.modeButtonText}>Control Modes</Text>
          <Icon name="chevron-up" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.panel, {
        opacity: fadeAnimDevice,
        transform: [{
          translateY: fadeAnimDevice.interpolate({
            inputRange: [0, 1],
            outputRange: [-50, 0],
          })
        }],
        pointerEvents: isDevicePanelVisible ? 'auto' : 'none',
      }]}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Devices</Text>
          <TouchableOpacity onPress={() => togglePanel(setDevicePanelVisible, fadeAnimDevice, false)}>
            <Icon name="times" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        {validConnectedDevices.length === 0 ? (
          <Text style={styles.noDevices}>No connected devices</Text>
        ) : (
          <>
            <FlatList
              data={validConnectedDevices}
              renderItem={renderDeviceItem}
              keyExtractor={(item, index) => `${item.ip}:${item.port}-${index}`}
              style={styles.deviceList}
              extraData={{ selectedDevices, commandSelectedDevices, validConnectedDevices }}
            />
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: selectedDevices.length === 0 ? '#555' : '#ff4444' }]}
              onPress={disconnectSelectedDevices}
              disabled={selectedDevices.length === 0}
            >
              <Text style={styles.actionButtonText}>Disconnect ({selectedDevices.length})</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>

      <Animated.View style={[styles.panel, {
        opacity: fadeAnimMessages,
        transform: [{
          translateY: fadeAnimMessages.interpolate({
            inputRange: [0, 1],
            outputRange: [-50, 0],
          })
        }],
        pointerEvents: isMessagesPanelVisible ? 'auto' : 'none',
      }]}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Messages</Text>
          <TouchableOpacity onPress={() => togglePanel(setMessagesPanelVisible, fadeAnimMessages, false)}>
            <Icon name="times" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        {validConnectedDevices.length === 0 ? (
          <Text style={styles.noMessages}>No messages received</Text>
        ) : (
          <FlatList
            data={validConnectedDevices}
            keyExtractor={(item, index) => `${item.ip}:${item.port}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.deviceMessages}>
                <View style={styles.deviceMessageHeaderContainer}>
                  <Text style={styles.deviceMessageHeader}>{`${item.ip}:${item.port}`}</Text>
                  {item.messages && item.messages.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearMessagesButton}
                      onPress={() => clearMessages(item.ip, item.port)}
                    >
                      <Text style={styles.clearMessagesText}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {item.messages && item.messages.length > 0 ? (
                  <FlatList
                    data={item.messages}
                    renderItem={renderMessageItem}
                    keyExtractor={(msg, index) => `${msg.content}-${msg.timestamp}-${index}`}
                    style={styles.messageList}
                    contentContainerStyle={styles.messageListContent}
                    nestedScrollEnabled={true}
                    onContentSizeChange={() => autoScroll && ref.current?.scrollToEnd({ animated: true })}
                    ref={ref}
                  />
                ) : (
                  <Text style={styles.noMessages}>No messages from this device</Text>
                )}
              </View>
            )}
            style={styles.deviceMessageList}
            contentContainerStyle={styles.deviceMessageListContent}
          />
        )}
      </Animated.View>

      <Animated.View style={[styles.panel, {
        opacity: fadeAnimCommand,
        transform: [{
          translateY: fadeAnimCommand.interpolate({
            inputRange: [0, 1],
            outputRange: [-50, 0],
          })
        }],
        pointerEvents: isCommandPanelVisible ? 'auto' : 'none',
      }]}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Custom Command</Text>
          <TouchableOpacity onPress={() => togglePanel(setCommandPanelVisible, fadeAnimCommand, false)}>
            <Icon name="times" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          value={customCommand}
          onChangeText={setCustomCommand}
          placeholder="Enter command"
          placeholderTextColor="#888"
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.panelButton} onPress={saveCustomCommand}>
            <Text style={styles.panelButtonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.panelButton, styles.cancelButton]}
            onPress={() => togglePanel(setCommandPanelVisible, fadeAnimCommand, false)}
          >
            <Text style={styles.panelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View style={[styles.panel, {
        opacity: fadeAnimCustom,
        transform: [{
          translateY: fadeAnimCustom.interpolate({
            inputRange: [0, 1],
            outputRange: [-50, 0],
          })
        }],
        pointerEvents: isCustomControllerPanelVisible ? 'auto' : 'none',
      }]}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>New Controller</Text>
          <TouchableOpacity onPress={() => togglePanel(setCustomControllerPanelVisible, fadeAnimCustom, false)}>
            <Icon name="times" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.panelScroll}>
          <TextInput
            style={styles.input}
            value={customControllerName}
            onChangeText={setCustomControllerName}
            placeholder="Controller Name"
            placeholderTextColor="#888"
          />
          <Text style={styles.sectionTitle}>Icon Library</Text>
          <View style={styles.librarySelector}>
            <TouchableOpacity
              style={[styles.libraryButton, selectedIconLibrary === 'FontAwesome5' && styles.libraryButtonActive]}
              onPress={() => setSelectedIconLibrary('FontAwesome5')}
            >
              <Text style={styles.libraryButtonText}>FontAwesome5</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.libraryButton, selectedIconLibrary === 'MaterialIcons' && styles.libraryButtonActive]}
              onPress={() => setSelectedIconLibrary('MaterialIcons')}
            >
              <Text style={styles.libraryButtonText}>MaterialIcons</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionTitle}>Controller Icon</Text>
          <FlatList
            horizontal
            data={availableIcons}
            keyExtractor={item => item}
            renderItem={({ item: icon }) => (
              <TouchableOpacity
                style={[styles.iconButton, customControllerIcon.name === icon && customControllerIcon.library === selectedIconLibrary && styles.iconButtonActive]}
                onPress={() => debouncedSetControllerIcon({ library: selectedIconLibrary, name: icon })}
              >
                {renderIcon(selectedIconLibrary, icon, 21, '#fff')}
              </TouchableOpacity>
            )}
          />
          <Text style={styles.sectionTitle}>Buttons</Text>
          {customControllerButtons.map(item => (
            <View key={item.id} style={styles.buttonConfig}>
              <FlatList
                horizontal
                data={availableIcons}
                keyExtractor={icon => icon}
                renderItem={({ item: icon }) => (
                  <TouchableOpacity
                    style={[styles.iconButton, item.icon.name === icon && item.icon.library === selectedIconLibrary && styles.iconButtonActive]}
                    onPress={() => debouncedSetIcon(item.id, { library: selectedIconLibrary, name: icon })}
                  >
                    {renderIcon(selectedIconLibrary, icon, 20, '#fff')}
                  </TouchableOpacity>
                )}
              />
              <TextInput
                style={styles.input}
                value={item.message}
                onChangeText={text => updateCustomControllerButton(item.id, 'message', text)}
                placeholder="Command"
                placeholderTextColor="#888"
              />
              <TouchableOpacity style={styles.deleteButton} onPress={() => removeCustomControllerButton(item.id)}>
                <Icon name="trash" size={20} color="#ff4444" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addButton} onPress={addCustomControllerButton}>
            <Text style={styles.addButtonText}>Add Button</Text>
          </TouchableOpacity>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.panelButton} onPress={saveCustomController}>
              <Text style={styles.panelButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.panelButton, styles.cancelButton]}
              onPress={() => togglePanel(setCustomControllerPanelVisible, fadeAnimCustom, false)}
            >
              <Text style={styles.panelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>

      <Animated.View style={[styles.panel, {
        opacity: fadeAnimModes,
        transform: [{
          translateY: fadeAnimModes.interpolate({
            inputRange: [0, 1],
            outputRange: [-50, 0],
          })
        }],
        pointerEvents: isModesPanelVisible ? 'auto' : 'none',
      }]}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Control Modes</Text>
          <TouchableOpacity onPress={() => togglePanel(setModesPanelVisible, fadeAnimModes, false)}>
            <Icon name="times" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        {renderContent}
      </Animated.View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  mainContainer: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  menuButton: { padding: 10 },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  deviceCount: {
    fontSize: 14,
    color: '#bbb',
    fontWeight: '500',
  },
  currentTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  controllerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#181818',
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5dbe74',
    padding: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modeButtonText: {
    color: '#000',
    fontSize: 18,
    marginRight: 10,
    fontWeight: '600',
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetModes: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  bottomSheetMode: {
    alignItems: 'center',
    margin: 8,
    width: 100,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#252525',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  bottomSheetModeText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  noModes: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  controlContainer: {
    backgroundColor: '#252525',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  headerText: {
    color: '#fff',
    fontSize: 22,
    marginBottom: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  button: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 12,
    margin: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  carButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  lightContainer: {
    backgroundColor: '#333',
    padding: 25,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1e1e1e',
    paddingTop: 10,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  panelTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
  },
  noDevices: {
    color: '#fff',
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
  },
  deviceList: {
    flex: 1,
    padding: 10,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#252525',
    borderRadius: 10,
    marginVertical: 5,
  },
  deviceText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
    fontWeight: '500',
  },
  customCheckbox: {
    padding: 5,
  },
  commandCheckbox: {
    padding: 5,
  },
  actionButton: {
    padding: 15,
    alignItems: 'center',
    margin: 10,
    borderRadius: 10,
    elevation: 2,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 12,
    borderRadius: 10,
    margin: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  panelButton: {
    backgroundColor: '#0288d1',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#d32f2f',
  },
  panelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  panelScroll: {
    flex: 1,
    padding: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    margin: 10,
    fontWeight: '600',
  },
  librarySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  libraryButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#333',
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  libraryButtonActive: {
    backgroundColor: '#0288d1',
  },
  libraryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  iconButton: {
    padding: 10,
    margin: 5,
    backgroundColor: '#333',
    borderRadius: 10,
  },
  iconButtonActive: {
    backgroundColor: '#0288d1',
  },
  buttonConfig: {
    marginVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 10,
  },
  deleteButton: {
    padding: 10,
    alignSelf: 'flex-end',
  },
  addButton: {
    backgroundColor: '#0288d1',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    margin: 10,
    elevation: 2,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  messageArea: {
    flex: 1,
    padding: 15,
    backgroundColor: '#181818',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  messageHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  messageHeader: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  autoScrollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#252525',
    borderRadius: 8,
  },
  autoScrollText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 5,
    fontWeight: '500',
  },
  noMessages: {
    color: '#bbb',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    fontWeight: '500',
  },
  deviceMessages: {
    marginBottom: 15,
    backgroundColor: '#252525',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 10,
  },
  deviceMessageHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  deviceMessageHeader: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearMessagesButton: {
    padding: 8,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  clearMessagesText: {
    color: '#ff4444',
    fontSize: 12,
    fontWeight: '500',
  },
  messageList: {
    flexGrow: 1,
    marginBottom: 5,
  },
  messageListContent: {
    paddingBottom: 10,
    flexGrow: 1,
  },
  messageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    alignItems: 'center',
    minHeight: 140,
  },
  messageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
  },
  messageTimestamp: {
    color: '#888',
    fontSize: 12,
    fontWeight: '400',
  },
  deviceMessageList: {
    flex: 1,
  },
  deviceMessageListContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  messageImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 10,
  },
});

export default ControlScreen;
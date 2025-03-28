import React, {useState, useEffect, useCallback, useRef, useMemo} from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import {useSelector, useDispatch} from 'react-redux';
import BottomSheet from '../components/BottomSheet';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import Modal from 'react-native-modal';
import CheckBox from '@react-native-community/checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';
import debounce from 'lodash/debounce';

const ControlScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const connectedDevices = useSelector(state => state.connectedDevices || []);
  const sockets = useSelector(state => state.sockets || []);
  const server = useSelector(state => state.server);
  const hasNavigated = useRef(false);
  const navigationTimeout = useRef(null);
  const ref = useRef(null);

  const [controller, setController] = useState('car');
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [isCommandModalVisible, setCommandModalVisible] = useState(false);
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
  const [isCustomControllerModalVisible, setCustomControllerModalVisible] =
    useState(false);
  const [customControllerName, setCustomControllerName] = useState('');
  const [customControllerIcon, setCustomControllerIcon] = useState({
    library: 'FontAwesome5',
    name: 'cog',
  });
  const [customControllerButtons, setCustomControllerButtons] = useState([]);
  const [customControllers, setCustomControllers] = useState([]);
  const [selectedIconLibrary, setSelectedIconLibrary] =
    useState('FontAwesome5');
  const [isLightOn, setIsLightOn] = useState(false);
  const [hasBackPressed, setHasBackPressed] = useState(false);

  const fontAwesomeIcons = [
    'cog',
    'rocket',
    'bolt',
    'plug',
    'microchip',
    'satellite',
    'shield-alt',
    'wrench',
    'tools',
    'camera',
    'heart',
    'star',
    'home',
    'user',
    'lock',
    'unlock',
    'bell',
    'envelope',
    'phone',
    'map',
    'globe',
    'car',
    'plane',
    'ship',
    'bicycle',
    'bus',
    'truck',
    'train',
    'subway',
    'taxi',
    'lightbulb',
    'fan',
    'robot',
    'desktop',
    'laptop',
    'mobile-alt',
    'tablet-alt',
    'tv',
    'gamepad',
    'keyboard',
    'music',
    'headphones',
    'microphone',
    'volume-up',
    'volume-down',
    'play',
    'pause',
    'stop',
    'forward',
    'backward',
    'sun',
    'moon',
    'cloud',
    'umbrella',
    'snowflake',
    'fire',
    'leaf',
    'tree',
  ];

  const materialIcons = [
    'settings',
    'bolt',
    'power',
    'memory',
    'satellite',
    'security',
    'build',
    'construction',
    'camera-alt',
    'favorite',
    'star',
    'home',
    'person',
    'lock',
    'lock-open',
    'notifications',
    'email',
    'phone',
    'map',
    'public',
    'directions-car',
    'airplanemode-active',
    'directions-boat',
    'directions-bike',
    'directions-bus',
    'local-shipping',
    'train',
    'tram',
    'local-taxi',
    'lightbulb-outline',
    'toys',
    'android',
    'computer',
    'laptop',
    'smartphone',
    'tablet',
    'tv',
    'videogame-asset',
    'keyboard',
    'music-note',
    'headset',
    'mic',
    'volume-up',
    'volume-down',
    'play-arrow',
    'pause',
    'stop',
    'fast-forward',
    'fast-rewind',
    'wb-sunny',
    'nights-stay',
    'cloud',
    'umbrella',
    'ac-unit',
    'local-fire-department',
    'local-florist',
    'park',
  ];

  const availableIcons =
    selectedIconLibrary === 'FontAwesome5' ? fontAwesomeIcons : materialIcons;

  // Load data from AsyncStorage
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const storedControllers = await AsyncStorage.getItem(
          'customControllers',
        );
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

    return () => {
      isMounted = false;
    };
  }, []);

  // Debounced save to AsyncStorage
  const saveData = useCallback(
    debounce(async () => {
      try {
        await AsyncStorage.setItem(
          'customControllers',
          JSON.stringify(customControllers),
        );
        await AsyncStorage.setItem(
          'customCommands',
          JSON.stringify(customCommands),
        );
        console.log('Data saved to AsyncStorage:', {
          customControllers,
          customCommands,
        });
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

  // Navigation and back handler
  useEffect(() => {
    console.log('ControlScreen loaded');
    console.log('Connected devices:', connectedDevices.length);
    console.log('Sockets:', sockets.length);
    console.log('Server:', server ? 'active' : 'null');

    // Reset hasBackPressed on mount
    setHasBackPressed(false);

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleBackPress();
        return true;
      },
    );

    return () => {
      backHandler.remove();
      if (navigationTimeout.current) {
        clearTimeout(navigationTimeout.current);
      }
      console.log('ControlScreen unmounted, keeping server alive');
    };
  }, [handleBackPress]);

  useEffect(() => {
    if (hasNavigated.current || hasBackPressed) {
      return;
    }

    if (!server) {
      console.log('Server stopped unexpectedly, navigating to NewDevice');
      hasNavigated.current = true;
      if (navigationTimeout.current) {
        clearTimeout(navigationTimeout.current);
      }
      navigationTimeout.current = setTimeout(() => {
        navigation.navigate('NewDevice');
      }, 500);
      return;
    }

    if (connectedDevices.length === 0) {
      console.log(
        'No devices connected, server still running, navigating to LoadingScreen',
      );
      hasNavigated.current = true;
      if (navigationTimeout.current) {
        clearTimeout(navigationTimeout.current);
      }
      navigationTimeout.current = setTimeout(() => {
        navigation.navigate('LoadingScreen', {fromControlScreen: true});
      }, 500);
    }
  }, [connectedDevices, server, navigation, hasBackPressed]);

  // Event Handlers
  const onPress = useCallback(() => {
    const isActive = ref.current?.isActive();
    if (isActive) {
      ref.current?.scrollTo(0);
    } else {
      ref.current?.scrollTo(-200);
    }
  }, []);

  const sendCommand = useCallback(
    debounce((command, sockets) => {
      if (sockets.length === 0) {
        console.error('No sockets available to send command');
        return;
      }
      const socket = sockets[0];
      try {
        socket.write(command, err => {
          if (err) {
            console.error('Error sending command:', err);
            return;
          }
          console.log(
            `Sent message: ${command} to ${socket.remoteAddress}:${socket.remotePort}`,
          );
        });
      } catch (error) {
        console.error('Error in sendCommand:', error);
      }
    }, 300),
    [],
  );

  const toggleDeviceSelection = useCallback(device => {
    setSelectedDevices(prev =>
      prev.some(d => d.ip === device.ip && d.port === device.port)
        ? prev.filter(d => !(d.ip === device.ip && d.port === device.port))
        : [...prev, device],
    );
  }, []);

  const disconnectSelectedDevices = useCallback(() => {
    if (selectedDevices.length === 0) {
      console.log('No devices selected to disconnect');
      return;
    }

    console.log('Disconnecting selected devices:', selectedDevices);
    selectedDevices.forEach(device => {
      const socket = sockets.find(
        s => s.remoteAddress === device.ip && s.remotePort === device.port,
      );

      if (socket) {
        try {
          socket.removeAllListeners();
          socket.destroy(() => {
            console.log(`Socket closed for ${device.ip}:${device.port}`);
          });
        } catch (error) {
          console.error(
            `Error closing socket for ${device.ip}:${device.port}:`,
            error,
          );
        }
      } else {
        console.log(`Socket not found for ${device.ip}:${device.port}`);
      }

      dispatch({
        type: 'REMOVE_CONNECTED_DEVICE',
        payload: {ip: device.ip, port: device.port},
      });
    });

    setSelectedDevices([]);

    const remainingDevices = connectedDevices.filter(
      d => !selectedDevices.some(sd => sd.ip === d.ip && sd.port === d.port),
    );
    if (remainingDevices.length === 0) {
      console.log('No devices left, navigating to LoadingScreen');
      navigation.navigate('LoadingScreen', {fromControlScreen: true});
    }

    setModalVisible(false);
  }, [selectedDevices, sockets, dispatch, connectedDevices, navigation]);

  const renderDeviceItem = useCallback(
    ({item}) => {
      const isSelected = selectedDevices.some(
        d => d.ip === item.ip && d.port === item.port,
      );
      return (
        <View style={styles.deviceItem}>
          <CheckBox
            value={isSelected}
            onValueChange={() => toggleDeviceSelection(item)}
            tintColors={{true: '#5dbe74', false: '#fff'}}
          />
          <Text style={styles.deviceText}>{`${item.ip}:${item.port}`}</Text>
        </View>
      );
    },
    [selectedDevices, toggleDeviceSelection],
  );

  const handleBackPress = useCallback(() => {
    if (connectedDevices.length > 0) {
      // Show warning alert
      Alert.alert(
        'Warning',
        'Navigating back will disconnect all devices. Are you sure you want to proceed?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              console.log('User canceled navigation, staying on ControlScreen');
            },
          },
          {
            text: 'Disconnect & Proceed',
            style: 'destructive',
            onPress: () => {
              console.log(
                'User confirmed, disconnecting all devices before navigating...',
              );
              // Disconnect all devices
              connectedDevices.forEach(device => {
                const socket = sockets.find(
                  s =>
                    s.remoteAddress === device.ip &&
                    s.remotePort === device.port,
                );

                if (socket) {
                  try {
                    socket.removeAllListeners();
                    socket.destroy(() => {
                      console.log(
                        `Socket closed for ${device.ip}:${device.port}`,
                      );
                    });
                  } catch (error) {
                    console.error(
                      `Error closing socket for ${device.ip}:${device.port}:`,
                      error,
                    );
                  }
                } else {
                  console.log(
                    `Socket not found for ${device.ip}:${device.port}`,
                  );
                }

                dispatch({
                  type: 'REMOVE_CONNECTED_DEVICE',
                  payload: {ip: device.ip, port: device.port},
                });
              });

              // Clear selected devices (if any)
              setSelectedDevices([]);

              // Set the flag to prevent double navigation
              setHasBackPressed(true);

              // Navigate to LoadingScreen after disconnecting all devices
              console.log(
                'All devices disconnected, navigating to LoadingScreen',
              );
              navigation.navigate('LoadingScreen', {fromControlScreen: true});
            },
          },
        ],
        {cancelable: false},
      );
    } else {
      // If no devices are connected, navigate immediately without warning
      console.log('No devices connected, navigating to LoadingScreen');
      setHasBackPressed(true);
      navigation.navigate('LoadingScreen', {fromControlScreen: true});
    }
  }, [connectedDevices, sockets, dispatch, navigation, setSelectedDevices]);

  const handleLightPress = useCallback(() => {
    if (isLightOn) {
      sendCommand(
        customCommands.light === 'on' ? 'off' : customCommands.light,
        sockets,
      );
      setIsLightOn(false);
    } else {
      sendCommand(customCommands.light, sockets);
      setIsLightOn(true);
    }
  }, [isLightOn, customCommands.light, sockets]);

  const handleLongPress = useCallback(
    buttonKey => {
      setCurrentButton(buttonKey);
      setCustomCommand(customCommands[buttonKey] || '');
      setCommandModalVisible(true);
    },
    [customCommands],
  );

  const saveCustomCommand = useCallback(() => {
    if (!customCommand.trim()) {
      Alert.alert('Error', 'Please enter a valid command.');
      return;
    }
    setCustomCommands(prev => ({
      ...prev,
      [currentButton]: customCommand.trim(),
    }));
    setCommandModalVisible(false);
    setCustomCommand('');
    setCurrentButton(null);
  }, [customCommand, currentButton]);

  const addCustomControllerButton = useCallback(() => {
    setCustomControllerButtons(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        icon: {library: 'FontAwesome5', name: 'cog'},
        message: 'custom_action',
      },
    ]);
  }, []);

  const updateCustomControllerButton = useCallback((id, field, value) => {
    setCustomControllerButtons(prev =>
      prev.map(button =>
        button.id === id ? {...button, [field]: value} : button,
      ),
    );
  }, []);

  const removeCustomControllerButton = useCallback(id => {
    setCustomControllerButtons(prev => prev.filter(button => button.id !== id));
  }, []);

  const saveCustomController = useCallback(() => {
    if (!customControllerName.trim()) {
      Alert.alert('Error', 'Please enter a name for the controller.');
      return;
    }
    if (customControllerButtons.length === 0) {
      Alert.alert('Error', 'Please add at least one button to the controller.');
      return;
    }

    const newController = {
      key: `custom_${Date.now()}`,
      name: customControllerName.trim(),
      icon: customControllerIcon,
      buttons: customControllerButtons,
    };

    setCustomControllers(prev => [...prev, newController]);
    setCustomCommands(prev => {
      const updatedCommands = {...prev};
      newController.buttons.forEach(button => {
        updatedCommands[`${newController.key}_${button.id}`] = button.message;
      });
      return updatedCommands;
    });

    setCustomControllerName('');
    setCustomControllerIcon({library: 'FontAwesome5', name: 'cog'});
    setCustomControllerButtons([]);
    setCustomControllerModalVisible(false);
  }, [customControllerName, customControllerIcon, customControllerButtons]);

  const deleteCustomController = useCallback(
    key => {
      Alert.alert(
        'Delete Controller',
        'Are you sure you want to delete this custom controller?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              setCustomControllers(prev => prev.filter(c => c.key !== key));
              setCustomCommands(prev => {
                const updatedCommands = {...prev};
                Object.keys(updatedCommands).forEach(cmdKey => {
                  if (cmdKey.startsWith(`${key}_`)) {
                    delete updatedCommands[cmdKey];
                  }
                });
                return updatedCommands;
              });
              if (controller === key) {
                setController('car');
              }
            },
          },
        ],
      );
    },
    [controller],
  );

  const validateIconName = (library, name) => {
    const defaultIcon = library === 'FontAwesome5' ? 'cog' : 'settings';
    const isValidIcon =
      library === 'FontAwesome5'
        ? fontAwesomeIcons.includes(name)
        : materialIcons.includes(name);
    if (!isValidIcon) {
      console.warn(
        `Invalid icon name "${name}" for library "${library}". Using default icon "${defaultIcon}".`,
      );
      return defaultIcon;
    }
    return name;
  };

  const renderIcon = useCallback((library, name, size, color) => {
    const validatedName = validateIconName(library, name);

    try {
      return library === 'FontAwesome5' ? (
        <Icon name={validatedName} size={size} color={color} />
      ) : (
        <MaterialIcon name={validatedName} size={size} color={color} />
      );
    } catch (error) {
      console.error(
        `Error rendering icon "${name}" for library "${library}":`,
        error,
      );
      const defaultIcon = library === 'FontAwesome5' ? 'cog' : 'settings';
      return library === 'FontAwesome5' ? (
        <Icon name={defaultIcon} size={size} color={color} />
      ) : (
        <MaterialIcon name={defaultIcon} size={size} color={color} />
      );
    }
  }, []);

  // Memoized Controller Components
  const CarController = React.memo(() => (
    <View style={styles.controlContainer}>
      <Text style={styles.headerText}>Car Control</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => sendCommand(customCommands.forward, sockets)}
        onLongPress={() => handleLongPress('forward')}>
        <Icon name="arrow-up" size={30} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={styles.carButtonRow}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => sendCommand(customCommands.left, sockets)}
          onLongPress={() => handleLongPress('left')}>
          <Icon name="arrow-left" size={30} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => sendCommand(customCommands.backward, sockets)}
          onLongPress={() => handleLongPress('backward')}>
          <Icon name="arrow-down" size={30} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => sendCommand(customCommands.right, sockets)}
          onLongPress={() => handleLongPress('right')}>
          <Icon name="arrow-right" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  ));

  const LightController = React.memo(({isLightOn, handleLightPress}) => (
    <View style={styles.controlContainer}>
      <Text style={styles.headerText}>Light Control</Text>
      <TouchableOpacity
        onPress={handleLightPress}
        onLongPress={() => handleLongPress('light')}>
        <View style={styles.lightContainer}>
          <Icon
            name="lightbulb"
            size={60}
            color={isLightOn ? '#FFD700' : '#EEE'}
            style={{alignSelf: 'center'}}
          />
        </View>
      </TouchableOpacity>
    </View>
  ));

  const FanController = React.memo(() => (
    <View style={styles.controlContainer}>
      <Text style={styles.headerText}>Fan Control</Text>
      <TouchableOpacity
        style={styles.lightContainer}
        onPress={() => sendCommand(customCommands.fan, sockets)}
        onLongPress={() => handleLongPress('fan')}>
        <Icon name="power-off" size={30} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  ));

  const BotController = React.memo(() => (
    <View style={styles.controlContainer}>
      <Text style={styles.headerText}>Bot Control</Text>
      <TouchableOpacity
        style={styles.lightContainer}
        onPress={() => sendCommand(customCommands.bot, sockets)}
        onLongPress={() => handleLongPress('bot')}>
        <Icon name="power-off" size={30} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  ));

  const CustomController = React.memo(({customController}) => (
    <View style={styles.controlContainer}>
      <Text style={styles.headerText}>{customController.name}</Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
        {customController.buttons.map(button => {
          const buttonKey = `${customController.key}_${button.id}`;
          return (
            <TouchableOpacity
              key={button.id}
              style={styles.button}
              onPress={() => sendCommand(customCommands[buttonKey], sockets)}
              onLongPress={() => handleLongPress(buttonKey)}>
              {renderIcon(button.icon.library, button.icon.name, 30, '#FFFFFF')}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  ));

  const renderController = useMemo(() => {
    const customController = customControllers.find(c => c.key === controller);
    if (customController) {
      return <CustomController customController={customController} />;
    }
    switch (controller) {
      case 'car':
        return <CarController />;
      case 'light':
        return (
          <LightController
            isLightOn={isLightOn}
            handleLightPress={handleLightPress}
          />
        );
      case 'fan':
        return <FanController />;
      case 'bot':
        return <BotController />;
      default:
        return <CarController />;
    }
  }, [controller, customControllers, isLightOn, handleLightPress]);

  const modes = useMemo(
    () => [
      {key: 'light', icon: 'lightbulb', label: 'Light'},
      {key: 'car', icon: 'car', label: 'Car'},
      {key: 'fan', icon: 'fan', label: 'Fan'},
      {key: 'bot', icon: 'robot', label: 'Bot'},
      ...customControllers.map(c => ({
        key: c.key,
        icon: c.icon.name,
        iconLibrary: c.icon.library,
        label: c.name,
        isCustom: true,
      })),
      {
        key: 'add',
        icon: 'plus-circle',
        label: 'Add',
        color: '#5dbe74',
        onPress: () => setCustomControllerModalVisible(true),
      },
    ],
    [customControllers, setCustomControllerModalVisible],
  );

  const renderContent = useMemo(
    () => (
      <View style={styles.bottomSheet}>
        <FlatList
          data={modes}
          numColumns={3}
          keyExtractor={item => item.key}
          key={modes.length}
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.bottomSheetMode}
              onPress={item.onPress || (() => setController(item.key))}
              onLongPress={
                item.isCustom
                  ? () => deleteCustomController(item.key)
                  : undefined
              }>
              {item.iconLibrary ? (
                renderIcon(
                  item.iconLibrary,
                  item.icon,
                  30,
                  item.color || '#fff',
                )
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
    [modes, setController, deleteCustomController, renderIcon],
  );

  const debouncedSetIcon = useCallback(
    debounce((id, icon) => {
      updateCustomControllerButton(id, 'icon', icon);
    }, 300),
    [updateCustomControllerButton],
  );

  const debouncedSetControllerIcon = useCallback(
    debounce(icon => {
      setCustomControllerIcon(icon);
    }, 300),
    [],
  );

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => setModalVisible(true)}>
              <Icon name="arrow-circle-right" size={22} color="#f0f0f0" />
            </TouchableOpacity>
            <Text style={styles.title}>ESP Wizard</Text>
          </View>
          <Text style={styles.deviceCounter}>
            Connected Devices: {connectedDevices.length}
          </Text>
        </View>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          {renderController}
        </View>
        <TouchableOpacity style={styles.fab} onPress={onPress}>
          <Text style={styles.fabText}>Modes</Text>
        </TouchableOpacity>
        <BottomSheet ref={ref}>
          <View style={{flex: 1, backgroundColor: '#2a2a2a'}}>
            {renderContent}
          </View>
        </BottomSheet>

        {/* Modal for Device List */}
        <Modal
          isVisible={isModalVisible}
          onBackdropPress={() => setModalVisible(false)}
          style={styles.modal}
          animationIn="slideInLeft"
          animationOut="slideOutLeft">
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Connected Devices</Text>
            {connectedDevices.length === 0 ? (
              <Text style={styles.noDevicesText}>No devices connected</Text>
            ) : (
              <>
                <FlatList
                  data={connectedDevices}
                  renderItem={renderDeviceItem}
                  keyExtractor={item => `${item.ip}:${item.port}`}
                  style={styles.deviceList}
                />
                <TouchableOpacity
                  style={[
                    styles.modalDisconnectButton,
                    {
                      backgroundColor:
                        selectedDevices.length === 0 ? '#888' : '#ff4444',
                    },
                  ]}
                  onPress={disconnectSelectedDevices}
                  disabled={selectedDevices.length === 0}>
                  <Text style={styles.modalDisconnectButtonText}>
                    Disconnect Selected ({selectedDevices.length})
                  </Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* Modal for Custom Command */}
        <Modal
          isVisible={isCommandModalVisible}
          onBackdropPress={() => setCommandModalVisible(false)}
          style={styles.commandModal}>
          <View style={styles.commandModalContent}>
            <Text style={styles.modalTitle}>Set Custom Command</Text>
            <TextInput
              style={styles.commandInput}
              value={customCommand}
              onChangeText={setCustomCommand}
              placeholder="Enter command (e.g., forward)"
              placeholderTextColor="#888"
            />
            <View style={styles.commandModalButtons}>
              <TouchableOpacity
                style={[styles.commandModalButton, styles.saveButton]}
                onPress={saveCustomCommand}>
                <Text style={styles.commandModalButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.commandModalButton, styles.cancelButton]}
                onPress={() => setCommandModalVisible(false)}>
                <Text style={styles.commandModalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal for Custom Controller */}
        <Modal
          isVisible={isCustomControllerModalVisible}
          onBackdropPress={() => setCustomControllerModalVisible(false)}
          style={styles.customControllerModal}>
          <View style={styles.customControllerModalContent}>
            <ScrollView contentContainerStyle={{paddingBottom: 20}}>
              <Text style={styles.modalTitle}>Create Custom Controller</Text>
              <TextInput
                style={styles.commandInput}
                value={customControllerName}
                onChangeText={setCustomControllerName}
                placeholder="Controller Name (e.g., Custom Device)"
                placeholderTextColor="#888"
              />
              <Text style={styles.modalSubtitle}>Select Icon Library</Text>
              <View style={styles.iconLibrarySelector}>
                <TouchableOpacity
                  style={[
                    styles.iconLibraryButton,
                    selectedIconLibrary === 'FontAwesome5' &&
                      styles.iconLibraryButtonSelected,
                  ]}
                  onPress={() => setSelectedIconLibrary('FontAwesome5')}>
                  <Text style={styles.iconLibraryButtonText}>FontAwesome5</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.iconLibraryButton,
                    selectedIconLibrary === 'MaterialIcons' &&
                      styles.iconLibraryButtonSelected,
                  ]}
                  onPress={() => setSelectedIconLibrary('MaterialIcons')}>
                  <Text style={styles.iconLibraryButtonText}>
                    MaterialIcons
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.modalSubtitle}>Select Controller Icon</Text>
              <FlatList
                horizontal
                data={availableIcons}
                keyExtractor={item => item}
                initialNumToRender={10}
                maxToRenderPerBatch={20}
                renderItem={({item: icon}) => (
                  <TouchableOpacity
                    style={[
                      styles.iconOption,
                      customControllerIcon.name === icon &&
                        customControllerIcon.library === selectedIconLibrary &&
                        styles.iconOptionSelected,
                    ]}
                    onPress={() =>
                      debouncedSetControllerIcon({
                        library: selectedIconLibrary,
                        name: icon,
                      })
                    }>
                    {renderIcon(selectedIconLibrary, icon, 30, '#f0f0f0')}
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.iconSelector}
              />
              <Text style={styles.modalSubtitle}>Buttons</Text>
              {customControllerButtons.map(item => (
                <View key={item.id}>
                  <View style={styles.customButtonRow}>
                    <FlatList
                      horizontal
                      data={availableIcons}
                      keyExtractor={icon => icon}
                      initialNumToRender={10}
                      maxToRenderPerBatch={20}
                      renderItem={({item: icon}) => (
                        <TouchableOpacity
                          style={[
                            styles.iconOption,
                            item.icon.name === icon &&
                              item.icon.library === selectedIconLibrary &&
                              styles.iconOptionSelected,
                          ]}
                          onPress={() =>
                            debouncedSetIcon(item.id, {
                              library: selectedIconLibrary,
                              name: icon,
                            })
                          }>
                          {renderIcon(selectedIconLibrary, icon, 20, '#f0f0f0')}
                        </TouchableOpacity>
                      )}
                      contentContainerStyle={styles.iconSelector}
                    />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeCustomControllerButton(item.id)}>
                      <Icon name="trash" size={20} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={[styles.commandInput, {flex: 1}]}
                    value={item.message}
                    onChangeText={text =>
                      updateCustomControllerButton(item.id, 'message', text)
                    }
                    placeholder="Message (e.g., action)"
                    placeholderTextColor="#888"
                  />
                </View>
              ))}
              <TouchableOpacity
                style={styles.addButton}
                onPress={addCustomControllerButton}>
                <Text style={styles.addButtonText}>Add Button</Text>
              </TouchableOpacity>
              <View style={styles.commandModalButtons}>
                <TouchableOpacity
                  style={[styles.commandModalButton, styles.saveButton]}
                  onPress={saveCustomController}>
                  <Text style={styles.commandModalButtonText}>
                    Save Controller
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.commandModalButton, styles.cancelButton]}
                  onPress={() => setCustomControllerModalVisible(false)}>
                  <Text style={styles.commandModalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 10,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  headerIcon: {
    position: 'absolute',
    left: 15,
    top: 5,
  },
  title: {
    fontSize: 24,
    fontFamily: 'NeueMetana-Bold',
    color: '#f0f0f0',
    alignSelf: 'center',
  },
  deviceCounter: {
    fontSize: 16,
    fontFamily: 'Cirka-Variable',
    color: '#f0f0f0',
    marginTop: 5,
  },
  controlContainer: {
    backgroundColor: '#101010',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5,
    width: '90%',
    alignSelf: 'center',
  },
  headerText: {
    fontSize: 24,
    fontFamily: 'Cirka-Variable',
    textAlign: 'center',
    marginBottom: 20,
    color: '#eeeeee',
  },
  button: {
    backgroundColor: '#000000',
    padding: 10,
    borderRadius: 10,
    margin: 10,
    alignSelf: 'center',
    borderColor: 'gray',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5,
  },
  carButtonRow: {
    alignSelf: 'center',
    flexDirection: 'row',
  },
  fab: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
    backgroundColor: '#5dbe74',
    padding: 10,
    borderRadius: 10,
    alignSelf: 'center',
  },
  fabText: {
    color: '#000000',
    textAlign: 'center',
    fontSize: 20,
    fontFamily: 'Cirka-Bold',
  },
  bottomSheet: {
    backgroundColor: '#1F2124',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '100%',
  },
  bottomSheetModes: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  bottomSheetMode: {
    alignItems: 'center',
    margin: 10,
    width: '30%',
  },
  bottomSheetModeText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
    fontFamily: 'Cirka-Variable',
    textAlign: 'center',
  },
  lightContainer: {
    backgroundColor: '#3a3a3a',
    borderRadius: 50,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5,
    alignSelf: 'center',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    justifyContent: 'flex-start',
    margin: 0,
  },
  modalContent: {
    backgroundColor: '#1F2124',
    width: '80%',
    height: '100%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'NeueMetana-Bold',
    color: '#f0f0f0',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 18,
    fontFamily: 'Cirka-Variable',
    color: '#f0f0f0',
    marginTop: 10,
    marginBottom: 5,
  },
  deviceList: {
    flex: 1,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  deviceText: {
    fontSize: 16,
    fontFamily: 'Cirka-Variable',
    color: '#f0f0f0',
    marginLeft: 10,
  },
  noDevicesText: {
    fontSize: 16,
    fontFamily: 'Cirka-Variable',
    color: '#f0f0f0',
    textAlign: 'center',
    marginTop: 20,
  },
  modalDisconnectButton: {
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
  },
  modalDisconnectButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Cirka-Variable',
  },
  closeButton: {
    backgroundColor: '#5dbe74',
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Cirka-Variable',
  },
  commandModal: {
    justifyContent: 'center',
    margin: 20,
  },
  commandModalContent: {
    backgroundColor: '#1F2124',
    padding: 20,
    borderRadius: 10,
  },
  commandInput: {
    backgroundColor: '#333',
    color: '#f0f0f0',
    fontSize: 16,
    fontFamily: 'Cirka-Variable',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  commandModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commandModalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: '#5dbe74',
  },
  cancelButton: {
    backgroundColor: '#ff4444',
  },
  commandModalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Cirka-Variable',
  },
  customControllerModal: {
    justifyContent: 'center',
    margin: 20,
  },
  customControllerModalContent: {
    backgroundColor: '#1F2124',
    padding: 20,
    borderRadius: 10,
    maxHeight: '80%',
  },
  iconLibrarySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconLibraryButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#333',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  iconLibraryButtonSelected: {
    backgroundColor: '#5dbe74',
  },
  iconLibraryButtonText: {
    color: '#f0f0f0',
    fontSize: 16,
    fontFamily: 'Cirka-Variable',
  },
  iconSelector: {
    marginVertical: 10,
  },
  iconOption: {
    padding: 10,
    marginRight: 10,
    borderRadius: 5,
    backgroundColor: '#333',
  },
  iconOptionSelected: {
    backgroundColor: '#5dbe74',
  },
  customButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  removeButton: {
    padding: 10,
    marginLeft: 10,
  },
  addButton: {
    backgroundColor: '#5dbe74',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Cirka-Variable',
  },
});

export default ControlScreen;

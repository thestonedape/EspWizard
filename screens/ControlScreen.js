import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useSelector } from 'react-redux';
import BottomSheet from '../components/BottomSheet';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

const CarControlScreen = () => {
  const port = 12345;
  const broadcastIP = useSelector((state) => state.IPaddress);
  const socket = useSelector((state) => state.socket);

  const [controller , setController] = useState();

  const ref = useRef(null);

  const onPress = useCallback(() => {
    const isActive = ref.current?.isActive();
    if (isActive) {
      ref.current?.scrollTo(0);
    } else {
      ref.current?.scrollTo(-200)
    }
  }, []);



  const sendCommand = useCallback((command) => {
    socket.send(command, undefined, undefined, port, broadcastIP, (err) => {
      if (err) throw err;
      console.log(`Sent message: ${command}`);
    });
  }, []);

  const renderContent = () => (
    <View style={styles.bottomSheet}>
        <View style={styles.bottomSheetModes}>
          <TouchableOpacity style={styles.bottomSheetMode}
            onPress={() => setController('light')}
           >
            <Icon name='lightbulb' size={30} color='#fff' />
            <Text style={styles.bottomSheetModeText}>Light</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomSheetMode}
            onPress={() => setController('car')}
          >
            <Icon name='car' size={30} color='#fff' />
            <Text style={styles.bottomSheetModeText}>Car</Text>  
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomSheetMode}
            onPress={() => setController('fan')}
           >
            <Icon name='fan' size={30} color='#fff' />
            <Text style={styles.bottomSheetModeText}>Fan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomSheetMode}
            onPress={() => setController('bot')}
          >
            <Icon name='robot' size={30} color='#fff' />
            <Text style={styles.bottomSheetModeText}>Bot</Text>
          </TouchableOpacity>
        </View>
    </View>
  );

  const car = () => (
    <View style={styles.controlContainer}>
    <Text style={styles.headerText}>Car Control</Text>

          <TouchableOpacity style={styles.button} onPress={() => sendCommand('forward')}>
            <Icon name="arrow-up" size={30} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={{ alignSelf: 'center', flexDirection: 'row' }}>
            <TouchableOpacity style={styles.button} onPress={() => sendCommand('left')}>
              <Icon name="arrow-left" size={30} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => sendCommand('backward')}>
              <Icon name="arrow-down" size={30} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => sendCommand('right')}>
              <Icon name="arrow-right" size={30} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          </View>
  )

  const [isLightOn, setIsLightOn] = useState(false);

  const handleLightPress = () => {
    if (isLightOn) {
      sendCommand('off');
      setIsLightOn(false);
    } else {
      sendCommand('on');
      setIsLightOn(true);
    }
  };


  const light = () => (
    <View style={styles.controlContainer}>
    <Text style={styles.headerText}>Light Control</Text>
    <TouchableOpacity onPress={handleLightPress}>
      <View style={styles.lightContainer}>
        <Icon
          name="lightbulb"
          size={60}
          color={isLightOn ? '#FFD700' : '#EEE'}
          style={{ alignSelf: 'center' }}
        />
      </View>
    </TouchableOpacity>
  </View>
  )

  const fan = () => (
    <View style={styles.controlContainer}>
    <Text style={styles.headerText}>Fan Control</Text>
    <TouchableOpacity
      style={styles.lightContainer}
     onPress={() => sendCommand('fan_on')}>
      <Icon name="power-off" size={30} color="#FFFFFF" />
    </TouchableOpacity>
    </View>
  )

  const bot = () => (
    <View style={styles.controlContainer}>
    <Text style={styles.headerText}>Bot Control</Text>
    <TouchableOpacity
      style={styles.lightContainer}
     onPress={() => sendCommand('fan_on')}>
      <Icon name="power-off" size={30} color="#FFFFFF" />
    </TouchableOpacity>
    </View>
  )

  const renderController = () => {
    switch (controller) {
      case 'car':
        return car();
      case 'light':
        return light();
      case 'fan':
        return fan();
      case 'bot':
        return bot();
      default:
        return car();
    }
  }



  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>ESP Wizard </Text>
        </View>
        
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',

          }}>
          {renderController()}
        </View>


        

        <TouchableOpacity style={styles.fab} onPress={onPress}>
          <Text style={styles.fabText}>Modes</Text>
        </TouchableOpacity>

        <BottomSheet ref={ref}>
          <View style={{ flex: 1, backgroundColor: '#2a2a2a' }} > 
            {renderContent()}
          </View>

        </BottomSheet>

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
    padding: 20,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily:'NeueMetana-Bold',
    color: '#f0f0f0',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5,
    width: 300,
    alignSelf: 'center',
    marginTop: "50%"
  },
  controlContainer: {
    backgroundColor: '#101010',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5,
    width: "90%",
    alignSelf: 'center',
  },
  headerText: {
    fontSize: 24,
    fontFamily:'Cirka-Variable',
    textAlign: 'center',
    marginBottom: 20,
    color: '#eeeeee',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
    color: '#000000',
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#000000',
    padding: 10,
    borderRadius: 10,
    margin: 20,
    borderColor: '#CCCCCC',
    borderWidth: 1,
    width: 100,
    alignSelf: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  sendCommandStatus: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5,
    width: "90%",
    alignSelf: 'center',
    margin: 10,
    padding: 10,
    borderRadius: 10,
  },
  sendCommandStatusText: {
    fontSize: 18,
    color: '#000000',
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
    fontFamily:'Cirka-Bold',
  },
    bottomSheet: {
      backgroundColor: "#1F2124",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      height: "100%",
    },
    bottomSheetModes: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 10,
      marginTop: 20,
    },
    bottomSheetMode: {
      alignItems: "center",
    },
    bottomSheetModeText: {
      color: "#FFFFFF",
      fontSize: 16,
      marginTop: 10,
      fontFamily:'Cirka-Variable',
    },
    lightContainer: {
      backgroundColor: '#3a3a3a',
      borderRadius: 50,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.8,
      shadowRadius: 3,
      elevation: 5,
      alignSelf: 'center',
      width: 100,
      height: 100,
      justifyContent: 'center',
      alignItems: 'center',

    },

  
});


export default CarControlScreen;
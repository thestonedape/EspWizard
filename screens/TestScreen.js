import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Text, TouchableOpacity, View, FlatList, StatusBar, StyleSheet, ToastAndroid } from 'react-native';
import dgram from 'react-native-udp';
import Lottie from 'lottie-react-native';

import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';



export default function NewDevice() {
    const [loading, setLoading] = useState(false);
    const [foundEspList, setFoundEspList] = useState([]);
    const [devicesFound, setDevicesFound] = useState(false);
    const socketRef = useRef(dgram.createSocket('udp4'));
    const navigation = useNavigation();
    const dispatch = useDispatch();

    const beginSearch = async () => {
        setLoading(true);
        setFoundEspList([]);
        setDevicesFound(false);
        const port = 12345;
        const broadcastIP = '192.168.39.255';
        const socket = dgram.createSocket('udp4');
        socket.on('message', handleMessage);
        await socket.bind(port);
        socket.send('ESP-ACK', undefined, undefined, port, broadcastIP, (err) => {
            if (err) throw err;
        });
        socketRef.current = socket;
    };

    const handleMessage = (msg, rinfo) => {
        const buffer = msg.toString();
        if (buffer !== 'ESP-ACK' && buffer !== '') {
          const esp = `ESP ${foundEspList.length + 1}`;
          const existingEspIndex = foundEspList.findIndex((item) => item.host === rinfo.address);
          if (existingEspIndex !== -1) {
            const updatedEspList = [...foundEspList];
            updatedEspList[existingEspIndex] = {
              key: esp,
              host: rinfo.address,
              message: buffer,
            };
            setFoundEspList(updatedEspList);
          } else {
            setFoundEspList((prevList) => [
              ...prevList,
              {
                key: esp,
                host: rinfo.address,
                message: buffer,
              },
            ]);
          }
          setDevicesFound(true);
          console.log('Message received and processed successfully:', buffer);
        }
      };
      

    const cancelSearch = useCallback(() => {
        setLoading(false);
        setFoundEspList([]);
        setDevicesFound(false);
        socketRef.current.close();
    }, []);

    useEffect(() => {
        dispatch({ type: 'SET_SOCKET', payload: socketRef.current });
        socketRef.current.on('message', handleMessage);
      
        return () => {
          socketRef.current.off('message', handleMessage);
        };
      }, [dispatch, handleMessage]);
      

    useEffect(() => {
        if (devicesFound && foundEspList.length === 1) {
            console.log('Found an ESP8266 on the network!', foundEspList[foundEspList.length - 1]?.host);
        }
    }, [devicesFound, foundEspList]);
    

    const handleDeviceSelect = useCallback((item) => {
        navigation.navigate('Control', { host: item.host });
    }, [navigation]);

    

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor='#1e1e1e' barStyle='light-content' />
            <View style={styles.header}><Text style={styles.title}>Esp Wizard</Text></View>
            <View style={styles.content}>
                <View style={styles.card}><Text style={styles.cardTitle}>Find your ESP</Text>
                    {!loading && !devicesFound && (
                        <View><Text style={styles.cardText}>Press the button below to search for your ESP8266 on the network.</Text>
                            <TouchableOpacity style={styles.searchButton} onPress={beginSearch}><Text style={styles.searchButtonText}>Search</Text></TouchableOpacity>
                        </View>)}
                    {loading && (
                        <View style={styles.loading}><Lottie source={require('./lottie/loading.json')} autoPlay loop style={styles.lottie} />
                            <TouchableOpacity style={styles.cancelButton} onPress={cancelSearch}><Text style={styles.cancelButtonText}>Cancel</Text></TouchableOpacity>
                        </View>)}
                    {devicesFound && (
                        <View style={styles.results}>
                            <FlatList
                                data={foundEspList}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.result} onPress={() =>
                                        handleDeviceSelect(item)
                                    }><Text style={styles.resultText}>{item.key} : {item.host}</Text></TouchableOpacity>)}
                                keyExtractor={(item, index) => `${item.key}-${index}`} />
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1e1e1e',
    },
    header: {
        padding: 20,
        backgroundColor: '#1e1e1e',
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#f0f0f0',
    },
    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f0f0f0'
    },
    card: {
        width: '100%',
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        elevation: 4,
        padding: 20,
        color: '#f0f0f0'
    },
    cardText: {
        color: '#ccc',
        marginBottom: 20,
    },

    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f0f0f0',
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#f0f0f0',
        marginBottom: 20,
    },
    searchButton: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    searchButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#2a2a2a',
    },
    loading: {
        marginTop: 20,
        alignItems: 'center',
        color: '#f0f0f0',
    },
    loadingText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#f0f0f0',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginBottom: 10,
        marginTop: 20,
    },
    cancelButtonText: {
        color: '#2a2a2a',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    results: {
        marginTop: 20,
        width: '100%',
        color: '#f0f0f0',
    },
    result: {
        backgroundColor: '#3a3a3a',
        borderRadius: 8,
        padding: 20,
        margin: 10,

    },
    resultText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f0f0f0',
    },
    lottie: {
        width: 300,
        height: 300,
    },
    controlContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.8,
        shadowRadius: 3,
        elevation: 5,
        width: "90%",
        alignSelf: 'center',
        marginTop: "50%"
    },
    headerText: {
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 20,
        color: '#000000',
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
        borderColor: '#CCCCCC',
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.8,
        shadowRadius: 3,
        elevation: 5,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#FFFFFF',
    },
    

});




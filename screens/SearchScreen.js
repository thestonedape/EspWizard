import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Text, TouchableOpacity, View, FlatList, StatusBar, StyleSheet, ToastAndroid } from 'react-native';
import dgram from 'react-native-udp';
import Lottie from 'lottie-react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';


export default function NewDevice() {
    const [loading, setLoading] = useState(false);
    const [foundEspList, setFoundEspList] = useState([]);
    const [devicesFound, setDevicesFound] = useState(false);
    const socketRef = useRef(dgram.createSocket('udp4'));
    const navigation = useNavigation();
    const dispatch = useDispatch();

    const broadcastIP = useSelector((state) => state.IPaddress);

    const beginSearch = useCallback(async () => {
        setLoading(true);
        setFoundEspList([]);
        setDevicesFound(false);
        const port = 12345;
        const socket = dgram.createSocket('udp4');
        socket.on('message', handleMessage);
        await socket.bind(port);
        socket.send('ESP-ACK', undefined, undefined, port, broadcastIP, (err) => {
            if (err) throw err;
        });
        socketRef.current = socket;
    }, []);
    

    const handleMessage = useCallback((msg, rinfo) => {
        const buffer = msg.toString();
        if (buffer !== 'ESP-ACK' && buffer !== '') {
            const esp = `ESP ${foundEspList.length + 1}`;
            const existingEspIndex = foundEspList.findIndex((item) => item.host === rinfo.address);
            const updatedEspList = [...foundEspList];
            if (existingEspIndex !== -1) {
                updatedEspList[existingEspIndex] = {
                    ...updatedEspList[existingEspIndex],
                    key: esp,
                    message: buffer,
                };
            } else {
                updatedEspList.push({
                    key: esp,
                    host: rinfo.address,
                    message: buffer,
                });
            }
            setFoundEspList(updatedEspList);
            setDevicesFound(true);
            console.log('Message received and processed successfully:', buffer);
        }
    }, [foundEspList]);
    

    const cancelSearch = useCallback(() => {
        setLoading(false);
        setFoundEspList([]);
        setDevicesFound(false);
        socketRef.current.close();
        navigation.navigate('Test');
    }, [navigation]);

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

    useEffect(() => {
        beginSearch();
    }, [beginSearch]);

    return (
        <View style={styles.container}>
          <StatusBar backgroundColor="#000000" barStyle="light-content" />
            <View style={styles.lottieContainer}>
                <Lottie
                    style={styles.lottie}
                    source={require('../screens/lottie/loading.json')}
                    autoPlay
                    loop
                />
                {foundEspList.length > 0 && (
                    <View 
                    style= {{
                        padding: 10,
                        position: 'absolute',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: 300,}}>
                    <FlatList
                                data={foundEspList}
                                renderItem={({ item }) => (
                                    <TouchableOpacity 
                                    style={{
                                        alignSelf: 'center',
                                    }}
                                    onPress={() =>
                                        handleDeviceSelect(item)
                                    }>
                                    <Text
                                    style={{
                                        fontFamily: 'Cirka-Bold',
                                        color: '#eee',
                                        fontSize: 18,
                                    }}   
                                     >
                                    {item.key} : {item.host}
                                    </Text>
                                    </TouchableOpacity>)}
                                keyExtractor={(item, index) => `${item.key}-${index}`} />
                    </View>
                )}


                
            </View>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={cancelSearch}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    lottieContainer: {
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    lottie: {
        width: 360,
        height: 360,
    },
    cancelButton: {
        backgroundColor: '#2E2e2e',
        padding: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    cancelButtonText: {
        fontFamily: 'Gilroy-ExtraBold',
        color: '#5dbe74',
        fontSize: 18,
    },
});

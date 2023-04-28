import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ToastAndroid } from 'react-native';
import dgram from 'react-native-udp';

import Icon from 'react-native-vector-icons/FontAwesome5';

const CarControlScreen = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [ipAddress, setIpAddress] = useState('');
    const [socket, setSocket] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [command, setCommand] = useState('');

    const createSocket = (ip) => {
        try {
            const udpSocket = dgram.createSocket('udp4');
            udpSocket.on('error', (err) => {
                console.log('Socket error: ' + err);
                setErrorMessage('Socket error: ' + err);
                udpSocket.close();
                setSocket(null);
            });
            udpSocket.bind(8083, ip, () => {
                console.log('Socket bound to ' + ip + ':8083');
                ToastAndroid.show('Connected', ToastAndroid.SHORT);
                setSocket(udpSocket);
            });
        } catch (error) {
            console.log('Error creating socket: ' + error);
            setErrorMessage('Error creating socket: ' + error);
        }
    };

    const connectToCar = () => {
        const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
        if (ipRegex.test(ipAddress.trim())) {
            console.log('Attempting to connect to the car at ' + ipAddress);
            createSocket(ipAddress);
            setIsConnected(true);
        } else {
            console.log('Invalid IP address format');
            ToastAndroid.show('Please enter a valid IP address', ToastAndroid.SHORT);
        }
    };

    const sendCommand = (command) => {
        if (!socket) {
            console.log('Socket is not connected');
            ToastAndroid.show('Socket is not connected', ToastAndroid.SHORT);
            return;
        }
        console.log('Sending command to the car: ' + command);
        try {
            socket.send(command, 0, command.length, 8083, ipAddress, (err) => {
                if (err) {
                    console.log('Error sending command to the car: ' + err);
                    setErrorMessage('Error sending command to the car: ' + err);
                } else {
                    setCommand(command);
                }
            });
        } catch (error) {
            console.log('Error sending command to the car: ' + error);
            setErrorMessage('Error sending command to the car: ' + error);
        }
    };

    const goBack = () => {
        if (socket) {
            socket.close();
            setSocket(null);
        }
        setIsConnected(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>ESP Controller</Text>
            {isConnected ? (
            <View style={styles.sendCommandStatus}>
                <Text style={styles.sendCommandStatusText}>Command String : {command}</Text>
            </View>
            ) : null}


            {!isConnected ? (
                <View style={styles.formContainer}>
                    <Text style={styles.headerText}>Establish Connection</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="IP Address"
                        value={ipAddress}
                        onChangeText={setIpAddress}
                        placeholderTextColor="#aaaaaa"
                        keyboardType="numeric"
                    />
                    <TouchableOpacity style={styles.button} onPress={connectToCar}>
                        <Text style={styles.buttonText}>Connect</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.controlContainer}>
                    <Text style={styles.headerText}>Car Control</Text>
                    <TouchableOpacity style={styles.button} onPress={() => sendCommand('forward')}>
                        <Icon name="arrow-up" size={30} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={{
                        alignSelf: 'center',
                        flexDirection: 'row'
                    }}>
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
            )}

            {isConnected ? (
                <TouchableOpacity style={styles.backButton} onPress={goBack}>
                    <Text style={styles.backButtonText}>Reset</Text>
                </TouchableOpacity>
            ) : null}

        </View>
    );
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        paddingVertical: 10,
        borderBottomWidth: 1,
        marginStart: 10,
        marginEnd: 10,
        borderBottomColor: '#CCCCCC',
        color: '#000000',
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
        margin : 10,
        padding : 10,
        borderRadius : 10,
    },
    sendCommandStatusText: {
        fontSize: 18,
        color: '#000000',
    },

});


export default CarControlScreen;
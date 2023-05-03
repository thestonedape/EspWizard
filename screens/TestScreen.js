import React from 'react';
import { Text, TouchableOpacity, View, FlatList, StatusBar, StyleSheet, ToastAndroid, Image, TextInput, } from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome5';
import { ThemedButton } from "react-native-really-awesome-button";
import { useNavigation } from '@react-navigation/native';
import Lottie from 'lottie-react-native';
import NetInfo from "@react-native-community/netinfo";

export default function NewDevice() {
    const navigation = useNavigation();
    const [ipAddress, setIpAddress] = React.useState('');

    const tap = async () => {
        const connectionInfo = await NetInfo.fetch();
        if (connectionInfo.type !== 'wifi') {
            ToastAndroid.show('Please connect to a WiFi network', ToastAndroid.SHORT);
            return;
        }
        navigation.navigate('Search');
    };

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#000000" barStyle="light-content" />
            <View style={styles.header}>
                <Text style={styles.title}>ESP Wizard</Text>
                <Text style={{
                    fontSize: 16,
                    fontFamily: 'Cirka-Variable',
                    color: '#C0C0C0',
                    alignSelf: 'center',
                    marginTop: 10,
                }}>backed by Inside Labs</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Image source={require('../screens/lottie/homeanimation.gif')} style={{ width: 500, height: 500, alignSelf: 'center', }} />
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', }}>
                <TextInput
                    style={{
                        height: 40,
                        width: 300,
                        borderColor: '#505050',
                        borderWidth: 1,
                        borderRadius: 10,
                        padding: 10,
                        color: '#eee',
                        fontFamily: 'Cirka-Regular',

                    }}
                    placeholder="Set IP Address"
                    value={ipAddress}
                    onChangeText={setIpAddress}
                    placeholderTextColor="#5dbe74"
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.buttonContainer}>
                <ThemedButton
                    name="bruce"
                    type="primary"
                    onPress={tap}
                    style={styles.button}>
                    <Text style={styles.buttonText}>Search</Text>
                </ThemedButton>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        padding: 20,
        backgroundColor: '#000000',
    },
    title: {
        fontSize: 20,
        fontFamily: 'NeueMetana-Bold',
        color: '#EEE',
        alignSelf: 'center',
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000000',
        padding: 20,
    },
    button: {
        width: 200,
        height: 55,
    },
    buttonText: {
        fontSize: 20,
        fontFamily: 'Gilroy-ExtraBold',
        color: '#5dbe74',
    },
});

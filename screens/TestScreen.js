import React from 'react';
import {
    Text,
    TouchableOpacity,
    View,
    FlatList,
    StatusBar,
    StyleSheet,
    ToastAndroid,
    Image,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { ThemedButton } from 'react-native-really-awesome-button';
import { useNavigation } from '@react-navigation/native';
import Lottie from 'lottie-react-native';
import NetInfo from '@react-native-community/netinfo';
import { useDispatch } from 'react-redux';

export default function NewDevice() {
    const navigation = useNavigation();
    const [ipAddress, setIpAddress] = React.useState('');
    const dispatch = useDispatch();

    const tap = async () => {
        const connectionInfo = await NetInfo.fetch();
        if (connectionInfo.type !== 'wifi') {
            ToastAndroid.show(
                'Please connect to a WiFi network',
                ToastAndroid.SHORT,
            );
            return;
        }
        const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ipAddress)) {
            ToastAndroid.show(
                'Please enter a valid IP address',
                ToastAndroid.SHORT,
            );
            return;
        }
        dispatch({ type: 'SET_IP_ADDRESS', payload: ipAddress });
        navigation.navigate('Search');
    };

    return (
        <KeyboardAwareScrollView
            style={styles.container}>
            <StatusBar backgroundColor="#000000" barStyle="light-content" />
            <View style={styles.header}>
                <Text style={styles.title}>ESP Wizard</Text>
                <Text
                    style={{
                        fontSize: 16,
                        fontFamily: 'Cirka-Variable',
                        color: '#C0C0C0',
                        alignSelf: 'center',
                        marginTop: 10,
                    }}>
                    backed by Inside Labs
                </Text>
            </View>
            <Image
                source={require('../screens/lottie/homeanimation.gif')}
                style={{ width: 400, height: 400, alignSelf: 'center' }}
            />
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                <TextInput
                    style={styles.input}
                    placeholder="broadcast IP"
                    value={ipAddress}
                    onChangeText={setIpAddress}
                    placeholderTextColor="#5dbe74"
                    placeholderStyle={{ fontFamily: 'Cirka-Variable' }}
                    keyboardType="numeric"
                    keyboardAppearance="dark"
                     />
            </View>
            <View style={styles.buttonContainer}>
                <ThemedButton
                    name="bruce"
                    type="primary"
                    onPress={tap}
                    style={styles.button}>
                    <Text style={styles.buttonText}>Locate</Text>
                </ThemedButton>
            </View>
        </KeyboardAwareScrollView>
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
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000000',
        padding: 20,
        marginTop: 30,
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
    inputContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    input: {
        height: 40,
        width: 300,
        borderColor: '#505050',
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
        color: '#5dbe74',
        fontFamily: 'Cirka-Variable',
    },
});


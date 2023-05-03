import { useEffect } from 'react';

export default function NewDevice() {
    const [loading, setLoading] = useState(false);
    const [foundEspList, setFoundEspList] = useState([]);
    const [devicesFound, setDevicesFound] = useState(false);
    const socketRef = useRef(dgram.createSocket('udp4'));
    const navigation = useNavigation();
    const dispatch = useDispatch();

    const beginSearch = useCallback(async (broadcastIP) => {
        setLoading(true);
        setFoundEspList([]);
        setDevicesFound(false);
        const port = 12345;
        socketRef.current.on('message', handleMessage);
        await socketRef.current.bind(port);
        socketRef.current.send('ESP-ACK', undefined, undefined, port, broadcastIP, (err) => {
            if (err) throw err;
        });
    }, []);

    function handleMessage(msg, rinfo) {
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
                setFoundEspList((prevList) => [...prevList, { key: esp, host: rinfo.address, message: buffer, },]);
            }
            setDevicesFound(true);
            console.log('Message received and processed successfully:', buffer);
        }
    }

    const cancelSearch = useCallback(() => {
        setLoading(false);
        setFoundEspList([]);
        setDevicesFound(false);
        socketRef.current.close();
        navigation.navigate('Test');
    }, [navigation]);

    useEffect(() => {
        dispatch({ type: 'SET_SOCKET', payload: socketRef.current });
        return () => {
            socketRef.current.removeListener('message', handleMessage);
        };
    }, [dispatch, handleMessage]);

    useEffect(() => {
        beginSearch(useSelector((state) => state.IPaddress));
    }, [beginSearch]);

    function handleDeviceSelect(item) {
        navigation.navigate('Control', { esp: item });
    }


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
                        style={{
                            padding: 10,
                            position: 'absolute',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: 300,
                        }}>
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




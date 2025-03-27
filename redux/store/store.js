import { createStore } from 'redux';

const initialState = {
  server: null,
  connectedDevices: [],
  sockets: [], // Still store sockets for cleanup, but don’t log them directly
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_SERVER':
      console.log('SET_SERVER: Server set');
      return { ...state, server: action.payload };

    case 'ADD_CONNECTED_DEVICE':
      console.log('ADD_CONNECTED_DEVICE:', { ip: action.payload.ip, port: action.payload.port });
      const exists = state.connectedDevices.some(
        (device) => device.ip === action.payload.ip && device.port === action.payload.port
      );
      if (exists) return state;
      return {
        ...state,
        connectedDevices: [...state.connectedDevices, { ip: action.payload.ip, port: action.payload.port, messages: [] }],
        sockets: [...state.sockets, action.payload.socket],
      };

    case 'ADD_MESSAGE':
      console.log('ADD_MESSAGE:', action.payload);
      return {
        ...state,
        connectedDevices: state.connectedDevices.map((device) =>
          device.ip === action.payload.ip && device.port === action.payload.port
            ? { ...device, messages: [...(device.messages || []), action.payload.message] }
            : device
        ),
      };

    case 'REMOVE_CONNECTED_DEVICE':
      console.log('REMOVE_CONNECTED_DEVICE:', action.payload);
      return {
        ...state,
        connectedDevices: state.connectedDevices.filter(
          (device) => !(device.ip === action.payload.ip && device.port === action.payload.port)
        ),
        sockets: state.sockets.filter(
          (socket) => !(socket.remoteAddress === action.payload.ip && socket.remotePort === action.payload.port)
        ),
      };

    case 'STOP_SERVER':
      console.log('STOP_SERVER');
      return { ...state, server: null, connectedDevices: [], sockets: [] };

    default:
      return state;
  }
};

const store = createStore(reducer);

export default store;
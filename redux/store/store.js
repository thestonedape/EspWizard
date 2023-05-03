import { createStore } from 'redux';

const initialState = {
  socket: null,
};

function rootReducer(state = initialState, action) {
  switch (action.type) {
    case 'SET_SOCKET':
      return { ...state, socket: action.payload };

    case 'SET_IP_ADDRESS':
      return { ...state, ipAddress: action.payload };

    default:
      return state;
      
  }
}

const store = createStore(rootReducer);

export default store;

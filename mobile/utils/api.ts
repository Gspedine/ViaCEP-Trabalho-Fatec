import axios from 'axios';
import { Platform } from 'react-native';

// Para o emulador do Android acessar a máquina local, usamos o IP da rede em vez de localhost
// Se estiver no Web (React Native Web) ou em um dispositivo físico na mesma rede, o IP também funciona.
const LOCAL_IP = '10.195.152.12'; 

const baseURL = Platform.OS === 'web' 
  ? 'http://localhost:4000' 
  : `http://${LOCAL_IP}:4000`;

export const api = axios.create({
  baseURL,
});

export const setAuthToken = (token: string) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

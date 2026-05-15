import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../utils/api';

type User = { username: string } | null;

interface AuthContextType {
  user: User;
  token: string | null;
  dbType: string;
  setDbType: (type: string) => void;
  login: (token: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [dbType, setDbType] = useState('mongodb');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('viacep_user_token');
        const storedUser = await AsyncStorage.getItem('viacep_user_info');
        const storedDbType = await AsyncStorage.getItem('viacep_db_type');
        
        if (storedToken && storedUser) {
          setTokenState(storedToken);
          setUser(JSON.parse(storedUser));
          setAuthToken(storedToken);
        }
        if (storedDbType) setDbType(storedDbType);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadAuth();
  }, []);

  const login = async (newToken: string, username: string) => {
    await AsyncStorage.setItem('viacep_user_token', newToken);
    await AsyncStorage.setItem('viacep_user_info', JSON.stringify({ username }));
    setTokenState(newToken);
    setUser({ username });
    setAuthToken(newToken);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('viacep_user_token');
    await AsyncStorage.removeItem('viacep_user_info');
    setTokenState(null);
    setUser(null);
    setAuthToken('');
  };

  const changeDbType = async (type: string) => {
    setDbType(type);
    await AsyncStorage.setItem('viacep_db_type', type);
  }

  return (
    <AuthContext.Provider value={{ user, token, dbType, setDbType: changeDbType, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

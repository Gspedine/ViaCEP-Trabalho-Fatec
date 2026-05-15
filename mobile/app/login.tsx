import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Container, Card, Input, Button } from '../components/UI';

export default function LoginScreen() {
  const { login, dbType } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState<{text: string, type: 'error' | 'success'} | null>(null);

  const handleSubmit = async () => {
    setMessage(null);
    if (!username || !password) {
      setMessage({ text: 'Preencha todos os campos.', type: 'error' });
      return;
    }

    if (isRegistering && password !== confirmPassword) {
      setMessage({ text: 'As senhas não batem.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      const response = await api.post(endpoint, { username, password }, { params: { db: dbType } });
      const { token, username: returnedUsername } = response.data;
      
      await login(token, returnedUsername);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.error || 'Falha na autenticação.';
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container style={{ justifyContent: 'center' }}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Acesso seguro</Text>
        <Text style={styles.title}>Login de usuário</Text>
        <Text style={styles.subtitle}>Registre-se ou faça login para acessar seus cadastros.</Text>
      </View>

      <Card>
        <Text style={styles.cardTitle}>{isRegistering ? 'Criar conta' : 'Entrar'}</Text>

        {message && (
          <View style={[styles.messageBox, message.type === 'error' ? styles.messageError : styles.messageSuccess]}>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        )}

        <Input 
          label="Usuário" 
          value={username} 
          onChangeText={setUsername} 
          autoCapitalize="none" 
        />
        <Input 
          label="Senha" 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry 
        />
        
        {isRegistering && (
          <Input 
            label="Confirme a senha" 
            value={confirmPassword} 
            onChangeText={setConfirmPassword} 
            secureTextEntry 
          />
        )}

        <Button 
          title={isRegistering ? 'Registrar' : 'Entrar'} 
          onPress={handleSubmit} 
          loading={loading} 
        />
        
        <Button 
          title={isRegistering ? 'Já tenho conta' : 'Criar conta'} 
          variant="ghost" 
          onPress={() => {
            setIsRegistering(!isRegistering);
            setUsername('');
            setPassword('');
            setConfirmPassword('');
          }} 
        />
      </Card>
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  eyebrow: {
    color: '#3b82f6',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 20,
    textAlign: 'center',
  },
  messageBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  messageError: {
    backgroundColor: '#7f1d1d',
    borderColor: '#ef4444',
  },
  messageSuccess: {
    backgroundColor: '#14532d',
    borderColor: '#22c55e',
  },
  messageText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  }
});

import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert, View, Text } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { Container, Card, Input, Button } from '../../components/UI';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function NewRegistrationScreen() {
  const { dbType } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', localidade: '', uf: ''
  });
  const [profile, setProfile] = useState({
    nome: '', cpf: '', email: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const [message, setMessage] = useState<{text: string, type: 'error' | 'success'} | null>(null);

  useEffect(() => {
    if (params.editData) {
      try {
        const item = JSON.parse(params.editData as string);
        setAddress({
          cep: item.cep || '',
          logradouro: item.logradouro || '',
          numero: item.numero || '',
          complemento: item.complemento || '',
          bairro: item.bairro || '',
          localidade: item.localidade || '',
          uf: item.uf || ''
        });
        setProfile({
          nome: item.nome || '',
          cpf: item.cpf || '',
          email: item.email || ''
        });
        setEditingId(item._id || item.id);
      } catch (e) {
        console.error(e);
      }
    }
  }, [params.editData]);

  const handleSearchCep = async () => {
    setMessage(null);
    const cleanedCep = address.cep.replace(/\D/g, '');
    if (cleanedCep.length !== 8) {
      setMessage({ text: 'Informe um CEP válido com 8 dígitos.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        setMessage({ text: 'CEP não encontrado.', type: 'error' });
        return;
      }
      
      setAddress((prev) => ({
        ...prev,
        logradouro: data.logradouro || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        localidade: data.localidade || '',
        uf: data.uf || ''
      }));
      setMessage({ text: 'CEP encontrado!', type: 'success' });
    } catch (error) {
      console.error(error);
      setMessage({ text: 'Falha ao buscar CEP.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setMessage(null);
    if (!profile.nome || !profile.cpf || !profile.email || !address.cep || !address.logradouro || !address.numero) {
      setMessage({ text: 'Preencha os campos obrigatórios (*).', type: 'error' });
      return;
    }

    setLoading(true);
    const payload = { ...profile, ...address };

    try {
      if (editingId) {
        await api.put(`/api/registrations/${editingId}`, payload, { params: { db: dbType } });
        setMessage({ text: 'Registro atualizado!', type: 'success' });
      } else {
        await api.post('/api/registrations', payload, { params: { db: dbType } });
        setMessage({ text: 'Cadastro salvo com sucesso!', type: 'success' });
      }
      
      // Limpar formulário
      setProfile({ nome: '', cpf: '', email: '' });
      setAddress({ cep: '', logradouro: '', numero: '', complemento: '', bairro: '', localidade: '', uf: '' });
      setEditingId(null);
      
      // Mudar para aba de lista após 1.5s
      setTimeout(() => {
        router.push('/list');
      }, 1500);
      
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.error || 'Falha ao salvar registro.';
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {message && (
          <View style={[styles.messageBox, message.type === 'error' ? styles.messageError : styles.messageSuccess]}>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        )}

        <Card>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>1. Endereço</Text>
          </View>
          
          <Input label="CEP *" value={address.cep} onChangeText={(t) => setAddress({...address, cep: t})} keyboardType="number-pad" />
          <Button title="Buscar CEP" variant="secondary" onPress={handleSearchCep} loading={loading} style={{marginBottom: 16}} />
          
          <Input label="Logradouro *" value={address.logradouro} onChangeText={(t) => setAddress({...address, logradouro: t})} />
          <Input label="Número *" value={address.numero} onChangeText={(t) => setAddress({...address, numero: t})} keyboardType="number-pad" />
          <Input label="Complemento" value={address.complemento} onChangeText={(t) => setAddress({...address, complemento: t})} />
          <Input label="Bairro *" value={address.bairro} onChangeText={(t) => setAddress({...address, bairro: t})} />
          <Input label="Cidade *" value={address.localidade} onChangeText={(t) => setAddress({...address, localidade: t})} />
          <Input label="UF *" value={address.uf} onChangeText={(t) => setAddress({...address, uf: t})} maxLength={2} autoCapitalize="characters" />
        </Card>

        <Card>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>2. Dados Pessoais</Text>
          </View>
          
          <Input label="Nome Completo *" value={profile.nome} onChangeText={(t) => setProfile({...profile, nome: t})} />
          <Input label="CPF *" value={profile.cpf} onChangeText={(t) => setProfile({...profile, cpf: t})} keyboardType="number-pad" />
          <Input label="E-mail *" value={profile.email} onChangeText={(t) => setProfile({...profile, email: t})} keyboardType="email-address" autoCapitalize="none" />
          
          <Button title={editingId ? 'Atualizar Cadastro' : 'Salvar Cadastro'} onPress={handleSave} loading={loading} />
          {editingId && (
            <Button title="Cancelar Edição" variant="ghost" onPress={() => {
              setEditingId(null);
              setProfile({ nome: '', cpf: '', email: '' });
              setAddress({ cep: '', logradouro: '', numero: '', complemento: '', bairro: '', localidade: '', uf: '' });
            }} />
          )}
        </Card>
        
        <View style={{height: 40}} />
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingVertical: 16,
  },
  sectionHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
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

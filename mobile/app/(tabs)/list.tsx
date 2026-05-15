import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, Alert, ActivityIndicator, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { Container, Card, Button } from '../../components/UI';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RegistrationsListScreen() {
  const { dbType } = useAuth();
  const router = useRouter();
  
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRegistrations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/registrations', { params: { db: dbType } });
      setRegistrations(response.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha ao carregar registros.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRegistrations();
    }, [dbType])
  );

  const handleDelete = async (id: string) => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm('Tem certeza que deseja excluir este registro?');
      if (confirm) {
        try {
          await api.delete(`/api/registrations/${id}`, { params: { db: dbType } });
          loadRegistrations();
        } catch (e) {
          console.error(e);
          window.alert('Falha ao excluir.');
        }
      }
    } else {
      Alert.alert(
        'Excluir',
        'Tem certeza que deseja excluir este registro?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Excluir', 
            style: 'destructive',
            onPress: async () => {
              try {
                await api.delete(`/api/registrations/${id}`, { params: { db: dbType } });
                loadRegistrations();
              } catch (e) {
                console.error(e);
                Alert.alert('Erro', 'Falha ao excluir.');
              }
            }
          }
        ]
      );
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <Card style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{item.nome}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Ionicons name="card-outline" size={16} color="#94a3b8" />
        <Text style={styles.infoText}>{item.cpf}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Ionicons name="mail-outline" size={16} color="#94a3b8" />
        <Text style={styles.infoText}>{item.email}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={16} color="#94a3b8" />
        <Text style={styles.infoText} numberOfLines={2}>
          {item.logradouro}, {item.numero} {item.complemento ? `- ${item.complemento}` : ''}
          {'\n'}{item.bairro} - {item.localidade}/{item.uf} ({item.cep})
        </Text>
      </View>

      <View style={styles.actionRow}>
        <Button 
          title="Editar" 
          variant="secondary" 
          style={styles.actionBtn} 
          onPress={() => router.push({ pathname: '/', params: { editData: JSON.stringify(item) } })}
        />
        <Button 
          title="Excluir" 
          variant="danger" 
          style={styles.actionBtn}
          onPress={() => handleDelete(item._id || item.id)}
        />
      </View>
    </Card>
  );

  return (
    <Container>
      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={registrations}
          keyExtractor={(item) => item._id || item.id}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum registro encontrado.</Text>
          }
        />
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 16,
    width: '100%',
  },
  itemCard: {
    padding: 16,
  },
  itemHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 8,
    marginBottom: 12,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoText: {
    color: '#cbd5e1',
    marginLeft: 8,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12,
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 0,
  },
  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  }
});

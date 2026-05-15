import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Picker } from '@react-native-picker/picker'; // Precisamos instalar isso
import { Ionicons } from '@expo/vector-icons';

function HeaderRight() {
  const { dbType, setDbType, logout } = useAuth();

  return (
    <View style={styles.headerRight}>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={dbType}
          onValueChange={(itemValue) => setDbType(itemValue)}
          style={styles.picker}
          dropdownIconColor="#fff"
        >
          <Picker.Item label="MongoDB" value="mongodb" color={Platform.OS === 'ios' ? '#fff' : '#000'} />
          <Picker.Item label="SQLite" value="sqlite" color={Platform.OS === 'ios' ? '#fff' : '#000'} />
        </Picker>
      </View>
      <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
        <Ionicons name="log-out-outline" size={24} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );
}

export default function TabLayout() {
  const { user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#1e293b',
          borderTopColor: '#334155',
        },
        headerStyle: {
          backgroundColor: '#1e293b',
          borderBottomColor: '#334155',
          borderBottomWidth: 1,
        },
        headerTintColor: '#fff',
        headerRight: () => <HeaderRight />,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Novo Cadastro',
          headerTitle: `Olá, ${user?.username || ''}`,
          tabBarIcon: ({ color }) => <Ionicons name="add-circle-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: 'Registros',
          headerTitle: 'Seus Cadastros',
          tabBarIcon: ({ color }) => <Ionicons name="list-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  pickerContainer: {
    backgroundColor: '#334155',
    borderRadius: 8,
    marginRight: 12,
    height: 36,
    justifyContent: 'center',
    overflow: 'hidden',
    width: Platform.OS === 'web' ? 120 : 140,
  },
  picker: {
    color: '#fff',
    height: 36,
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  logoutBtn: {
    padding: 4,
  }
});

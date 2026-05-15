import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, ViewProps, TextInputProps, TouchableOpacityProps, StyleProp, ViewStyle } from 'react-native';

export const Container = ({ children, style }: { children: React.ReactNode, style?: StyleProp<ViewStyle> }) => (
  <View style={[styles.container, style]}>
    <View style={styles.webContainer}>
      {children}
    </View>
  </View>
);

export const Card = ({ children, style }: { children: React.ReactNode, style?: StyleProp<ViewStyle> }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

interface InputProps extends TextInputProps {
  label: string;
}

export const Input = ({ label, ...props }: InputProps) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      placeholderTextColor="#a1a1aa"
      {...props}
    />
  </View>
);

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export const Button = ({ title, loading, variant = 'primary', style, ...props }: ButtonProps) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary': return styles.btnSecondary;
      case 'danger': return styles.btnDanger;
      case 'ghost': return styles.btnGhost;
      default: return styles.btnPrimary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary': return styles.btnSecondaryText;
      case 'danger': return styles.btnDangerText;
      case 'ghost': return styles.btnGhostText;
      default: return styles.btnPrimaryText;
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.btn, getVariantStyle(), props.disabled && styles.btnDisabled, style]} 
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#000'} />
      ) : (
        <Text style={[styles.btnText, getTextStyle()]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Tailwind slate-900
    alignItems: 'center',
  },
  webContainer: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 800 : '100%',
    padding: 16,
  },
  card: {
    backgroundColor: '#1e293b', // Tailwind slate-800
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: '#94a3b8',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 12,
    color: '#f8fafc',
    fontSize: 16,
  },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  btnPrimary: {
    backgroundColor: '#3b82f6', // Tailwind blue-500
  },
  btnSecondary: {
    backgroundColor: '#475569',
  },
  btnDanger: {
    backgroundColor: '#ef4444',
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnPrimaryText: {
    color: '#ffffff',
  },
  btnSecondaryText: {
    color: '#ffffff',
  },
  btnDangerText: {
    color: '#ffffff',
  },
  btnGhostText: {
    color: '#3b82f6',
  },
});

import React from 'react';
import {
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';

export const colors = {
  petra: '#a4225f',
  petraDark: '#8a1a50',
  bg: '#f8fafc',
  card: '#ffffff',
  text: '#1e293b',
  muted: '#64748b',
  border: '#cbd5e1',
  danger: '#dc2626',
};

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#94a3b8" style={styles.input} {...props} />
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.button, (disabled || loading) && { opacity: 0.6 }]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, color: colors.muted, marginBottom: 6, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: colors.petra,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});

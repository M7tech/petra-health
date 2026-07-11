import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useI18n, Lang } from '../i18n';
import { colors } from '../ui';

const OPTIONS: { key: Lang; label: string }[] = [
  { key: 'en', label: 'English' },
  { key: 'ar', label: 'العربية' },
  { key: 'ku', label: 'کوردی' },
];

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();
  return (
    <View style={[styles.row, compact && styles.compact]}>
      {OPTIONS.map((o) => {
        const active = o.key === lang;
        return (
          <TouchableOpacity
            key={o.key}
            onPress={() => setLang(o.key)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.text, active && styles.textActive]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  compact: { gap: 6 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: { backgroundColor: '#fff', borderColor: colors.petra },
  text: { color: colors.muted, fontWeight: '600' },
  textActive: { color: colors.petra },
});

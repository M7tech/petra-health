import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { useI18n } from '@/i18n';
import { clearSelectRequest, takeSelectRequest } from '@/lib/select';
import { spacing, useTheme } from '@/theme';
import { Icon, InputField, EmptyState, Row, haptics } from '@/components/ui';

// A searchable single-choice list, presented as a sheet. Replaces the old
// scrolling wheels: searchable, native scrolling, works at any list length.
export default function SelectSheet() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [request] = useState(takeSelectRequest);
  const [query, setQuery] = useState('');

  useEffect(() => () => clearSelectRequest(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return request ? request.options.filter((o) => !q || o.label.toLowerCase().includes(q) || o.subtitle?.toLowerCase().includes(q)) : [];
  }, [request, query]);

  if (!request) return null;
  const searchable = request.options.length > 7;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: request.title }} />
      {searchable ? (
        <View style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
          <InputField value={query} onChangeText={setQuery} placeholder={t('ui.search')} autoCorrect={false} clearButtonMode="while-editing" />
        </View>
      ) : null}
      <FlatList
        data={filtered}
        keyExtractor={(o) => o.value}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={<EmptyState icon="search" title={t('ui.noResults')} />}
        renderItem={({ item, index }) => (
          <View style={{ backgroundColor: colors.surface, borderTopStartRadius: index === 0 ? 22 : 0, borderTopEndRadius: index === 0 ? 22 : 0, borderBottomStartRadius: index === filtered.length - 1 ? 22 : 0, borderBottomEndRadius: index === filtered.length - 1 ? 22 : 0, overflow: 'hidden' }}>
            {index > 0 ? <View style={{ height: 0.5, backgroundColor: colors.separator, marginStart: spacing.lg }} /> : null}
            <Row
              title={item.label}
              subtitle={item.subtitle}
              right={item.value === request.value ? <Icon name="check" size={18} color={colors.tint} weight="bold" /> : undefined}
              onPress={() => {
                haptics.select();
                request.onSelect(item.value);
                router.back();
              }}
            />
          </View>
        )}
      />
    </View>
  );
}

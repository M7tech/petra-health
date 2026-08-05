import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../ui';

export interface TabDef<K extends string> {
  key: K;
  label: string;
  icon: string;
}

// Floating pill-shaped bottom navigation bar.
export default function FloatingTabBar<K extends string>({
  tabs,
  active,
  onSelect,
  isRTL,
}: {
  tabs: TabDef<K>[];
  active: K;
  onSelect: (key: K) => void;
  isRTL?: boolean;
}) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={[styles.pill, isRTL && { flexDirection: 'row-reverse' }]}>
        {tabs.map((tb) => {
          const isActive = tb.key === active;
          return (
            <TouchableOpacity
              key={tb.key}
              style={styles.tab}
              onPress={() => onSelect(tb.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                <Text style={styles.icon}>{tb.icon}</Text>
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
                {tb.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 28,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: '#1e1b2e',
    borderRadius: 26,
    paddingHorizontal: 6,
    paddingVertical: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  // Every tab takes an equal share of the pill's width, so the row always
  // fits exactly regardless of how many tabs there are — no overflow.
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: colors.petra },
  icon: { fontSize: 15 },
  label: { color: 'rgba(255,255,255,0.55)', fontWeight: '600', fontSize: 10 },
  labelActive: { color: '#fff', fontWeight: '700' },
});

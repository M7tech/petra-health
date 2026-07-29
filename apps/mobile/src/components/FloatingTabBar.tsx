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
              {isActive && <Text style={styles.label}>{tb.label}</Text>}
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
    left: 16,
    right: 16,
    bottom: 28,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: '#1e1b2e',
    borderRadius: 32,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  tab: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row', paddingHorizontal: 8 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: colors.petra },
  icon: { fontSize: 18 },
  label: { color: '#fff', fontWeight: '700', fontSize: 12, marginLeft: 6 },
});

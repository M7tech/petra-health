import React, { useEffect, useRef } from 'react';
import { FlatList, NativeSyntheticEvent, NativeScrollEvent, StyleSheet, Text, View } from 'react-native';
import { colors } from '../ui';

const ITEM_HEIGHT = 40;
const VISIBLE_ROWS = 5; // odd, so the middle row is the selected one
const PAD = ITEM_HEIGHT * Math.floor(VISIBLE_ROWS / 2);

export interface WheelOption<T extends string | number> {
  label: string;
  value: T;
}

// Dependency-free iOS-style scrolling wheel (FlatList + snap), used for
// every "pick one from a list" spot in the app (date/time/country/city) —
// the native @react-native-picker/picker renders as a flat dropdown/dialog
// on Android, not a wheel, which is what this replaces.
export default function WheelPicker<T extends string | number>({
  options,
  selectedValue,
  onChange,
}: {
  options: WheelOption<T>[];
  selectedValue: T;
  onChange: (value: T) => void;
}) {
  const listRef = useRef<FlatList<WheelOption<T>>>(null);
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === selectedValue),
  );
  const scrollingFromTap = useRef(false);

  // Keep the wheel's scroll position in sync when the selection changes for
  // a reason other than the user scrolling this wheel (e.g. day count
  // shrinking when the month changes).
  useEffect(() => {
    if (scrollingFromTap.current) {
      scrollingFromTap.current = false;
      return;
    }
    listRef.current?.scrollToOffset({ offset: selectedIndex * ITEM_HEIGHT, animated: true });
  }, [selectedIndex]);

  function commitIndex(index: number) {
    const clamped = Math.min(options.length - 1, Math.max(0, index));
    const opt = options[clamped];
    if (opt && opt.value !== selectedValue) onChange(opt.value);
  }

  function handleMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    commitIndex(Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT));
  }

  function handleTap(index: number) {
    scrollingFromTap.current = true;
    listRef.current?.scrollToOffset({ offset: index * ITEM_HEIGHT, animated: true });
    commitIndex(index);
  }

  return (
    <View style={styles.wrap}>
      <View pointerEvents="none" style={styles.highlight} />
      <FlatList
        ref={listRef}
        data={options}
        keyExtractor={(o) => String(o.value)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
        initialScrollIndex={selectedIndex}
        contentContainerStyle={{ paddingVertical: PAD }}
        onMomentumScrollEnd={handleMomentumEnd}
        renderItem={({ item, index }) => {
          const active = item.value === selectedValue;
          return (
            <Text
              onPress={() => handleTap(index)}
              style={[styles.item, active && styles.itemActive]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: ITEM_HEIGHT * VISIBLE_ROWS, flex: 1 },
  highlight: {
    position: 'absolute',
    top: PAD,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  item: {
    height: ITEM_HEIGHT,
    lineHeight: ITEM_HEIGHT,
    textAlign: 'center',
    fontSize: 15,
    color: '#94a3b8',
  },
  itemActive: { color: colors.text, fontWeight: '700', fontSize: 17 },
});

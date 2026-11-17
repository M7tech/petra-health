import React, { ComponentProps } from 'react';
import { Platform, OpaqueColorValue } from 'react-native';
import { SymbolView, SFSymbol } from 'expo-symbols';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

type MaterialName = ComponentProps<typeof MaterialIcons>['name'];

// One semantic icon set. iOS renders the SF Symbol, Android the closest
// Material icon — never emoji, never an SF Symbol on Android.
const ICONS = {
  home: { sf: 'house.fill', md: 'home' },
  syringe: { sf: 'syringe.fill', md: 'vaccines' },
  chart: { sf: 'chart.line.uptrend.xyaxis', md: 'show-chart' },
  stethoscope: { sf: 'stethoscope', md: 'medical-services' },
  compass: { sf: 'safari.fill', md: 'explore' },
  person: { sf: 'person.crop.circle.fill', md: 'account-circle' },
  plus: { sf: 'plus', md: 'add' },
  check: { sf: 'checkmark', md: 'check' },
  checkCircle: { sf: 'checkmark.circle.fill', md: 'check-circle' },
  circle: { sf: 'circle', md: 'radio-button-unchecked' },
  chevronRight: { sf: 'chevron.right', md: 'chevron-right' },
  chevronLeft: { sf: 'chevron.left', md: 'chevron-left' },
  chevronDown: { sf: 'chevron.down', md: 'expand-more' },
  close: { sf: 'xmark', md: 'close' },
  bell: { sf: 'bell.fill', md: 'notifications' },
  clock: { sf: 'clock.fill', md: 'schedule' },
  flame: { sf: 'flame.fill', md: 'local-fire-department' },
  drop: { sf: 'drop.fill', md: 'water-drop' },
  fork: { sf: 'fork.knife', md: 'restaurant' },
  walk: { sf: 'figure.walk', md: 'directions-walk' },
  bed: { sf: 'bed.double.fill', md: 'hotel' },
  thermo: { sf: 'thermometer.medium', md: 'device-thermostat' },
  snowflake: { sf: 'snowflake', md: 'ac-unit' },
  shield: { sf: 'checkmark.shield.fill', md: 'verified-user' },
  warning: { sf: 'exclamationmark.triangle.fill', md: 'warning' },
  alert: { sf: 'exclamationmark.circle.fill', md: 'error' },
  phone: { sf: 'phone.fill', md: 'call' },
  directions: { sf: 'arrow.triangle.turn.up.right.circle.fill', md: 'directions' },
  location: { sf: 'location.fill', md: 'my-location' },
  book: { sf: 'book.fill', md: 'menu-book' },
  map: { sf: 'map.fill', md: 'map' },
  pin: { sf: 'mappin.and.ellipse', md: 'place' },
  scale: { sf: 'scalemass.fill', md: 'monitor-weight' },
  pill: { sf: 'pills.fill', md: 'medication' },
  calendar: { sf: 'calendar', md: 'event' },
  message: { sf: 'message.fill', md: 'chat' },
  send: { sf: 'arrow.up.circle.fill', md: 'send' },
  arrowUp: { sf: 'arrow.up', md: 'arrow-upward' },
  gear: { sf: 'gearshape.fill', md: 'settings' },
  globe: { sf: 'globe', md: 'language' },
  lock: { sf: 'lock.fill', md: 'lock' },
  trash: { sf: 'trash', md: 'delete' },
  info: { sf: 'info.circle.fill', md: 'info' },
  news: { sf: 'newspaper.fill', md: 'newspaper' },
  school: { sf: 'graduationcap.fill', md: 'school' },
  heart: { sf: 'heart.fill', md: 'favorite' },
  logout: { sf: 'rectangle.portrait.and.arrow.right', md: 'logout' },
  search: { sf: 'magnifyingglass', md: 'search' },
  target: { sf: 'target', md: 'track-changes' },
  alarm: { sf: 'alarm.fill', md: 'alarm' },
  bars: { sf: 'chart.bar.fill', md: 'bar-chart' },
  play: { sf: 'play.fill', md: 'play-arrow' },
} as const satisfies Record<string, { sf: SFSymbol; md: MaterialName }>;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  size = 22,
  color,
  weight = 'medium',
}: {
  name: IconName;
  size?: number;
  color: string | OpaqueColorValue;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
}) {
  const def = ICONS[name];
  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name={def.sf}
        size={size}
        weight={weight}
        tintColor={color as string}
        resizeMode="scaleAspectFit"
        style={{ width: size, height: size }}
      />
    );
  }
  return <MaterialIcons name={def.md} size={size} color={color as string} />;
}

/** SF / Material names for native tab + toolbar APIs. */
export const iconNames = ICONS;

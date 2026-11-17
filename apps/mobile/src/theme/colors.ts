import { useColorScheme } from 'react-native';

// Semantic palette. Values mirror Apple's system colors (light / dark) so the
// app reads as native on iOS, and double as a Material-neutral palette on
// Android. Petra magenta is the single accent ("tint").
export interface Palette {
  /** Grouped background — the canvas behind everything. */
  background: string;
  /** Cells / cards sitting on the canvas. */
  surface: string;
  /** Sheets and anything floating above `surface`. */
  surfaceRaised: string;
  /** Subtle fill for inputs, chips and tracks. */
  fill: string;
  label: string;
  secondaryLabel: string;
  tertiaryLabel: string;
  separator: string;
  tint: string;
  tintSoft: string;
  onTint: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  /** Secondary brand colour (patient-guide accents). */
  violet: string;
  violetSoft: string;
  /** Scrim behind sheets and menus. */
  scrim: string;
}

export const lightPalette: Palette = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  fill: 'rgba(120,120,128,0.12)',
  label: '#000000',
  secondaryLabel: 'rgba(60,60,67,0.62)',
  tertiaryLabel: 'rgba(60,60,67,0.32)',
  separator: 'rgba(60,60,67,0.2)',
  tint: '#A4225F',
  tintSoft: 'rgba(164,34,95,0.10)',
  onTint: '#FFFFFF',
  success: '#248A3D',
  successSoft: 'rgba(52,199,89,0.14)',
  warning: '#B25000',
  warningSoft: 'rgba(255,149,0,0.16)',
  danger: '#D70015',
  dangerSoft: 'rgba(255,59,48,0.12)',
  info: '#0A6CD6',
  infoSoft: 'rgba(0,122,255,0.12)',
  violet: '#63338A',
  violetSoft: 'rgba(99,51,138,0.10)',
  scrim: 'rgba(0,0,0,0.4)',
};

export const darkPalette: Palette = {
  background: '#000000',
  surface: '#1C1C1E',
  surfaceRaised: '#2C2C2E',
  fill: 'rgba(120,120,128,0.24)',
  label: '#FFFFFF',
  secondaryLabel: 'rgba(235,235,245,0.62)',
  tertiaryLabel: 'rgba(235,235,245,0.3)',
  separator: 'rgba(84,84,88,0.65)',
  tint: '#F0709F',
  tintSoft: 'rgba(240,112,159,0.18)',
  onTint: '#2A0A1A',
  success: '#30D158',
  successSoft: 'rgba(48,209,88,0.18)',
  warning: '#FF9F0A',
  warningSoft: 'rgba(255,159,10,0.18)',
  danger: '#FF453A',
  dangerSoft: 'rgba(255,69,58,0.18)',
  info: '#64B5FF',
  infoSoft: 'rgba(10,132,255,0.2)',
  violet: '#C8A2EB',
  violetSoft: 'rgba(200,162,235,0.16)',
  scrim: 'rgba(0,0,0,0.6)',
};

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? darkPalette : lightPalette;
}

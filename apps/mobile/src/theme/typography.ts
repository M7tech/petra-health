import type { TextStyle } from 'react-native';

// Apple's text-style ramp. Sizes scale with the user's Dynamic Type / font
// scale setting (allowFontScaling stays on); line heights are explicit so
// wrapped text keeps a calm rhythm.
export const type = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700', letterSpacing: 0.4 },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: 0.36 },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: 0.35 },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600', letterSpacing: 0.38 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.4 },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400', letterSpacing: -0.4 },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400', letterSpacing: -0.3 },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400', letterSpacing: -0.2 },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: -0.1 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400', letterSpacing: 0 },
  /** Small uppercase-style section labels. */
  overline: { fontSize: 13, lineHeight: 18, fontWeight: '600', letterSpacing: 0.2 },
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

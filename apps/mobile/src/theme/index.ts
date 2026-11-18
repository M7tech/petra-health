import { useMemo } from 'react';
import { usePalette } from './colors';

export * from './colors';
export * from './typography';
export * from './tokens';
export * from './mode';

/** Everything a component needs to style itself for the current scheme. */
export function useTheme() {
  const colors = usePalette();
  return useMemo(() => ({ colors }), [colors]);
}

import { Platform } from 'react-native';
import { useTheme } from '@/theme';

// One header language for every tab stack.
//  iOS     — transparent bar over a collapsing large title (Liquid Glass edge on iOS 26)
//  Android — Material top app bar on the grouped background
export function useStackOptions() {
  const { colors } = useTheme();
  if (Platform.OS === 'ios') {
    return {
      headerTransparent: true,
      headerShadowVisible: false,
      headerLargeTitleEnabled: true,
      headerLargeTitleShadowVisible: false,
      headerLargeStyle: { backgroundColor: 'transparent' },
      headerBlurEffect: 'none',
      headerTintColor: colors.tint,
      headerTitleStyle: { color: colors.label },
      headerLargeTitleStyle: { color: colors.label },
      headerBackButtonDisplayMode: 'minimal',
      contentStyle: { backgroundColor: colors.background },
    } as const;
  }
  return {
    headerShadowVisible: false,
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.label,
    headerTitleStyle: { color: colors.label, fontWeight: '600' as const },
    contentStyle: { backgroundColor: colors.background },
  } as const;
}

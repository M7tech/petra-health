import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { radius, spacing, useTheme } from '@/theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { Icon, IconName } from './Icon';

/** First-load state — never show "empty" while this is resolving. */
export function LoadingState() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: spacing.xl }}>
      <ActivityIndicator size="large" color={colors.tint} accessibilityLabel="Loading" accessibilityLiveRegion="polite" />
    </View>
  );
}

/** Full-screen failure — distinct from "no data yet", with a retry. */
export function ErrorState({ message, onRetry, retryLabel }: { message: string; onRetry: () => void; retryLabel: string }) {
  return <EmptyState icon="alert" title={message} actionLabel={retryLabel} onAction={onRetry} />;
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.tintSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={28} color={colors.tint} />
      </View>
      <AppText variant="title3" style={{ textAlign: 'center' }}>
        {title}
      </AppText>
      {message ? (
        <AppText variant="subhead" tone="secondary" style={{ textAlign: 'center' }}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} variant="tinted" size="md" fullWidth={false} /> : null}
    </View>
  );
}

/** Inline banner for failures (form save, load error with retry). */
export function Banner({
  message,
  tone = 'danger',
  onRetry,
  retryLabel,
}: {
  message: string;
  tone?: 'danger' | 'success' | 'info';
  onRetry?: () => void;
  retryLabel?: string;
}) {
  const { colors } = useTheme();
  const map = { danger: [colors.dangerSoft, colors.danger, 'alert'], success: [colors.successSoft, colors.success, 'checkCircle'], info: [colors.infoSoft, colors.info, 'info'] } as const;
  const [bg, fg, icon] = map[tone];
  return (
    <View
      accessibilityRole="alert"
      style={{ backgroundColor: bg, borderRadius: radius.lg, borderCurve: 'continuous', padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
    >
      <Icon name={icon} size={20} color={fg} />
      <AppText variant="subhead" style={{ flex: 1, color: fg }} selectable>
        {message}
      </AppText>
      {onRetry ? (
        <Button title={retryLabel ?? 'Retry'} onPress={onRetry} variant="plain" size="sm" fullWidth={false} />
      ) : null}
    </View>
  );
}

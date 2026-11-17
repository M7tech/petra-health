import React from 'react';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';

// Five tabs — the iPhone tab-bar maximum and Material's. Native on both:
// UITabBar (Liquid Glass on iOS 26) and the Material 3 navigation bar.
export default function TabLayout() {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <NativeTabs tintColor={colors.tint} minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="(today)">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label>{t('ui.tabToday')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(treatment)">
        <NativeTabs.Trigger.Icon sf={{ default: 'syringe', selected: 'syringe.fill' }} md="vaccines" />
        <NativeTabs.Trigger.Label>{t('ui.tabTreatment')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(progress)">
        <NativeTabs.Trigger.Icon sf="chart.line.uptrend.xyaxis" md="show_chart" />
        <NativeTabs.Trigger.Label>{t('ui.tabProgress')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(care)">
        <NativeTabs.Trigger.Icon sf={{ default: 'stethoscope', selected: 'stethoscope' }} md="medical_services" />
        <NativeTabs.Trigger.Label>{t('ui.tabCare')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(discover)">
        <NativeTabs.Trigger.Icon sf={{ default: 'safari', selected: 'safari.fill' }} md="explore" />
        <NativeTabs.Trigger.Label>{t('ui.tabDiscover')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

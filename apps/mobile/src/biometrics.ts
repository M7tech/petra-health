import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ENABLED_KEY = 'petra_biometric_enabled';

export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && enrolled;
}

export async function isBiometricEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(ENABLED_KEY)) === '1';
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(ENABLED_KEY, enabled ? '1' : '0');
}

export async function authenticate(): Promise<boolean> {
  const res = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock Petra Health',
    fallbackLabel: 'Use passcode',
    disableDeviceFallback: false,
  });
  return res.success;
}

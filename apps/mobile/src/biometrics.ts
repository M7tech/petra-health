import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

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
    promptMessage: 'Unlock Semetra',
    fallbackLabel: 'Use passcode',
    disableDeviceFallback: false,
  });
  return res.success;
}

// ---- Fingerprint / Face sign-in ----
// The email and password live only in the phone's secure storage (Keychain /
// Keystore) and are read back only after a successful biometric check.
const CRED_KEY = 'petra_saved_login';

export async function saveCredentials(email: string, password: string): Promise<void> {
  await SecureStore.setItemAsync(CRED_KEY, JSON.stringify({ email, password }));
}

export async function loadCredentials(): Promise<{ email: string; password: string } | null> {
  try {
    const raw = await SecureStore.getItemAsync(CRED_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function clearCredentials(): Promise<void> {
  await SecureStore.deleteItemAsync(CRED_KEY).catch(() => {});
}

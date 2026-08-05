import AsyncStorage from '@react-native-async-storage/async-storage';

// Falls back to the live Render API (not a local-only address) so a build
// still works even if EXPO_PUBLIC_API_URL isn't injected — EAS cloud builds
// clone fresh from git and never see a local, gitignored .env file, so this
// fallback needs to be safe for a real device, not just local `expo start`.
const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://petra-health-api.onrender.com';
const TOKEN_KEY = 'petra_token';

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}
export async function setToken(token: string | null) {
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = Array.isArray(body.message) ? body.message.join(', ') : body.message ?? message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

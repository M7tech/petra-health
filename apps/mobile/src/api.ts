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
  // Read as text first — Render's proxy occasionally returns an empty body
  // (cold start, gateway timeout) even with a 200/OK status, and res.json()
  // on an empty string throws "Unexpected end of input" instead of a
  // meaningful error.
  const text = await res.text();
  const body = text ? safeJsonParse(text) : undefined;

  if (!res.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body
        ? Array.isArray((body as { message: unknown }).message)
          ? (body as { message: string[] }).message.join(', ')
          : String((body as { message: unknown }).message)
        : res.statusText || 'Request failed';
    throw new Error(message);
  }
  return body as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

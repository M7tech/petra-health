import { useAuth } from '@/auth';
import { useConfig } from '@/config';

export type Gate = 'auth' | 'setup' | 'app';

/** Which part of the app the current user may see — drives route guards and fallbacks. */
export function useGate(): Gate {
  const { user } = useAuth();
  const { doctorFeatures } = useConfig();
  if (!user) return 'auth';
  return !user.cityId || (doctorFeatures && !user.doctorId) ? 'setup' : 'app';
}

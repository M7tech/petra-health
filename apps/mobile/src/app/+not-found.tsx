import React from 'react';
import { Redirect } from 'expo-router';
import { LoadingState } from '@/components/ui';
import { useAuth } from '@/auth';
import { useGate } from '@/lib/gate';

// Any path that doesn't resolve (a link into a screen the user can't open yet,
// or a guard flipping after sign-in) lands on the right home instead of an error page.
export default function NotFound() {
  const { loading } = useAuth();
  const gate = useGate();
  if (loading) return <LoadingState />;
  return <Redirect href={gate === 'auth' ? '/login' : gate === 'setup' ? '/onboarding' : '/(tabs)/(today)'} />;
}

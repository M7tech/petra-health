import React from 'react';
import { Redirect } from 'expo-router';
import { LoadingState } from '@/components/ui';
import { useAuth } from '@/auth';
import { useGate } from '@/lib/gate';

// "/" is the app's real entry (cold start, deep link, post-login replace). It
// always resolves here and forwards by sign-in / setup state, so no other route
// (e.g. the picker sheet) can be picked as the fallback start screen.
export default function Index() {
  const { loading } = useAuth();
  const gate = useGate();
  if (loading) return <LoadingState />;
  return <Redirect href={gate === 'auth' ? '/login' : gate === 'setup' ? '/onboarding' : '/today'} />;
}

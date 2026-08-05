import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, ScrollViewProps } from 'react-native';

// Wraps a screen's ScrollView so a focused TextInput near the bottom
// doesn't end up hidden behind the on-screen keyboard.
export default function KeyboardScreen({ children, ...scrollViewProps }: ScrollViewProps) {
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" {...scrollViewProps}>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

# Petra Health

## UI & animation rules

These apply to the mobile app (`apps/mobile`).

- Use `react-native-reanimated` (UI thread), not the `Animated` API from `react-native`.
- Every animation must serve feedback, orientation or continuity. No decoration.
- Respect reduced motion (`useReducedMotion`) with a non-animated fallback.
- Interactions under 300 ms; screen transitions under 400 ms.
- Use the existing haptics helper in `src/components/ui/haptics.ts` for press feedback. Don't call `expo-haptics` directly.
- Health data screens: clarity over flair. Never delay reading critical values.

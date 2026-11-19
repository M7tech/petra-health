# Android safe areas, status bar and display cutouts

## Environment audited

| Item | Value |
|---|---|
| Expo SDK / React Native | 58 / 0.88.1 (target API 36) |
| Navigation | Expo Router 58 → native stack (`react-native-screens` 4.30.1) + `NativeTabs` |
| Insets library | `react-native-safe-area-context` 5.11.1 (Expo Router already wraps the app in `SafeAreaProvider`) |
| Keyboard | `react-native-keyboard-controller` 1.22.7 (auto-detects edge-to-edge and sets its translucent flags itself) |
| Edge-to-edge | Always on in SDK 58 (there is no `edgeToEdgeEnabled` option any more; nothing to configure in `app.json`) |
| Deprecated APIs | None used: no `StatusBar.backgroundColor` / `translucent`, no `androidStatusBar` / `navigationBar` config, no `StatusBar.currentHeight` |

## Root cause

Since Android 15 every app is drawn edge-to-edge: the system no longer pads the app for the status bar, the front-camera cutout or the navigation bar. iOS does that padding automatically through `contentInsetAdjustmentBehavior="automatic"`; Android ignores that prop. The app's shared `Screen` component relied on it and **never read the real insets on Android**, so:

1. Screens with **no native header** (login, sign-up, onboarding) started at y = 0 under the status bar and camera cutout, held off only by a **fixed `paddingTop` of 80 dp**. That happens to clear the status bar on devices with a short bar (Samsung One UI) but not on devices whose status bar + cutout is taller, or whose OS reports the cutout inset differently (the reported Xiaomi symptom).
2. Every screen used a **fixed bottom padding (48 dp)** with no navigation-bar inset, so content could sit under 3-button navigation.
3. The lock overlay (`BiometricGate`) was a full-window view with no insets.
4. The status-bar icon colour followed the app theme, but the window background behind the transparent bars did not, so an app dark/light override could leave a mismatched background.

Both native libraries already include the display cutout in their inset maths (`displayCutout | systemBars`), and the native-stack header already clears the status bar and cutout. So **headers rendered by Expo Router / React Navigation were not changed** — the gap was in the app's own screens.

## Changes (all cross-device; nothing Xiaomi-specific)

| File | Change |
|---|---|
| `src/components/ui/Screen.tsx` | Reads `useSafeAreaInsets()` (status bar + cutout + system bars, as reported by the device). Android: bottom / left / right insets always applied; **top inset applied only when `headerless`** so a native header is never padded twice. Values never go below the original design spacing (`max(original, inset + gutter)`), so the existing look on devices that already worked is unchanged. Left/right are mapped to logical start/end for RTL. iOS behaviour is untouched. |
| `src/app/(auth)/login.tsx`, `signup.tsx`, `src/app/onboarding.tsx` | Pass `headerless` (the only screens with no native header). Fixed 80 dp stays as the minimum; the real inset wins when larger. |
| `src/BiometricGate.tsx` | Lock overlay padding includes the real insets. |
| `src/app/_layout.tsx` | `ThemedStatusBar` also sets the window background (`expo-system-ui`, non-deprecated) to the app background, and icons follow the app's own light/dark choice. |

Not changed: business logic, navigation structure, colours, typography, headers of tab/stack/sheet screens, `app.json`.

## Review of every screen type

| Screen | Handling |
|---|---|
| Splash | System splash (Android 12+ `SplashScreen` API) — not app-drawn; no inset work needed |
| Login, sign-up, onboarding | `headerless` → status bar / cutout inset applied by `Screen` |
| Tabs (Today, Treatment, Progress, Care, Discover) | Native stack header handles top; `Screen` adds bottom inset only; bottom tab bar handles its own inset |
| Training hub + modules | Native stack header; `Screen` bottom inset |
| Sheets (profile, guide, selectors, log forms) | `formSheet` with native header; sheet code already uses `systemBars | displayCutout` |
| Lock screen overlay | Insets applied |
| Quick-add button | Positioned inside the tab content area (above the tab bar) |
| Map (WebView in a card) | Normal flow content |

## Devices and versions still requiring real testing

I could not test on a Xiaomi device, so the Xiaomi behaviour above is the most probable cause, **not** confirmed on hardware. Please verify on:

| Device class | OS | What to check |
|---|---|---|
| Xiaomi / Redmi / POCO (centre punch-hole, waterdrop and wide notch models) | HyperOS 1/2 (Android 14, 15) and MIUI 14 (Android 13) | Login, sign-up, onboarding top spacing; header on every tab; lock screen; status-bar icon visibility in light and dark |
| Samsung Galaxy (S24 / A-series) | One UI 6.1 (Android 14), One UI 7 (Android 15) | No regression vs. before (spacing unchanged where it already worked) |
| Google Pixel | Android 15 and Android 16 | Enforced edge-to-edge, gesture navigation and 3-button navigation |
| Any phone with a top-corner or top-edge cutout, and a tall status bar | Android 14–16 | Content never under the cutout |
| Tablet / foldable (≥ 600 dp) | Android 16 | Portrait lock is ignored there: check landscape, side cutouts, and no clipped content |
| Accessibility | all | System font scale 1.3+, "Display size" large, RTL (Arabic/Kurdish), app Light/Dark override vs. the phone's theme |

Android Emulator / AOSP devices can simulate cutouts for a quick check:

```bash
adb shell cmd overlay enable com.android.internal.display.cutout.emulation.tall     # or: corner, double, narrow, wide, hole
adb shell cmd overlay disable com.android.internal.display.cutout.emulation.tall
```

(Samsung and Xiaomi builds may not ship these overlays; use real devices there.)

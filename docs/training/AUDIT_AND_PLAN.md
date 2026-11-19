# Semetra training modules — audit, architecture, status

## Phase 1 — Audit (done)

| Item | Finding |
|---|---|
| Project | `apps/mobile` — Expo SDK 58, React Native 0.88.1, React 19.3, Expo Router 58, TypeScript |
| Identifiers | iOS `com.petrapharma.health`, Android `com.petrapharma.health` (unchanged) |
| Already installed | `react-native-svg` 15.16, `react-native-reanimated` 4.7.1 (+ worklets 0.13), `react-native-gesture-handler` 3.3, `expo-haptics`, `expo-image`, AsyncStorage |
| Not installed | Skia, Lottie, Rive, expo-gl / three, expo-audio / expo-speech, expo-sqlite, i18next |
| i18n | `i18n-js` with EN / AR / KU and real RTL via `I18nManager` (kept; no second i18n library added) |
| EAS | `preview` (APK) and `production` (AAB by default) profiles, `appVersionSource: local` |
| Source PDF | `Final portrait semetra .pdf`, 20 pages, Arabic + Kurdish pairs of one guide (cover p.1, pens p.2–3, schedule p.4–5, sites p.6–7, steps p.8–11, weekly use p.12, tracking p.13, missed dose p.14–15, storage p.16, side effects p.17–18, video QR p.19) |

The guide's content was already partly in the app (`guide.*` strings). The training area reuses those exact strings for the step text, so there is one source of truth for the manufacturer's wording.

## Architecture decisions and tradeoffs

1. **No new native modules.** Everything is built with plain React Native Views, Reanimated and the existing haptics stack (`react-native-svg` is installed but was not needed). This keeps the production build identical in risk to the current one and needs no new dev-client. *Tradeoff:* no GPU-rendered scenes.
2. **No true 3D pen, body or refrigerator.** There is no 3D model of the Semetra pen or any approved anatomy asset, and the brief forbids inventing pen mechanics, site boundaries, depths or angles. Instead the app uses the **real product photographs and the manufacturer's own step photos** from the PDF, animated with Reanimated (cross-fades, slow zoom, progress, pulsing site markers), plus a schematic cross-section. A 3D pipeline (Skia / expo-gl) can be added later once approved assets exist.
3. **Open without an account.** `app/training/*` sits outside the sign-in guards in `app/_layout.tsx`; progress is stored locally (`petra_training_v1`), keyed by module and never by language, so switching language keeps progress.
4. **Reduced motion respected** in every animation (`useReducedMotion`); animations that fail to start leave content visible (no layout-animation fades that can stick at opacity 0).
5. **Education only.** No dose calculators; missed-dose and storage tools are labelled as illustrations; multiple missed doses and temperature excursions direct the user to a doctor or pharmacist.

## Module status

| # | Module | Status |
|---|---|---|
| 1 | Dose & usage | Built: real box photos, touch 8-week timeline, mg vs ml, once-a-week animation, after-week-8 per guide |
| 2 | Places of injection | Built: body diagram with pulsing markers, site chips, animated skin / fat / muscle cross-section with needle, rotate-spot demo. **Not built:** rotatable 3D model, pinch-zoom/rotate gestures |
| 3 | How to inject | Built: 18 real step photos in 5 chapters, play / pause / replay / previous / next, safety notes. **Not built:** 3D pen, close-up dose-selector simulation, audio narration |
| 4 | Missed or late dose | Built: weekday + day-offset calendar, take / skip / double-dose rules, scenario shortcuts |
| 5 | Storage | Built: fridge illustration, draggable thermometer with zones for new vs in-use pen, cap-on/off light check, optional 8-week tracker. **Not built:** 3D fridge |
| — | Quizzes | 2 questions per module (EN/AR/KU), stored completion + best score |
| — | Localisation | EN / AR / KU strings (all pending human review) |

## Not done yet (honest list)

- Audio narration (needs `expo-audio` + recorded Arabic/Kurdish audio — a native module and an asset decision).
- True 3D / Skia scenes and pinch-zoom/rotate gestures on the body model.
- Arabic as the *default* language for new installs (currently follows the phone; changing it would flip existing English testers to RTL — decide before release).
- Real-device benchmarking of the new screens on iPhone and a mid-range Android (only web-previewed so far).
- Store assets: privacy policy URL, screenshots, store metadata, iOS build (needs Apple developer account), Play Data Safety / health declaration.
- Clinical sign-off (see `MEDICAL_REVIEW.md`).

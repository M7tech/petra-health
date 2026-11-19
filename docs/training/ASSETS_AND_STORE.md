# Assets, licenses and store checklist

## Asset register

| Asset | Path | Source | License / permission |
|---|---|---|---|
| Semetra 1.5 ml box photo | `apps/mobile/assets/training/box-1-5.jpg` | Cropped from p.2 of the Petra Pharma patient guide PDF | Owned by Petra Pharma — **written permission to publish required** |
| Semetra 3 ml box photo | `apps/mobile/assets/training/box-3.jpg` | Cropped from p.2 of the same PDF | same |
| 18 injection step photos | `apps/mobile/assets/guide/steps/step-1…18.png` | Cropped (3× upscaled) from p.8–9 of the guide | same |
| Injection-site diagram | `apps/mobile/assets/guide/guide-sites.png` | p.6 of the guide | same |
| Step posters | `apps/mobile/assets/guide/guide-steps-1/2.png` | p.8–9 of the guide | same |
| Cross-section, fridge, thermometer, pen graphics | drawn in code (`training/CrossSection.tsx`, `app/training/storage.tsx`) | Original, schematic | Project-owned |

Not used: Petra Pharma / Diabetes360 logos, the cover photograph of a person (model release unknown).

## Production configuration (unchanged by this work)

- Bundle / package id: `com.petrapharma.health` · version in `apps/mobile/app.json` (`version`, `android.versionCode`; iOS build number is managed by EAS).
- `eas.json`: `preview` = APK (internal), `production` = store build with `autoIncrement`.
- New native dependencies introduced by this feature: **none**.

## Commands (run from `apps/mobile`)

```bash
npm install
npx expo start                                   # JS only; use a dev build for native modules
eas build -p android --profile preview           # APK for device testing
eas build -p android --profile production        # AAB for Google Play
eas build -p ios --profile production            # needs an Apple developer account
eas submit -p android --profile production
eas submit -p ios --profile production
```

## Store checklist (nothing below is done yet)

- [ ] Medical review signed off (`MEDICAL_REVIEW.md`), Arabic / Kurdish verified
- [ ] Petra Pharma written permission for branding and photos
- [ ] Privacy policy URL (training area collects nothing; the signed-in app uses the API — disclose accordingly)
- [ ] Apple: App Privacy answers, TestFlight round, screenshots, metadata, medical-app review notes
- [ ] Google: Data Safety form, Health apps declaration, closed testing track, adaptive icon check, target API level
- [ ] Real-device test on an iPhone and a mid-range Android (performance, memory, font scaling, RTL, reduced motion)
- [ ] Decide default language (Arabic) for new installs
- [ ] Add audio narration only after recorded, reviewed audio exists

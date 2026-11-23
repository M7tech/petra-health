# Nutrition guide (Semetra)

Source: `Semetra-Nutrition-Guide-Arabic.pdf` (8 pages, content dated November 2026). Open to everyone, no account (like the training area).

## Where things are

| What | Where |
|---|---|
| Screens | `apps/mobile/src/app/nutrition/` (hub, plate, foods, daily, comfort, week, sources) |
| Text (EN / AR / KU) | `apps/mobile/src/i18n/nutritionStrings.ts`, namespace `nutri` |
| 3D-style illustrations | `apps/mobile/src/nutrition/Illustrations.tsx` (vector shapes with highlight and shadow; plate tilts and drifts; still when Reduce Motion is on) |
| Real photos (optional) | `apps/mobile/src/nutrition/photos.ts`, files in `apps/mobile/assets/nutrition/photos/` |
| Entry points | Discover tab row, and a button on the login screen |

## Status: pending medical review

- **Arabic** was rebuilt from the PDF. The PDF's text layer is damaged (dropped lam letters, swapped letters, reversed digits), so the text was re-typed and the weekly pages (Saturday, Sunday) checked against the rendered pages. Please proof the rest against the PDF.
- **Kurdish (Sorani)** is a draft translation; it needs a native medical reader.
- **English** is a faithful translation.
- The PDF still prints the old spelling "سمترا"; the app uses "سيميترا".
- Claims to be confirmed by a clinician or dietitian before release: protein 20–30 g per main meal; fluids 2–3 L a day (8–12 cups); 150 minutes of activity a week plus 2–3 strength sessions; avoid alcohol; the ginger-tea and reflux advice; the weekly portion examples. The kidney / heart-failure caution is kept as in the source.
- The source says calorie, fat and carbohydrate figures were deliberately not used; the app does not show any.
- The guide is general GLP-1 nutrition advice, not Semetra-specific; it makes no dose claims.

## Adding real photos

1. Put the image in `assets/nutrition/photos/` (JPEG, about 1200 px wide).
2. Register it in `photos.ts`, e.g. `plate: require('../../assets/nutrition/photos/plate.jpg'),`.
3. Keys: `plate`, `foods`, `daily`, `comfort`, and one per meal `d1-b`, `d1-l`, `d1-s`, `d1-d` … `d7-d` (breakfast, lunch, snack, dinner; days 1–7 = Saturday–Friday).

A key with no photo shows the illustration, so nothing breaks while photos are missing.

## Not done

- True 3D (a rotatable model) would need a native 3D module; the illustrations are 3D-styled vector art instead.
- No photos are bundled: none were supplied, and stock photos need a licence.

# Medical review checklist — Semetra training modules

**Status of everything below: PENDING MEDICAL REVIEW.** Nothing is signed off. Do not publish until a clinician initials each row and a native medical translator verifies Arabic and Kurdish (Sorani).

Primary source: official Semetra patient guide, Petra Pharma, `Final portrait semetra .pdf` (20 pages).

| # | Statement in the app | Source (guide page) | Where in code | Reviewer / date |
|---|---|---|---|---|
| 1 | Both pens contain 1.34 mg of medicine per 1 ml | p.2 | `train.dose.mgBody`, `guide.concentration` | |
| 2 | 1.5 ml pen: 4 doses of 0.25 mg then 2 doses of 0.5 mg, **or** 4 doses of 0.5 mg; lasts 6 or 4 weeks | p.2 | `guide.pen15*` | |
| 3 | 3 ml pen: 4 doses of 1 mg; lasts 4 weeks | p.2 | `guide.pen3*` | |
| 4 | Weeks 1–4: 0.25 mg weekly (first box); weeks 5–6: 0.5 mg (same box); weeks 7–8: 0.5 mg (second box) | p.4 | `training/dose.tsx` `weekInfo` | |
| 5 | After week 8 the doctor chooses: continue 0.5 mg (1.5 ml box) or move to 1 mg (3 ml box) | p.4 | `guide.after8*`, `train.dose.physician` | |
| 6 | Once a week, same day if possible, any time of day, with or without food | p.12 | `train.dose.onceBody` | |
| 7 | Recommended sites: abdomen around the navel, upper arms, front of thighs; change spot within the same area | p.6 | `guide.site*`, `train.sites.*` | |
| 8 | Semetra is for **subcutaneous** use (box) — the cross-section shows skin, fat layer, muscle. **Layer thicknesses, needle length and angle are illustrative only and are NOT from the guide.** Needle is drawn straight in like the guide's step-12 picture | box; p.9 step 12 | `training/CrossSection.tsx` | |
| 9 | 18 injection steps and their order | p.8–9 | `guide.step1…18`, `training/content.ts` `CHAPTERS` | |
| 10 | Flow check is for a new pen only; dose counter returns to 0; a drop appears at the needle tip | p.8 steps 7–9 | `train.inject.newPenOnly` | |
| 11 | Keep pressing the dose button and count slowly to 6 with the needle in the skin | p.9 step 14 | `train.inject.count6` | |
| 12 | Used needle goes in a sharps / puncture-resistant container; pen cap back on | p.9 steps 17–18 | `train.inject.sharps` | |
| 13 | Missed dose: ≤5 days after due day → use it when remembered, then next dose on the usual day; >5 days → skip, next dose on the usual day; never a double dose | p.14 | `training/missed.tsx` `ruleOf` | |
| 14 | Day 6 is treated as ">5 days" (skip). Day 0 = due day, day 7 = next dose | p.14 (diagram) | `ruleOf` | |
| 15 | Multiple missed doses / long break → ask doctor or pharmacist; do not restart or escalate alone. **Not in the guide — added as a safety message.** | — | `train.missed.multiple` | |
| 16 | Unopened pen: refrigerator 2–8 °C, away from the cooling element, do not freeze, keep cap on (light) | p.16 | `guide.beforeBody`, thermometer zones | |
| 17 | In-use pen: up to 8 weeks below 30 °C **or** in the refrigerator 2–8 °C; do not freeze; do not use if frozen | p.16 | `guide.duringBody`, `zoneOf()` | |
| 18 | Do not use after the expiry date (last day of the month); keep out of reach of children | p.16 | `train.storage.expiry/kids` | |
| 19 | Temperature zones: <0 °C "frozen", 0–2 °C "colder than the stored range", >8 °C unopened = not the stored range. **The guide gives no numeric "frozen" threshold or advice for 0–2 °C or 8–30 °C for an unopened pen; the wording tells the user to ask a pharmacist.** | p.16 (partly) | `zoneOf()` | |
| 20 | 8-week in-use tracker is informational; never declares a pen safe by age | p.16 | `train.storage.info/past8` | |

## Translation review

- Arabic and Kurdish strings in `src/i18n/trainingStrings.ts` were written for this feature (step text, doses, missed-dose and storage wording are reused from the guide's own Arabic / Kurdish pages where they exist).
- Arabic product name used in the app UI: **سمترا** (requested). The printed guide uses **سيميترا**. Confirm which spelling Petra Pharma wants for the app.
- Kurdish (Sorani) product name: **سیمێترا**.

## Compliance notes

- The app states it is educational and does not replace the prescriber (`train.hub.notice`, `train.common.disclaimer`).
- No dose calculator, no personal data collected by the training area (progress is on-device).
- Confirm in writing that Petra Pharma permits the product photographs, the Semetra name and the logos in a public store listing, and that the app is not presented as officially endorsed unless authorised.

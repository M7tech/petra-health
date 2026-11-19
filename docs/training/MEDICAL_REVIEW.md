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
| 8 | Semetra is for **subcutaneous** use (box). The cross-section shows skin, the fat layer under it, muscle and blood vessels, with the needle ending in the fat layer and markers "into the fat layer ✓ / not into muscle ✕ / not into a blood vessel ✕". **Layer thicknesses, depth and angle are illustrative only and are not manufacturer instructions** (stated on screen). The needle is drawn straight in, like the guide's step-12 picture. **The muscle / blood-vessel markers are ADDED guidance (reviewer request), not leaflet wording.** | box; p.9 step 12 | `training/CrossSection.tsx`, `train.sites.*` | |
| 9 | 18 injection steps and their order | p.8–9 | `guide.step1…18`, `training/content.ts` `CHAPTERS` | |
| 10 | Flow check is for a new pen only; dose counter returns to 0; a drop appears at the needle tip | p.8 steps 7–9 | `train.inject.newPenOnly` | |
| 11 | Keep pressing the dose button and count slowly to 6 with the needle in the skin | p.9 step 14 | `train.inject.count6` | |
| 12 | Used needle goes in a sharps / puncture-resistant container; pen cap back on | p.9 steps 17–18 | `train.inject.sharps` | |
| 13 | Missed dose: five days or fewer after the due day → use it when remembered, then next dose on the usual day; more than five days → skip, next dose on the usual day; never a double dose. **Implemented with real dates and times: "five days" = exactly 120 hours, inclusive (120 h → take; 120 h + 1 min → skip); 168 h (next scheduled dose) → resume the usual schedule.** | p.14 | `training/rules.ts` `missedDoseDecision`, tests in `rules.test.ts` | |
| 14 | **Interpretation to confirm:** the leaflet says "five days or fewer after the due day". The app counts elapsed hours (≤ 120 h). A calendar-day reading (anything up to the end of day 5) would differ for the hours after the due time-of-day on day 5. Confirm which reading Petra Pharma intends. | p.14 | `TAKE_WINDOW_HOURS` | |
| 15 | Several missed doses (≥ 336 h, i.e. two scheduled doses passed) / long break → contact the prescribing clinician; do not restart or increase the dose alone. **ADDED guidance — not in the leaflet.** Shown with the "Added guidance" label. | — | `train.missed.multiple`, `AddedGuidance` | |
| 16 | Unopened pen: refrigerator 2–8 °C, away from the cooling element, do not freeze, keep cap on (light) | p.16 | `guide.beforeBody`, thermometer zones | |
| 17 | In-use pen: up to 8 weeks below 30 °C **or** in the refrigerator 2–8 °C; do not freeze; do not use if frozen | p.16 | `guide.duringBody`, `zoneOf()` | |
| 18 | Do not use after the expiry date (last day of the month); keep out of reach of children | p.16 | `train.storage.expiry/kids` | |
| 19 | A temperature reading is only compared with the labelled range: below 2 °C or above 8 °C (unopened) / 30 °C (in use) = **outside the labelled range → do not use until a pharmacist advises**. The app **never declares a pen frozen from a reading**; use is prohibited when the user states the medicine is **known** to have frozen. (The leaflet gives no numeric frozen threshold.) | p.16 (partly) | `training/rules.ts` `tempZone`, `train.storage.zone*`, `frozenBan` | |
| 20 | The in-use tracker shows the **last permitted day** = the earlier of (first use + 8 weeks) and the end of the printed expiry month. It never says a pen is safe: inside the period it states that storage history and temperature exposure also matter. **8 weeks are counted as 56 days with the first-use day as day 1 (conservative) — confirm.** | p.16 | `training/rules.ts` `useLimit`, `useStatus` | |

## Translation review

- Arabic and Kurdish strings in `src/i18n/trainingStrings.ts` were written for this feature (step text, doses, missed-dose and storage wording are reused from the guide's own Arabic / Kurdish pages where they exist).
- Arabic product name used in the app UI: **سيميترا** (matches the printed guide; confirmed by the project owner).
- Kurdish (Sorani) product name: **سیمێترا**.

## Compliance notes

- The app states it is educational and does not replace the prescriber (`train.hub.notice`, `train.common.disclaimer`).
- No dose calculator, no personal data collected by the training area (progress is on-device).
- Project owner states Petra Pharma has granted permission to use the Semetra name, product photographs and branding. **Keep the written permission on file** for the store submissions, and do not present the app as officially endorsed unless that permission says so.

## Clinical review round 1 — items and how they were addressed

| Reviewer item | Change | Status |
|---|---|---|
| 1. Abdomen: show the area at least 5 cm from the navel | Abdomen detail diagram with a 5 cm keep-away ring, shown as **added guidance pending clinical confirmation for Semetra**; the leaflet wording ("around the navel") is shown separately and unchanged. The 5 cm figure is not in the Semetra leaflet | Implemented, **needs confirmation** (if not confirmed, remove `AbdomenDiagram` from `app/training/sites.tsx`) |
| 2. Anatomy: show subcutaneous fat, not muscle or vessel; no invented angle or depth as instructions | Needle ends in the fat layer; vessels and muscle are drawn and marked; an on-screen note says layers, depth and angle are illustrative, not manufacturer instructions | Implemented |
| 3. Missed-dose calculator tested with real dates and times; exactly 120 h is inside the boundary | Rebuilt on real date + time inputs; pure functions in `rules.ts`; 14 tests (Monday due → Tue–Sat take, exactly 120 h take, 120 h + 1 min skip, Sunday skip, next Monday resume, month / year / leap-year / daylight-saving cases), run under UTC, US-Eastern, US-Pacific and a +03:00 zone | Implemented, tests pass |
| 4. Keep the multiple-missed-doses warning; distinguish added guidance from the leaflet | New `AddedGuidance` (dashed border + "Not from the Semetra leaflet. Pending clinical confirmation.") and `SourceTag` (leaflet / added) used wherever text is not leaflet wording | Implemented |
| 5. Do not call a pen frozen from a reading | See row 19 | Implemented |
| 6. Tracker must not imply safety; eight weeks or expiry, whichever first; storage history matters | See row 20, with optional expiry month/year input | Implemented |
| 7. Semetra is not interchangeable with other semaglutide pens | All figures come only from the Semetra guide (1.5 ml pen at 1.34 mg/ml; 3 ml pen for 1 mg). A "Semetra only" notice is shown in the dose module and `rules.ts` carries the warning. No other brand's figures are used anywhere | Implemented |

Run the date/time tests: `cd apps/mobile && npm run test:training`.

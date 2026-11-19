# Real-device testing — Semetra training

Simulators and the web preview do **not** count as device testing. Run this on a physical Android phone (ideally one mid-range) and a physical iPhone, using a **preview/production build**, not Expo Go.

## Android — automated part (adb)

1. Install the build, unlock the phone, keep the screen on, USB debugging authorised.
2. From `apps/mobile`:
   ```bash
   bash scripts/device-check.sh            # or: bash scripts/device-check.sh <serial from `adb devices`>
   ```
3. It cold-starts each training screen through a deep link (no login needed), scrolls, lets the animations run, and writes `device-check-out/<time>/summary.txt` with, per screen: start-up ms, frames rendered, janky frames and %, 95th-percentile frame time, memory (PSS), plus a screenshot and any crash lines from logcat.

Targets (guide values, not hard limits): janky ≤ ~5 %, p95 frame time ≤ ~16–20 ms, no growth in PSS from one screen to the next, no `FATAL` / `ReactNativeJS` errors.

## Manual checklist (both platforms)

| Area | What to check |
|---|---|
| First run | Fresh install opens in **Arabic**, RTL layout correct; an existing install keeps its previous language |
| Navigation | Hub → every module → back; swipe-back (iOS) / system back (Android); no blank or "Unmatched route" screen |
| Module 1 | Tap each week 1–8: dose / box / colour change; once-a-week animation runs; quiz completes, hub shows ✓ and `n / 5` |
| Module 2 | Tap each site: marker moves, cross-section replays; Replay button works |
| Module 3 | Each chapter A–E plays; Play/Pause, Replay, Previous, Next; safety notes on steps 7, 14, 17; no step shows a blank photo |
| Module 4 | Every weekday and day 0–7; day 6 = skip, days 1–5 = take; weekday names correct; double-dose warning visible |
| Module 5 | Drag the thermometer through every zone for both "not opened" and "in use"; cap on/off; "I started this pen today" and ± day; restart the app and confirm the date and progress persist |
| Language | Switch EN ↔ AR ↔ KU mid-module; progress is kept; no clipped text |
| Accessibility | Largest system font size; TalkBack / VoiceOver reads buttons and the thermometer value; **Reduce Motion** on → animations stop, content still shown |
| Offline | Airplane mode: all five training modules still work |
| Dark mode | Profile → Appearance: Light / Dark / Automatic; contrast acceptable in every module |
| Stability | Open and close each module 10×; rotate the phone (should stay portrait); background and resume; no crash, no growing lag |

## iOS (manual — cannot be scripted from Windows)

Use Xcode Instruments (Time Profiler / Core Animation FPS / Allocations) or the Xcode "Debug → View Debugging" gauges while repeating the Module 3 player and the Module 5 thermometer; note dropped frames and memory. Test on the oldest iPhone you intend to support. Needs an Apple developer account and a TestFlight/dev build.

## Results log

| Date | Device | OS | Build | Result | Notes |
|---|---|---|---|---|---|
| | | | | | |

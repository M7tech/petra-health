#!/usr/bin/env bash
# Real-device check for the Semetra training screens (Android, over adb).
#
#   bash scripts/device-check.sh [adb-serial]
#
# For each training screen it: cold-starts the app straight onto that screen (deep link, no login needed),
# records start-up time, scrolls and lets animations run, then reports dropped ("janky") frames from
# `dumpsys gfxinfo`, memory from `dumpsys meminfo`, a screenshot, and any JS / native crash in logcat.
# Needs: the phone unlocked with the screen on, USB debugging authorised, the app installed.
# Output goes to ./device-check-out/<timestamp>/ (summary.txt + PNGs). Nothing is changed on the phone.

set -u
PKG="com.petrapharma.health"
SCHEME="petrahealth"
SERIAL="${1:-}"
ADB=(adb)
[ -n "$SERIAL" ] && ADB=(adb -s "$SERIAL")

OUT="device-check-out/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUT"
SUMMARY="$OUT/summary.txt"

if ! "${ADB[@]}" get-state >/dev/null 2>&1; then
  echo "No adb device found. Connect the phone, enable USB debugging, and run 'adb devices'." >&2
  exit 1
fi
if ! "${ADB[@]}" shell pm list packages 2>/dev/null | grep -q "package:$PKG"; then
  echo "$PKG is not installed on this device." >&2
  exit 1
fi

# The screen must be on and unlocked (a locked phone renders nothing to measure).
"${ADB[@]}" shell input keyevent KEYCODE_WAKEUP
sleep 1
if "${ADB[@]}" shell dumpsys window 2>/dev/null | grep -q "isKeyguardShowing=true"; then
  echo "The phone is locked. Unlock it, keep the screen on, and run this again." >&2
  exit 2
fi

MODEL="$("${ADB[@]}" shell getprop ro.product.model | tr -d '\r')"
ANDROID="$("${ADB[@]}" shell getprop ro.build.version.release | tr -d '\r')"
VERSION="$("${ADB[@]}" shell dumpsys package "$PKG" | grep -m1 versionName | tr -d '\r ' )"
{
  echo "Semetra device check — $(date)"
  echo "Device: $MODEL (Android $ANDROID)   App: $VERSION"
  echo
  printf '%-22s %9s %9s %8s %8s %8s %9s\n' "screen" "start ms" "frames" "janky" "janky %" "p95 ms" "PSS MB"
} | tee "$SUMMARY"

SCREENS=(training training/dose training/sites training/inject training/missed training/storage)

W=$("${ADB[@]}" shell wm size | grep -oE '[0-9]+x[0-9]+' | tail -1 | tr -d '\r')
SW=${W%x*}; SH=${W#*x}
X=$((SW / 2)); Y1=$((SH * 7 / 10)); Y2=$((SH * 3 / 10))

for s in "${SCREENS[@]}"; do
  name="${s//\//_}"
  "${ADB[@]}" shell am force-stop "$PKG"
  sleep 1
  "${ADB[@]}" logcat -c
  START=$("${ADB[@]}" shell am start -W -a android.intent.action.VIEW -d "$SCHEME:///$s" "$PKG" | grep -E "TotalTime" | grep -oE '[0-9]+' | head -1)
  sleep 5                                   # let the first render and entrance animations finish
  "${ADB[@]}" shell dumpsys gfxinfo "$PKG" reset >/dev/null
  for i in 1 2 3 4; do                       # scroll down and back up while animations run
    "${ADB[@]}" shell input swipe "$X" "$Y1" "$X" "$Y2" 350
    sleep 1
  done
  for i in 1 2 3 4; do
    "${ADB[@]}" shell input swipe "$X" "$Y2" "$X" "$Y1" 350
    sleep 1
  done
  sleep 6                                    # idle with the screen's own animation playing (e.g. step player)
  GFX="$("${ADB[@]}" shell dumpsys gfxinfo "$PKG")"
  TOTAL=$(echo "$GFX" | grep -m1 "Total frames rendered" | grep -oE '[0-9]+' | head -1)
  JANKY=$(echo "$GFX" | grep -m1 "Janky frames:" | grep -oE '[0-9]+' | head -1)
  JPCT=$(echo "$GFX" | grep -m1 "Janky frames:" | grep -oE '\([0-9.]+%\)' | tr -d '()%')
  P95=$(echo "$GFX" | grep -m1 "95th percentile" | grep -oE '[0-9]+' | head -1)
  PSS=$("${ADB[@]}" shell dumpsys meminfo "$PKG" | grep -m1 "TOTAL PSS" | grep -oE '[0-9]+' | head -1)
  PSS_MB=$(( ${PSS:-0} / 1024 ))
  "${ADB[@]}" exec-out screencap -p > "$OUT/$name.png"
  CRASH=$("${ADB[@]}" logcat -d -s AndroidRuntime:E ReactNativeJS:E 2>/dev/null | grep -cE "FATAL|Error" )
  printf '%-22s %9s %9s %8s %8s %8s %9s\n' "$s" "${START:-?}" "${TOTAL:-?}" "${JANKY:-?}" "${JPCT:-?}" "${P95:-?}" "$PSS_MB" | tee -a "$SUMMARY"
  if [ "${CRASH:-0}" -gt 0 ]; then
    echo "   ! $CRASH error line(s) in logcat for $s — see $OUT/$name.log" | tee -a "$SUMMARY"
    "${ADB[@]}" logcat -d -s AndroidRuntime:E ReactNativeJS:E > "$OUT/$name.log" 2>/dev/null
  fi
done

{
  echo
  echo "How to read this: janky % under ~5 and p95 under ~16-20 ms is smooth; start ms is cold start to first"
  echo "frame of the screen; PSS MB is the app's memory (flag anything that keeps growing between screens)."
  echo "Screenshots: $OUT/*.png"
} | tee -a "$SUMMARY"

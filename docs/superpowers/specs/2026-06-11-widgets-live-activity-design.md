# Method — Widgets + Live Activity Design Spec

**Date:** 2026-06-11
**Status:** Approved

---

## Goal

Extend Method beyond the app boundary. Users wear their rank on the home screen via a WidgetKit widget, and the Dynamic Island shows a live focus timer while a session is running. Both surfaces reinforce the "clock in as your future self" identity.

---

## Architecture Overview

Four independent pieces, each with one responsibility:

```
┌─────────────────────────────────────────┐
│  React Native App                       │
│                                         │
│  SharedData.ts  ──►  MethodSharedDataModule.swift  ──► UserDefaults
│  LiveActivity.ts ──► MethodLiveActivityModule.swift ──► ActivityKit
└─────────────────────────────────────────┘
                              │
                    App Group: group.com.darrentabago.method
                              │
         ┌────────────────────┴────────────────────┐
         │         MethodWidget Extension           │
         │  MethodWidget.swift (WidgetKit)          │
         │  MethodLiveActivityWidget.swift          │
         └──────────────────────────────────────────┘
```

### 1. Config Plugin — `plugins/withMethodWidgets.js`

Runs at `expo prebuild` / `expo run:ios`. Responsibilities:
- Adds `com.apple.security.application-groups` entitlement (`group.com.darrentabago.method`) to the main app target
- Creates the `MethodWidget` extension target in the Xcode project
- Copies Swift source files from `plugins/swift/` into `ios/MethodWidget/`
- Links `WidgetKit.framework` and `ActivityKit.framework` to the extension target
- Adds App Group entitlement to the extension target
- Registers `MethodSharedDataModule.swift` and `MethodLiveActivityModule.swift` with the main app target

Never requires manual Xcode changes. Re-running `expo run:ios` is safe and idempotent.

### 2. App Group Shared Container

Identifier: `group.com.darrentabago.method`

All communication between the main app and extensions goes through `UserDefaults(suiteName: "group.com.darrentabago.method")`. The main app writes; extensions only read.

Shared data schema (flat keys):
```
totalEarned      Int     — total merit balance
rankTitle        String  — e.g. "The Builder"
rankLevel        Int     — 1–10
rankPercent      Double  — 0.0–1.0, progress to next rank
meritToNext      Int     — merit needed to reach next rank
nextRankTitle    String  — e.g. "The Operator" (empty if max rank)
currentStreak    Int     — day streak count
personaName      String  — e.g. "DARREN"
daysRemaining    Int     — days left to persona goal
weekActivity     [Bool]  — 7 elements, index 0 = 6 days ago, index 6 = today
```

### 3. Expo Native Modules (main app target)

**`MethodSharedDataModule`** (`plugins/swift/MethodSharedDataModule.swift`)
- Expo module registered as `"MethodSharedData"`
- Single async function: `update(data: Record<string, any>)`
- Writes all keys to App Group UserDefaults
- Calls `WidgetCenter.shared.reloadAllTimelines()` after writing

**`MethodLiveActivityModule`** (`plugins/swift/MethodLiveActivityModule.swift`)
- Expo module registered as `"MethodLiveActivity"`
- `start(params)` — requests a new `Activity<MethodLiveActivityAttributes>`, stores reference
- `update(timeRemaining: Int)` — pushes updated `ContentState` to the running activity
- `end(earnedMerit: Int)` — ends the activity; if earnedMerit > 0 shows completion state for 4s, otherwise dismisses immediately
- iOS version gated: all ActivityKit calls are wrapped in `if #available(iOS 16.2, *)`; on older iOS the functions resolve silently

### 4. Widget + Live Activity Extension (`MethodWidget` target)

Single extension bundle. Contains:

| File | Purpose |
|---|---|
| `MethodWidgetBundle.swift` | `@main` entry, declares both widget and Live Activity |
| `MethodWidget.swift` | Small + medium widget SwiftUI views + `TimelineProvider` |
| `MethodLiveActivityAttributes.swift` | `ActivityAttributes` struct with static + dynamic state |
| `MethodLiveActivityWidget.swift` | Dynamic Island compact, expanded, and lock screen views |
| `MethodSharedData.swift` | Helper that reads the App Group UserDefaults snapshot |

---

## Widget Design

### Small (2×2)
```
method.
DARREN · THE BUILDER
₦ 1,325
● ● ○ ● ● ● ●
```
- Background: `#1A1A1A` with a subtle top-edge highlight `rgba(255,255,255,0.15)`
- Merit number: 36pt bold, white
- Rank line: 9pt, 50% white / 70% white split on name vs. rank
- Week dots: 7 dots, active = white 85%, inactive = white 18%, today + active = pure white

### Medium (4×2)
```
method.                             DARREN · THE BUILDER
₦ 1,325                             ████████░░  825 to THE OPERATOR
● ● ○ ● ● ● ●   Day 7 streak       183 days to goal
```
- Left column: merit + week strip + streak label
- Right column: rank progress bar (`rgba(255,255,255,0.08)` track, white fill) + goal countdown
- Divider: 1pt vertical line at 50%, `rgba(255,255,255,0.10)`

### Timeline refresh
- `TimelineProvider` returns entries every 30 minutes
- On any `SharedData.update()` call, `WidgetCenter.reloadAllTimelines()` triggers an immediate refresh
- Widget is purely read-only; tapping deep-links into the app (no widget interactions in v1)

---

## Live Activity Design

### ActivityAttributes
```swift
struct MethodLiveActivityAttributes: ActivityAttributes {
    // Static (set at start, doesn't change)
    let personaName: String       // "DARREN"
    let rankTitle: String         // "The Builder"
    let intervalMinutes: Int      // 25 / 30 / 60

    struct ContentState: Codable, Hashable {
        var timeRemaining: Int    // seconds
        var projectedMerit: Int   // current calculated merit if session completes now
    }
}
```

### Dynamic Island — Compact (pill, session running)
```
[ ₦ ]  LOCKED IN  [ 24:13 ]
```
- Leading: merit symbol image, 14pt, tinted white
- Trailing: countdown `MM:SS`, 15pt bold monospaced, white

### Dynamic Island — Expanded (long-press)
```
         LOCKED IN
    DARREN · THE BUILDER
         24:13
   + 42 MERIT INCOMING
```
- "LOCKED IN": 10pt, 4pt letter-spacing, 50% white
- Name · Rank: 10pt, 2.4pt letter-spacing
- Timer: 52pt bold, white, monospaced
- Merit projected: 13pt, 65% white

### Lock Screen Banner
```
method.                                 24:13
DARREN is locked in · The Builder
████████░░  earning up to 55 merit
```
- Left column: brand + persona sentence + progress bar
- Right: large timer

### End States
- **Completed:** ContentState updates to show `+{earnedMerit} MERIT EARNED`, activity ends with `.after(.now + 4)` dismissal policy
- **Abandoned:** `end()` called with earnedMerit = 0, dismisses immediately with `.immediate` policy

---

## JS Module Interfaces

### `src/modules/SharedData.ts`
```typescript
import { NativeModules } from 'react-native';
const { MethodSharedData } = NativeModules;

export type SharedSnapshot = {
  totalEarned: number;
  rankTitle: string;
  rankLevel: number;
  rankPercent: number;
  meritToNext: number;
  nextRankTitle: string;
  currentStreak: number;
  personaName: string;
  daysRemaining: number;
  weekActivity: boolean[]; // 7 elements, index 0 = 6 days ago, index 6 = today
};

export async function updateSharedData(snapshot: SharedSnapshot): Promise<void> {
  await MethodSharedData.update(snapshot);
}

// Assembles a SharedSnapshot from live stats + persona. Call this wherever stats change.
export function buildSnapshot(
  stats: SessionStats,
  persona: PersonaData | null
): SharedSnapshot {
  const progress = getRankProgress(stats.totalEarned);
  const countdown = persona ? getGoalCountdown(persona) : null;
  const today = new Date();
  const weekActivity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return (stats.dailySessions[d.toISOString().split('T')[0]] ?? 0) > 0;
  });
  return {
    totalEarned: stats.totalEarned,
    rankTitle: progress.current.title,
    rankLevel: progress.current.level,
    rankPercent: progress.percent,
    meritToNext: progress.meritToNext,
    nextRankTitle: progress.next?.title ?? '',
    currentStreak: stats.currentStreak,
    personaName: persona?.name ?? '',
    daysRemaining: countdown?.daysRemaining ?? 0,
    weekActivity,
  };
}
```

### `src/modules/LiveActivity.ts`
```typescript
import { NativeModules, Platform } from 'react-native';
const { MethodLiveActivity } = NativeModules;

const isSupported = Platform.OS === 'ios';

export async function startLiveActivity(params: {
  personaName: string;
  rankTitle: string;
  intervalMinutes: number;
  projectedMerit: number;
}): Promise<void> {
  if (!isSupported) return;
  await MethodLiveActivity.start(params);
}

export async function updateLiveActivity(timeRemaining: number): Promise<void> {
  if (!isSupported) return;
  await MethodLiveActivity.update(timeRemaining);
}

export async function endLiveActivity(earnedMerit: number): Promise<void> {
  if (!isSupported) return;
  await MethodLiveActivity.end(earnedMerit);
}
```

---

## Integration Points in Existing Code

### `src/screens/FocusSessionScreen.tsx`
- On session start (inside `useFocusEffect`): call `startLiveActivity({ personaName, rankTitle, intervalMinutes, projectedMerit: calculateMerit(intervalMinutes) })`
- Each timer tick (inside `setInterval`): call `updateLiveActivity(remaining)`
- On session complete (before `nav.replace('SessionComplete')`): call `endLiveActivity(calculateMerit(intervalMinutes))`
- On abandon confirmed (inside `handleEndSession` alert): call `endLiveActivity(0)`

### `src/storage/stats.ts`
- At the end of `recordSession()`: call `updateSharedData(buildSnapshot(stats, persona))`
- At the end of `recordAbandon()`: call `updateSharedData(buildSnapshot(stats, persona))`
- `buildSnapshot()` is a helper in `src/modules/SharedData.ts` that assembles the snapshot from `SessionStats + PersonaData`

### `src/storage/persona.ts`
- At the end of `savePersona()`: call `updateSharedData(...)` with updated personaName + daysRemaining

---

## File Structure

```
plugins/
  withMethodWidgets.js              ← config plugin (build-time, JS)
  swift/
    MethodWidgetBundle.swift        ← extension @main entry
    MethodWidget.swift              ← small + medium widget UI
    MethodLiveActivityAttributes.swift
    MethodLiveActivityWidget.swift  ← Dynamic Island + lock screen UI
    MethodSharedData.swift          ← reads App Group (extension side)
    MethodSharedDataModule.swift    ← Expo module: writes App Group (main app)
    MethodLiveActivityModule.swift  ← Expo module: ActivityKit bridge (main app)

src/
  modules/
    SharedData.ts                   ← JS wrapper for MethodSharedData
    LiveActivity.ts                 ← JS wrapper for MethodLiveActivity
```

`app.json` addition:
```json
"plugins": ["./plugins/withMethodWidgets"]
```

`ios/` remains gitignored. `expo run:ios` on Mac regenerates it with the extension baked in.

---

## Build Requirements

- Requires `expo run:ios` on Mac (not Expo Go)
- Already satisfied: `expo-dev-client` is in the project
- Minimum iOS target: 16.2 (ActivityKit + Dynamic Island require 16.1+; 16.2 is the stable baseline)
- Live Activity requires a physical device or iPhone 14 Pro+ simulator to see the Dynamic Island; the lock screen banner appears on all devices running iOS 16.2+
- `EAS_PROJECT_ID` in `app.json` must be filled in before EAS cloud builds, but local `expo run:ios` works without it

---

## Out of Scope (v1)

- Widget interactivity (AppIntents / Button in widget) — iOS 17+ only, follow-up
- iPad widget sizes (extra-large) — follow-up
- Android — not applicable (iOS only)
- Background timer sync (widget always reads last-written snapshot, no live countdown in widget)

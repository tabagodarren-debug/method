# Widgets + Live Activity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a home-screen WidgetKit widget (small + medium) and a Dynamic Island / lock-screen Live Activity to Method, both reading from an App Group shared container written by two Expo native modules.

**Architecture:** A single Expo config plugin (`plugins/withMethodWidgets.js`) modifies the Xcode project at prebuild time: adds an App Group entitlement, copies Swift files, creates the `MethodWidget` extension target, and injects module registration into the Podfile. Two Expo native modules (`MethodSharedDataModule`, `MethodLiveActivityModule`) bridge JS to the App Group and ActivityKit respectively. One Swift extension bundle hosts both the static widget and the Live Activity.

**Tech Stack:** Expo SDK 54, expo-modules-core, @expo/config-plugins, WidgetKit (SwiftUI), ActivityKit (iOS 16.2+), UserDefaults App Group, React Native new architecture.

---

## File Map

**Created by this plan:**
```
plugins/
  withMethodWidgets.js              ← config plugin entry point
  swift/
    MethodSharedData.swift          ← extension reads App Group UserDefaults
    MethodWidgetBundle.swift        ← @main entry for the extension bundle
    MethodWidget.swift              ← small + medium widget SwiftUI views
    MethodLiveActivityAttributes.swift  ← ActivityAttributes type shared by extension + module
    MethodLiveActivityWidget.swift  ← Dynamic Island compact/expanded + lock screen views
    MethodSharedDataModule.swift    ← expo-modules-core module: writes App Group (main app)
    MethodLiveActivityModule.swift  ← expo-modules-core module: ActivityKit bridge (main app)

src/modules/
  SharedData.ts                     ← JS wrapper: updateSharedData + buildSnapshot
  LiveActivity.ts                   ← JS wrapper: start / update / end

__tests__/modules/
  SharedData.test.ts                ← unit tests for buildSnapshot shape
  LiveActivity.test.ts              ← unit tests for JS wrapper (mocked native)
```

**Modified by this plan:**
```
app.json                            ← add plugins entry
src/storage/stats.ts                ← call updateSharedData after recordSession/recordAbandon
src/storage/persona.ts              ← call updateSharedData after savePersona
src/screens/FocusSessionScreen.tsx  ← start/update/end Live Activity around timer
```

---

## Task 1: Config plugin skeleton + App Group entitlement + Info.plist

**Files:**
- Create: `plugins/withMethodWidgets.js`

The plugin wires four mods in sequence. This task only implements the first two (entitlement + Info.plist). Later tasks will add the dangerous mod and the Xcode target mod.

- [ ] **Step 1: Create the plugin skeleton**

```javascript
// plugins/withMethodWidgets.js
const {
  withEntitlementsPlist,
  withInfoPlist,
  withDangerousMod,
  withXcodeProject,
  withPodfile,
} = require('@expo/config-plugins');
const path = require('path');
const fs   = require('fs');

const APP_GROUP      = 'group.com.darrentabago.method';
const EXTENSION_NAME = 'MethodWidget';
const EXTENSION_BUNDLE_ID = 'com.darrentabago.method.MethodWidget';

// ── composed entry ──────────────────────────────────────────────────────────
function withMethodWidgets(config) {
  config = withAppGroupEntitlement(config);
  config = withLiveActivityInfoPlist(config);
  // Tasks 11-13 will add: withWidgetFiles, withXcodeTarget, withPodfileRegistration
  return config;
}

// ── 1. Add App Group to main app entitlements ────────────────────────────────
function withAppGroupEntitlement(config) {
  return withEntitlementsPlist(config, (c) => {
    const key = 'com.apple.security.application-groups';
    const existing = c.modResults[key] ?? [];
    if (!existing.includes(APP_GROUP)) {
      c.modResults[key] = [...existing, APP_GROUP];
    }
    return c;
  });
}

// ── 2. Allow Live Activities in main app Info.plist ──────────────────────────
function withLiveActivityInfoPlist(config) {
  return withInfoPlist(config, (c) => {
    c.modResults.NSSupportsLiveActivities = true;
    c.modResults.NSSupportsLiveActivitiesFrequentUpdates = false;
    return c;
  });
}

module.exports = withMethodWidgets;
```

- [ ] **Step 2: Verify the file is syntactically valid**

```bash
node -e "require('./plugins/withMethodWidgets.js'); console.log('OK')"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add plugins/withMethodWidgets.js
git commit -m "feat(widgets): config plugin skeleton with App Group entitlement"
git push origin main
```

---

## Task 2: SharedData.ts JS module + buildSnapshot helper

**Files:**
- Create: `src/modules/SharedData.ts`

This module is the only file the rest of the app touches. It knows nothing about App Groups — callers just call `updateSharedData(snapshot)`.

- [ ] **Step 1: Create the module**

```typescript
// src/modules/SharedData.ts
import { requireNativeModule } from 'expo-modules-core';
import { getRankProgress } from '../utils/ranks';
import { getGoalCountdown } from '../utils/goal';
import type { SessionStats, PersonaData } from '../types';

const Native = requireNativeModule('MethodSharedData');

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
  try {
    await Native.update(snapshot);
  } catch (_) {
    // silently skip if the native module isn't available (Expo Go, tests)
  }
}

export function buildSnapshot(
  stats: SessionStats,
  persona: PersonaData | null
): SharedSnapshot {
  const progress  = getRankProgress(stats.totalEarned);
  const countdown = persona ? getGoalCountdown(persona) : null;
  const today     = new Date();

  const weekActivity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    return (stats.dailySessions[key] ?? 0) > 0;
  });

  return {
    totalEarned:   stats.totalEarned,
    rankTitle:     progress.current.title,
    rankLevel:     progress.current.level,
    rankPercent:   progress.percent,
    meritToNext:   progress.meritToNext,
    nextRankTitle: progress.next?.title ?? '',
    currentStreak: stats.currentStreak,
    personaName:   persona?.name ?? '',
    daysRemaining: countdown?.daysRemaining ?? 0,
    weekActivity,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/SharedData.ts
git commit -m "feat(widgets): SharedData JS module + buildSnapshot"
git push origin main
```

---

## Task 3: Jest tests for buildSnapshot

**Files:**
- Create: `__tests__/modules/SharedData.test.ts`

- [ ] **Step 1: Create the test file**

```typescript
// __tests__/modules/SharedData.test.ts
import { buildSnapshot } from '../../src/modules/SharedData';
import type { SessionStats, PersonaData } from '../../src/types';

// requireNativeModule is unavailable in jest; it's safe-caught inside updateSharedData
jest.mock('expo-modules-core', () => ({
  requireNativeModule: () => ({ update: jest.fn().mockResolvedValue(undefined) }),
}));

const baseStats: SessionStats = {
  totalEarned: 400,
  sessionsCompleted: 8,
  sessionsAbandoned: 1,
  currentStreak: 3,
  longestStreak: 5,
  lastSessionDate: '2026-06-11',
  totalMinutes: 200,
  dailySessions: {},
};

const persona: PersonaData = {
  name: 'Darren',
  goal: '$10k/month',
  timeline: '1yr',
  startDate: '2026-06-11',
};

it('buildSnapshot returns correct rank for 400 merit (The Builder)', () => {
  const snap = buildSnapshot(baseStats, persona);
  expect(snap.rankTitle).toBe('The Builder');
  expect(snap.rankLevel).toBe(3);
  expect(snap.personaName).toBe('Darren');
  expect(snap.currentStreak).toBe(3);
});

it('buildSnapshot nextRankTitle is The Operator at level 3', () => {
  const snap = buildSnapshot(baseStats, persona);
  expect(snap.nextRankTitle).toBe('The Operator');
  expect(snap.meritToNext).toBe(500); // 900 - 400
});

it('buildSnapshot weekActivity has 7 boolean entries', () => {
  const snap = buildSnapshot(baseStats, persona);
  expect(snap.weekActivity).toHaveLength(7);
  expect(snap.weekActivity.every(v => typeof v === 'boolean')).toBe(true);
});

it('buildSnapshot weekActivity reflects dailySessions', () => {
  const today = new Date().toISOString().split('T')[0];
  const stats = { ...baseStats, dailySessions: { [today]: 2 } };
  const snap = buildSnapshot(stats, persona);
  expect(snap.weekActivity[6]).toBe(true);  // today = index 6
  expect(snap.weekActivity[5]).toBe(false); // yesterday = no session
});

it('buildSnapshot gracefully handles null persona', () => {
  const snap = buildSnapshot(baseStats, null);
  expect(snap.personaName).toBe('');
  expect(snap.daysRemaining).toBe(0);
});

it('buildSnapshot returns empty nextRankTitle at max rank', () => {
  const snap = buildSnapshot({ ...baseStats, totalEarned: 25000 }, persona);
  expect(snap.nextRankTitle).toBe('');
  expect(snap.rankPercent).toBe(1);
});
```

- [ ] **Step 2: Run the tests**

```bash
npx jest __tests__/modules/SharedData.test.ts
```
Expected: 6 tests pass.

- [ ] **Step 3: Commit**

```bash
git add __tests__/modules/SharedData.test.ts
git commit -m "test(widgets): buildSnapshot unit tests"
git push origin main
```

---

## Task 4: LiveActivity.ts JS module

**Files:**
- Create: `src/modules/LiveActivity.ts`

- [ ] **Step 1: Create the module**

```typescript
// src/modules/LiveActivity.ts
import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

const isSupported = Platform.OS === 'ios';
const Native = isSupported ? requireNativeModule('MethodLiveActivity') : null;

export async function startLiveActivity(params: {
  personaName: string;
  rankTitle: string;
  intervalMinutes: number;
  projectedMerit: number;
}): Promise<void> {
  if (!isSupported || !Native) return;
  try { await Native.start(params); } catch (_) {}
}

export async function updateLiveActivity(timeRemaining: number): Promise<void> {
  if (!isSupported || !Native) return;
  try { await Native.update(timeRemaining); } catch (_) {}
}

export async function endLiveActivity(earnedMerit: number): Promise<void> {
  if (!isSupported || !Native) return;
  try { await Native.end(earnedMerit); } catch (_) {}
}
```

- [ ] **Step 2: Create the test**

```typescript
// __tests__/modules/LiveActivity.test.ts
const mockStart  = jest.fn().mockResolvedValue(undefined);
const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockEnd    = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-modules-core', () => ({
  requireNativeModule: () => ({ start: mockStart, update: mockUpdate, end: mockEnd }),
}));
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

import { startLiveActivity, updateLiveActivity, endLiveActivity } from '../../src/modules/LiveActivity';

beforeEach(() => { mockStart.mockClear(); mockUpdate.mockClear(); mockEnd.mockClear(); });

it('startLiveActivity calls native start with params', async () => {
  await startLiveActivity({ personaName: 'Darren', rankTitle: 'The Builder', intervalMinutes: 25, projectedMerit: 30 });
  expect(mockStart).toHaveBeenCalledWith({ personaName: 'Darren', rankTitle: 'The Builder', intervalMinutes: 25, projectedMerit: 30 });
});

it('updateLiveActivity calls native update with timeRemaining', async () => {
  await updateLiveActivity(1200);
  expect(mockUpdate).toHaveBeenCalledWith(1200);
});

it('endLiveActivity calls native end with earnedMerit', async () => {
  await endLiveActivity(42);
  expect(mockEnd).toHaveBeenCalledWith(42);
});
```

- [ ] **Step 3: Run tests**

```bash
npx jest __tests__/modules/LiveActivity.test.ts
```
Expected: 3 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/modules/LiveActivity.ts __tests__/modules/LiveActivity.test.ts
git commit -m "feat(widgets): LiveActivity JS module + tests"
git push origin main
```

---

## Task 5: MethodSharedData.swift — App Group reader for extension

**Files:**
- Create: `plugins/swift/MethodSharedData.swift`

This file lives in the **extension** target. It reads from the App Group and has no dependency on expo-modules-core.

- [ ] **Step 1: Create the file**

```swift
// plugins/swift/MethodSharedData.swift
import Foundation

struct MethodData {
    let totalEarned: Int
    let rankTitle: String
    let rankLevel: Int
    let rankPercent: Double
    let meritToNext: Int
    let nextRankTitle: String
    let currentStreak: Int
    let personaName: String
    let daysRemaining: Int
    let weekActivity: [Bool]

    static let appGroup = "group.com.darrentabago.method"

    static func load() -> MethodData {
        let d = UserDefaults(suiteName: appGroup) ?? .standard
        let raw = d.array(forKey: "weekActivity") as? [Bool]
        return MethodData(
            totalEarned:   d.integer(forKey: "totalEarned"),
            rankTitle:     d.string(forKey: "rankTitle")  ?? "The Broke One",
            rankLevel:     d.integer(forKey: "rankLevel"),
            rankPercent:   d.double(forKey: "rankPercent"),
            meritToNext:   d.integer(forKey: "meritToNext"),
            nextRankTitle: d.string(forKey: "nextRankTitle") ?? "",
            currentStreak: d.integer(forKey: "currentStreak"),
            personaName:   d.string(forKey: "personaName") ?? "",
            daysRemaining: d.integer(forKey: "daysRemaining"),
            weekActivity:  raw ?? Array(repeating: false, count: 7)
        )
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add plugins/swift/MethodSharedData.swift
git commit -m "feat(widgets): MethodSharedData Swift reader for extension"
git push origin main
```

---

## Task 6: MethodLiveActivityAttributes.swift + MethodWidgetBundle.swift

**Files:**
- Create: `plugins/swift/MethodLiveActivityAttributes.swift`
- Create: `plugins/swift/MethodWidgetBundle.swift`

- [ ] **Step 1: Create MethodLiveActivityAttributes.swift**

```swift
// plugins/swift/MethodLiveActivityAttributes.swift
import ActivityKit
import Foundation

struct MethodLiveActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var timeRemaining: Int    // seconds remaining
        var projectedMerit: Int   // merit earned if session ended now
    }

    let personaName: String
    let rankTitle: String
    let intervalMinutes: Int
}
```

- [ ] **Step 2: Create MethodWidgetBundle.swift**

```swift
// plugins/swift/MethodWidgetBundle.swift
import SwiftUI
import WidgetKit

@main
struct MethodWidgetBundle: WidgetBundle {
    var body: some Widget {
        MethodWidget()
        if #available(iOS 16.2, *) {
            MethodLiveActivityWidget()
        }
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add plugins/swift/MethodLiveActivityAttributes.swift plugins/swift/MethodWidgetBundle.swift
git commit -m "feat(widgets): ActivityAttributes + widget bundle entry point"
git push origin main
```

---

## Task 7: MethodWidget.swift — small and medium widget views

**Files:**
- Create: `plugins/swift/MethodWidget.swift`

- [ ] **Step 1: Create MethodWidget.swift**

```swift
// plugins/swift/MethodWidget.swift
import SwiftUI
import WidgetKit

// MARK: - Timeline entry + provider

struct MethodEntry: TimelineEntry {
    let date: Date
    let data: MethodData
}

struct MethodProvider: TimelineProvider {
    func placeholder(in context: Context) -> MethodEntry {
        MethodEntry(date: .now, data: MethodData.load())
    }
    func getSnapshot(in context: Context, completion: @escaping (MethodEntry) -> Void) {
        completion(MethodEntry(date: .now, data: MethodData.load()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<MethodEntry>) -> Void) {
        let entry = MethodEntry(date: .now, data: MethodData.load())
        let next  = Calendar.current.date(byAdding: .minute, value: 30, to: .now)!
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

// MARK: - Shared sub-views

private struct WeekDotsView: View {
    let weekActivity: [Bool]
    let size: CGFloat

    var body: some View {
        HStack(spacing: 5) {
            ForEach(0..<min(7, weekActivity.count), id: \.self) { i in
                Circle()
                    .fill(color(i))
                    .frame(width: size, height: size)
            }
        }
    }

    private func color(_ i: Int) -> Color {
        guard weekActivity[i] else { return .white.opacity(0.18) }
        return i == 6 ? .white : .white.opacity(0.85)
    }
}

private let darkBg = Color(red: 0.102, green: 0.102, blue: 0.102)
private let topShine = LinearGradient(
    colors: [.white.opacity(0.15), .clear],
    startPoint: .top, endPoint: .bottom
)

// MARK: - Small view

private struct SmallView: View {
    let data: MethodData

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("method.")
                .font(.system(size: 10, weight: .light))
                .foregroundColor(.white.opacity(0.45))
            Spacer()
            identityLine
            Text("\(data.totalEarned)")
                .font(.system(size: 32, weight: .bold))
                .foregroundColor(.white)
                .minimumScaleFactor(0.7)
            WeekDotsView(weekActivity: data.weekActivity, size: 6)
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .background(darkBg)
        .overlay(alignment: .top) { topShine.frame(height: 32).clipped() }
    }

    private var identityLine: some View {
        HStack(spacing: 3) {
            if !data.personaName.isEmpty {
                Text(data.personaName.uppercased())
                    .font(.system(size: 9, weight: .medium)).tracking(2)
                    .foregroundColor(.white.opacity(0.5))
                Text("·").font(.system(size: 9)).foregroundColor(.white.opacity(0.3))
            }
            Text(data.rankTitle.uppercased())
                .font(.system(size: 9, weight: .semibold)).tracking(1.5)
                .foregroundColor(.white.opacity(0.7))
        }
        .lineLimit(1).minimumScaleFactor(0.8)
    }
}

// MARK: - Medium view

private struct MediumView: View {
    let data: MethodData

    var body: some View {
        HStack(spacing: 0) {
            leftColumn
            Rectangle().fill(.white.opacity(0.10)).frame(width: 1).padding(.vertical, 4)
            rightColumn.padding(.leading, 14)
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(darkBg)
        .overlay(alignment: .top) { topShine.frame(height: 32).clipped() }
    }

    private var leftColumn: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("method.").font(.system(size: 11, weight: .light)).foregroundColor(.white.opacity(0.45))
            Spacer()
            Text("\(data.totalEarned)")
                .font(.system(size: 36, weight: .bold)).foregroundColor(.white).minimumScaleFactor(0.6)
            HStack(spacing: 4) {
                WeekDotsView(weekActivity: data.weekActivity, size: 7)
                if data.currentStreak > 0 {
                    Text("Day \(data.currentStreak)")
                        .font(.system(size: 9, weight: .medium)).foregroundColor(.white.opacity(0.4))
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var rightColumn: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 3) {
                if !data.personaName.isEmpty {
                    Text(data.personaName.uppercased())
                        .font(.system(size: 9, weight: .medium)).tracking(2).foregroundColor(.white.opacity(0.5))
                    Text("·").font(.system(size: 9)).foregroundColor(.white.opacity(0.3))
                }
                Text(data.rankTitle.uppercased())
                    .font(.system(size: 9, weight: .semibold)).tracking(1.5).foregroundColor(.white.opacity(0.7))
            }
            .lineLimit(1).minimumScaleFactor(0.8)
            Spacer()
            rankProgressSection
            if data.daysRemaining > 0 {
                Text("\(data.daysRemaining) days to goal")
                    .font(.system(size: 10, weight: .light)).foregroundColor(.white.opacity(0.4))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var rankProgressSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3).fill(.white.opacity(0.08)).frame(height: 5)
                    RoundedRectangle(cornerRadius: 3).fill(.white.opacity(0.85))
                        .frame(width: max(0, geo.size.width * CGFloat(data.rankPercent)), height: 5)
                }
            }
            .frame(height: 5)
            Text(data.nextRankTitle.isEmpty ? "MAX RANK" : "\(data.meritToNext) to \(data.nextRankTitle.uppercased())")
                .font(.system(size: 9, weight: .semibold)).tracking(1)
                .foregroundColor(.white.opacity(0.65)).lineLimit(1).minimumScaleFactor(0.7)
        }
    }
}

// MARK: - Entry view (family switch)

struct MethodEntryView: View {
    let entry: MethodEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemMedium: MediumView(data: entry.data)
        default:            SmallView(data: entry.data)
        }
    }
}

// MARK: - Widget declaration

struct MethodWidget: Widget {
    let kind = "MethodWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MethodProvider()) { entry in
            MethodEntryView(entry: entry)
                .containerBackground(darkBg, for: .widget)
        }
        .configurationDisplayName("Method")
        .description("Your rank, merit, and streak.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add plugins/swift/MethodWidget.swift
git commit -m "feat(widgets): small + medium WidgetKit views"
git push origin main
```

---

## Task 8: MethodLiveActivityWidget.swift — Dynamic Island + lock screen

**Files:**
- Create: `plugins/swift/MethodLiveActivityWidget.swift`

- [ ] **Step 1: Create the file**

```swift
// plugins/swift/MethodLiveActivityWidget.swift
import SwiftUI
import WidgetKit
import ActivityKit

private func fmt(_ secs: Int) -> String {
    String(format: "%02d:%02d", secs / 60, secs % 60)
}

@available(iOS 16.2, *)
struct MethodLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: MethodLiveActivityAttributes.self) { context in
            LockScreenView(state: context.state, attrs: context.attributes)
                .containerBackground(Color(red: 0.102, green: 0.102, blue: 0.102), for: .widget)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("LOCKED IN")
                            .font(.system(size: 9, weight: .semibold)).tracking(3)
                            .foregroundColor(.white.opacity(0.5))
                        HStack(spacing: 3) {
                            if !context.attributes.personaName.isEmpty {
                                Text(context.attributes.personaName)
                                    .font(.system(size: 10, weight: .medium)).tracking(1)
                                    .foregroundColor(.white.opacity(0.7))
                                Text("·").foregroundColor(.white.opacity(0.3))
                            }
                            Text(context.attributes.rankTitle)
                                .font(.system(size: 10, weight: .medium))
                                .foregroundColor(.white.opacity(0.7))
                        }
                        .lineLimit(1).minimumScaleFactor(0.8)
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(fmt(context.state.timeRemaining))
                        .font(.system(size: 26, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    if context.state.timeRemaining == 0 && context.state.projectedMerit > 0 {
                        Text("+\(context.state.projectedMerit) MERIT EARNED")
                            .font(.system(size: 12, weight: .semibold)).tracking(1)
                            .foregroundColor(.white.opacity(0.85))
                    } else {
                        Text("+ \(context.state.projectedMerit) MERIT INCOMING")
                            .font(.system(size: 11, weight: .light)).tracking(0.5)
                            .foregroundColor(.white.opacity(0.65))
                    }
                }
            } compactLeading: {
                Text("₦")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)
            } compactTrailing: {
                Text(fmt(context.state.timeRemaining))
                    .font(.system(size: 13, weight: .bold, design: .monospaced))
                    .foregroundColor(.white)
            } minimal: {
                Text(fmt(context.state.timeRemaining))
                    .font(.system(size: 11, weight: .bold, design: .monospaced))
                    .foregroundColor(.white)
            }
        }
    }
}

@available(iOS 16.2, *)
private struct LockScreenView: View {
    let state: MethodLiveActivityAttributes.ContentState
    let attrs: MethodLiveActivityAttributes

    var body: some View {
        HStack(alignment: .center, spacing: 0) {
            VStack(alignment: .leading, spacing: 5) {
                Text("method.")
                    .font(.system(size: 11, weight: .light)).foregroundColor(.white.opacity(0.45))
                Text(personaLine)
                    .font(.system(size: 12, weight: .medium)).foregroundColor(.white.opacity(0.7))
                    .lineLimit(1).minimumScaleFactor(0.8)
                sessionProgress
                Text(footerText)
                    .font(.system(size: 10, weight: .light)).foregroundColor(.white.opacity(0.45))
            }
            Spacer()
            Text(fmt(state.timeRemaining))
                .font(.system(size: 40, weight: .bold, design: .monospaced))
                .foregroundColor(.white)
        }
        .padding(16)
        .background(Color(red: 0.102, green: 0.102, blue: 0.102))
    }

    private var personaLine: String {
        attrs.personaName.isEmpty
            ? attrs.rankTitle
            : "\(attrs.personaName) is locked in · \(attrs.rankTitle)"
    }

    private var footerText: String {
        state.timeRemaining == 0 && state.projectedMerit > 0
            ? "+\(state.projectedMerit) merit earned"
            : "earning up to \(state.projectedMerit) merit"
    }

    private var sessionProgress: some View {
        GeometryReader { geo in
            let total    = Double(attrs.intervalMinutes * 60)
            let elapsed  = max(0, total - Double(state.timeRemaining))
            let progress = total > 0 ? elapsed / total : 0
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 3).fill(.white.opacity(0.08)).frame(height: 4)
                RoundedRectangle(cornerRadius: 3).fill(.white.opacity(0.7))
                    .frame(width: geo.size.width * progress, height: 4)
            }
        }
        .frame(height: 4)
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add plugins/swift/MethodLiveActivityWidget.swift
git commit -m "feat(widgets): Live Activity Dynamic Island + lock screen views"
git push origin main
```

---

## Task 9: MethodSharedDataModule.swift + MethodLiveActivityModule.swift

**Files:**
- Create: `plugins/swift/MethodSharedDataModule.swift`
- Create: `plugins/swift/MethodLiveActivityModule.swift`

These go in the **main app target** (not the extension). They use `expo-modules-core`.

- [ ] **Step 1: Create MethodSharedDataModule.swift**

```swift
// plugins/swift/MethodSharedDataModule.swift
import ExpoModulesCore
import WidgetKit

public class MethodSharedDataModule: Module {
    public func definition() -> ModuleDefinition {
        Name("MethodSharedData")

        AsyncFunction("update") { (data: [String: Any]) in
            guard let defaults = UserDefaults(suiteName: "group.com.darrentabago.method") else {
                throw Exception(name: "AppGroupError", description: "App Group not accessible")
            }
            for (key, value) in data {
                defaults.set(value, forKey: key)
            }
            defaults.synchronize()
            WidgetCenter.shared.reloadAllTimelines()
        }
    }
}
```

- [ ] **Step 2: Create MethodLiveActivityModule.swift**

```swift
// plugins/swift/MethodLiveActivityModule.swift
import ExpoModulesCore
import ActivityKit

public class MethodLiveActivityModule: Module {
    // Stored as opaque Any to avoid @available version gymnastics on the property itself
    private var activityId: String?

    public func definition() -> ModuleDefinition {
        Name("MethodLiveActivity")

        AsyncFunction("start") { (params: [String: Any]) in
            guard #available(iOS 16.2, *) else { return }
            let attrs = MethodLiveActivityAttributes(
                personaName:     params["personaName"] as? String ?? "",
                rankTitle:       params["rankTitle"] as? String ?? "",
                intervalMinutes: params["intervalMinutes"] as? Int ?? 25
            )
            let projected = params["projectedMerit"] as? Int ?? 25
            let state     = MethodLiveActivityAttributes.ContentState(
                timeRemaining: attrs.intervalMinutes * 60,
                projectedMerit: projected
            )
            let content  = ActivityContent(state: state, staleDate: nil)
            let activity = try Activity<MethodLiveActivityAttributes>.request(
                attributes: attrs, content: content
            )
            self.activityId = activity.id
        }

        AsyncFunction("update") { (timeRemaining: Int) in
            guard #available(iOS 16.2, *), let id = self.activityId else { return }
            guard let activity = Activity<MethodLiveActivityAttributes>
                .activities.first(where: { $0.id == id }) else { return }
            let projected = activity.content.state.projectedMerit
            let newState  = MethodLiveActivityAttributes.ContentState(
                timeRemaining: timeRemaining,
                projectedMerit: projected
            )
            await activity.update(ActivityContent(state: newState, staleDate: nil))
        }

        AsyncFunction("end") { (earnedMerit: Int) in
            guard #available(iOS 16.2, *), let id = self.activityId else { return }
            guard let activity = Activity<MethodLiveActivityAttributes>
                .activities.first(where: { $0.id == id }) else { return }
            let finalState = MethodLiveActivityAttributes.ContentState(
                timeRemaining: 0, projectedMerit: earnedMerit
            )
            let policy: ActivityUIDismissalPolicy = earnedMerit > 0
                ? .after(.now + 4)
                : .immediate
            await activity.end(ActivityContent(state: finalState, staleDate: nil), dismissalPolicy: policy)
            self.activityId = nil
        }
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add plugins/swift/MethodSharedDataModule.swift plugins/swift/MethodLiveActivityModule.swift
git commit -m "feat(widgets): expo-modules-core native modules for App Group + ActivityKit"
git push origin main
```

---

## Task 10: MethodModulesProvider.swift (registers our modules alongside Expo's)

**Files:**
- Create: `plugins/swift/MethodModulesProvider.swift`

This file is copied to the **main app target**. It chains our modules with everything Expo auto-generates in `ExpoModulesProvider`.

- [ ] **Step 1: Create the file**

```swift
// plugins/swift/MethodModulesProvider.swift
import ExpoModulesCore

class MethodModulesProvider: ModulesProvider {
    override func getModuleClasses() -> [AnyModule.Type] {
        ExpoModulesProvider().getModuleClasses() + [
            MethodSharedDataModule.self,
            MethodLiveActivityModule.self,
        ]
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add plugins/swift/MethodModulesProvider.swift
git commit -m "feat(widgets): MethodModulesProvider chains custom modules with expo modules"
git push origin main
```

---

## Task 11: Config plugin — file copying (withDangerousMod)

**Files:**
- Modify: `plugins/withMethodWidgets.js`

This mod runs during `expo prebuild` / `expo run:ios` and copies all Swift files to the right ios/ subdirectories. It also modifies `AppDelegate.swift` to use `MethodModulesProvider`.

- [ ] **Step 1: Add `withWidgetFiles` and `withAppDelegateProvider` to the plugin**

Replace the entire file:

```javascript
// plugins/withMethodWidgets.js
const {
  withEntitlementsPlist,
  withInfoPlist,
  withDangerousMod,
  withXcodeProject,
  withPodfile,
} = require('@expo/config-plugins');
const path = require('path');
const fs   = require('fs');

const APP_GROUP           = 'group.com.darrentabago.method';
const EXTENSION_NAME      = 'MethodWidget';
const EXTENSION_BUNDLE_ID = 'com.darrentabago.method.MethodWidget';
const SWIFT_DIR           = path.join(__dirname, 'swift');

// ── composed entry ────────────────────────────────────────────────────────────
function withMethodWidgets(config) {
  config = withAppGroupEntitlement(config);
  config = withLiveActivityInfoPlist(config);
  config = withWidgetFiles(config);
  // Tasks 12-13 will add: withXcodeTarget, withPodfileRegistration
  return config;
}

// ── 1. App Group entitlement ─────────────────────────────────────────────────
function withAppGroupEntitlement(config) {
  return withEntitlementsPlist(config, (c) => {
    const key = 'com.apple.security.application-groups';
    const existing = c.modResults[key] ?? [];
    if (!existing.includes(APP_GROUP)) {
      c.modResults[key] = [...existing, APP_GROUP];
    }
    return c;
  });
}

// ── 2. Live Activity Info.plist keys ─────────────────────────────────────────
function withLiveActivityInfoPlist(config) {
  return withInfoPlist(config, (c) => {
    c.modResults.NSSupportsLiveActivities = true;
    c.modResults.NSSupportsLiveActivitiesFrequentUpdates = false;
    return c;
  });
}

// ── 3. Copy Swift files ───────────────────────────────────────────────────────
function withWidgetFiles(config) {
  return withDangerousMod(config, [
    'ios',
    async (c) => {
      const root    = c.modRequest.projectRoot;
      const appName = c.modRequest.projectName;

      // Extension directory
      const extDir = path.join(root, 'ios', EXTENSION_NAME);
      fs.mkdirSync(extDir, { recursive: true });

      // Extension Swift source files
      const extFiles = [
        'MethodWidgetBundle.swift',
        'MethodWidget.swift',
        'MethodLiveActivityAttributes.swift',
        'MethodLiveActivityWidget.swift',
        'MethodSharedData.swift',
      ];
      for (const f of extFiles) {
        fs.copyFileSync(path.join(SWIFT_DIR, f), path.join(extDir, f));
      }

      // Extension Info.plist
      fs.writeFileSync(path.join(extDir, 'Info.plist'), extensionInfoPlist());

      // Extension entitlements
      fs.writeFileSync(
        path.join(extDir, `${EXTENSION_NAME}.entitlements`),
        extensionEntitlements()
      );

      // Main app: native module Swift files
      const appDir = path.join(root, 'ios', appName);
      const moduleFiles = [
        'MethodSharedDataModule.swift',
        'MethodLiveActivityModule.swift',
        'MethodModulesProvider.swift',
        'MethodLiveActivityAttributes.swift', // needed by the module
      ];
      for (const f of moduleFiles) {
        fs.copyFileSync(path.join(SWIFT_DIR, f), path.join(appDir, f));
      }

      // Patch AppDelegate.swift to use MethodModulesProvider
      const delegatePath = path.join(appDir, 'AppDelegate.swift');
      if (fs.existsSync(delegatePath)) {
        let src = fs.readFileSync(delegatePath, 'utf8');
        if (!src.includes('MethodModulesProvider')) {
          // Insert override before the closing brace of the class
          src = src.replace(
            /^(}\s*)$/m,
            `  override func modulesProvider() -> ModulesProvider {\n    return MethodModulesProvider()\n  }\n$1`
          );
          fs.writeFileSync(delegatePath, src, 'utf8');
        }
      }

      return c;
    },
  ]);
}

// ── helpers ───────────────────────────────────────────────────────────────────
function extensionInfoPlist() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key><string>$(DEVELOPMENT_LANGUAGE)</string>
  <key>CFBundleDisplayName</key><string>MethodWidget</string>
  <key>CFBundleExecutable</key><string>$(EXECUTABLE_NAME)</string>
  <key>CFBundleIdentifier</key><string>${EXTENSION_BUNDLE_ID}</string>
  <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
  <key>CFBundleName</key><string>$(PRODUCT_NAME)</string>
  <key>CFBundlePackageType</key><string>XPC!</string>
  <key>CFBundleShortVersionString</key><string>$(MARKETING_VERSION)</string>
  <key>CFBundleVersion</key><string>$(CURRENT_PROJECT_VERSION)</string>
  <key>NSExtension</key>
  <dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.widgetkit-extension</string>
  </dict>
  <key>NSSupportsLiveActivities</key><true/>
  <key>NSSupportsLiveActivitiesFrequentUpdates</key><false/>
</dict>
</plist>`;
}

function extensionEntitlements() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.application-groups</key>
  <array>
    <string>${APP_GROUP}</string>
  </array>
</dict>
</plist>`;
}

module.exports = withMethodWidgets;
```

- [ ] **Step 2: Verify plugin still loads**

```bash
node -e "require('./plugins/withMethodWidgets.js'); console.log('OK')"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add plugins/withMethodWidgets.js
git commit -m "feat(widgets): config plugin file copying + AppDelegate patch"
git push origin main
```

---

## Task 12: Config plugin — Xcode extension target (withXcodeProject)

**Files:**
- Modify: `plugins/withMethodWidgets.js`

Adds the `MethodWidget` extension target to the Xcode project, sets build settings, and links WidgetKit + ActivityKit.

- [ ] **Step 1: Add `withXcodeTarget` to the plugin**

Add this function before `module.exports`, and add `config = withXcodeTarget(config);` inside `withMethodWidgets`:

```javascript
// Add this line in withMethodWidgets():
//   config = withXcodeTarget(config);
// Add before module.exports:

function withXcodeTarget(config) {
  return withXcodeProject(config, (c) => {
    const project = c.modResults;
    const appName = c.modRequest.projectName;

    // Idempotency: skip if target already exists
    const targets = project.pbxNativeTargetSection();
    const alreadyExists = Object.values(targets).some(
      (t) => t && (t.name === EXTENSION_NAME || t.name === `"${EXTENSION_NAME}"`)
    );
    if (alreadyExists) return c;

    // Add extension target
    const extTarget = project.addTarget(
      EXTENSION_NAME,
      'app_extension',
      EXTENSION_NAME,
      EXTENSION_BUNDLE_ID
    );

    // Set build settings on all configurations for this target
    const buildConfigs   = project.pbxXCBuildConfigurationSection();
    const configListUuid = extTarget.pbxNativeTarget.buildConfigurationList;
    const configList     = project.pbxXCConfigurationList()[configListUuid];

    (configList.buildConfigurations || []).forEach(({ value: cfgUuid }) => {
      const bc = buildConfigs[cfgUuid];
      if (!bc || !bc.buildSettings) return;
      bc.buildSettings.SWIFT_VERSION                  = '"5.0"';
      bc.buildSettings.IPHONEOS_DEPLOYMENT_TARGET     = '"16.2"';
      bc.buildSettings.INFOPLIST_FILE                 = `"${EXTENSION_NAME}/Info.plist"`;
      bc.buildSettings.CODE_SIGN_ENTITLEMENTS         = `"${EXTENSION_NAME}/${EXTENSION_NAME}.entitlements"`;
      bc.buildSettings.PRODUCT_BUNDLE_IDENTIFIER      = `"${EXTENSION_BUNDLE_ID}"`;
      bc.buildSettings.SKIP_INSTALL                   = 'YES';
      bc.buildSettings.TARGETED_DEVICE_FAMILY         = '"1,2"';
      bc.buildSettings.MARKETING_VERSION              = '"1.0"';
      bc.buildSettings.CURRENT_PROJECT_VERSION        = '"1"';
    });

    // Add PBX group for extension files
    const extGroup = project.addPbxGroup([], EXTENSION_NAME, EXTENSION_NAME);
    const rootGroupUuid = project.getFirstProject().firstProject.mainGroup;
    project.addToPbxGroup(extGroup.uuid, rootGroupUuid);

    // Add Swift source files to extension target
    const extSources = [
      'MethodWidgetBundle.swift',
      'MethodWidget.swift',
      'MethodLiveActivityAttributes.swift',
      'MethodLiveActivityWidget.swift',
      'MethodSharedData.swift',
    ];
    for (const f of extSources) {
      project.addSourceFile(
        `${EXTENSION_NAME}/${f}`,
        { target: extTarget.uuid },
        extGroup.uuid
      );
    }

    // Link WidgetKit and ActivityKit
    project.addFramework('WidgetKit.framework', {
      target: extTarget.uuid, link: true,
    });
    project.addFramework('ActivityKit.framework', {
      target: extTarget.uuid, link: true,
    });

    // Add native module Swift files to main app target
    const mainTarget = project.getFirstTarget().firstTarget;
    const moduleFiles = [
      'MethodSharedDataModule.swift',
      'MethodLiveActivityModule.swift',
      'MethodModulesProvider.swift',
      'MethodLiveActivityAttributes.swift',
    ];
    for (const f of moduleFiles) {
      project.addSourceFile(`${appName}/${f}`, { target: mainTarget.uuid });
    }

    return c;
  });
}
```

Also update `withMethodWidgets` to call it:
```javascript
function withMethodWidgets(config) {
  config = withAppGroupEntitlement(config);
  config = withLiveActivityInfoPlist(config);
  config = withWidgetFiles(config);
  config = withXcodeTarget(config);
  // Task 13 will add: withPodfileRegistration
  return config;
}
```

- [ ] **Step 2: Verify plugin still loads**

```bash
node -e "require('./plugins/withMethodWidgets.js'); console.log('OK')"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add plugins/withMethodWidgets.js
git commit -m "feat(widgets): config plugin Xcode extension target setup"
git push origin main
```

---

## Task 13: Config plugin — Podfile module registration (withPodfile)

**Files:**
- Modify: `plugins/withMethodWidgets.js`

Injects a `post_install` snippet into the Podfile that appends `MethodSharedDataModule` and `MethodLiveActivityModule` into the auto-generated `ExpoModulesProvider.swift` after `pod install` creates it.

- [ ] **Step 1: Add `withPodfileRegistration` to the plugin**

Add before `module.exports`:

```javascript
function withPodfileRegistration(config) {
  return withPodfile(config, (c) => {
    const snippet = `
# Method: register custom native modules in ExpoModulesProvider
post_install do |installer|
  provider_path = File.join(File.dirname(__FILE__), '${config.modRequest?.projectName ?? 'Method'}', 'ExpoModulesProvider.swift')
  if File.exist?(provider_path)
    content = File.read(provider_path)
    unless content.include?('MethodSharedDataModule')
      content.sub!(
        /(\\s+return \\[)/,
        "\\n      MethodSharedDataModule.self,\\n      MethodLiveActivityModule.self,\\1"
      )
      File.write(provider_path, content)
    end
  end
end
`;
    if (!c.modResults.includes('MethodSharedDataModule')) {
      c.modResults += snippet;
    }
    return c;
  });
}
```

Update `withMethodWidgets` to add the call:
```javascript
function withMethodWidgets(config) {
  config = withAppGroupEntitlement(config);
  config = withLiveActivityInfoPlist(config);
  config = withWidgetFiles(config);
  config = withXcodeTarget(config);
  config = withPodfileRegistration(config);
  return config;
}
```

- [ ] **Step 2: Verify plugin loads**

```bash
node -e "require('./plugins/withMethodWidgets.js'); console.log('OK')"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add plugins/withMethodWidgets.js
git commit -m "feat(widgets): config plugin Podfile post_install for module registration"
git push origin main
```

---

## Task 14: Integration — stats.ts + persona.ts

**Files:**
- Modify: `src/storage/stats.ts`
- Modify: `src/storage/persona.ts`

Call `updateSharedData` after any stats change so the widget always reflects current state.

- [ ] **Step 1: Update stats.ts**

Add import at the top of `src/storage/stats.ts`:
```typescript
import { updateSharedData, buildSnapshot } from '../modules/SharedData';
import { loadPersona } from './persona';
```

At the end of `recordSession` (after `await saveStats(stats)`), add:
```typescript
  const persona = await loadPersona();
  updateSharedData(buildSnapshot(stats, persona)).catch(() => {});
  return stats;
```

At the end of `recordAbandon` (after `await saveStats(stats)`), add:
```typescript
  const persona = await loadPersona();
  updateSharedData(buildSnapshot(stats, persona)).catch(() => {});
  return stats;
```

The full updated `stats.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SessionStats } from '../types';
import { updateSharedData, buildSnapshot } from '../modules/SharedData';
import { loadPersona } from './persona';

const STATS_KEY = '@method/stats';

export const ABANDON_PENALTY = 10;

export const DEFAULT_STATS: SessionStats = {
  totalEarned: 0,
  sessionsCompleted: 0,
  sessionsAbandoned: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastSessionDate: '',
  totalMinutes: 0,
  dailySessions: {},
};

export const loadStats = async (): Promise<SessionStats> => {
  const raw = await AsyncStorage.getItem(STATS_KEY);
  if (!raw) return { ...DEFAULT_STATS };
  try {
    return { ...DEFAULT_STATS, ...(JSON.parse(raw) as Partial<SessionStats>) };
  } catch {
    return { ...DEFAULT_STATS };
  }
};

const saveStats = async (stats: SessionStats): Promise<void> => {
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

export const recordSession = async (
  dateStr: string,
  earnedAmount: number,
  intervalMinutes: number
): Promise<SessionStats> => {
  const stats = await loadStats();
  stats.totalEarned       += earnedAmount;
  stats.sessionsCompleted += 1;
  stats.totalMinutes      += intervalMinutes;
  stats.dailySessions      = stats.dailySessions ?? {};
  stats.dailySessions[dateStr] = (stats.dailySessions[dateStr] ?? 0) + 1;

  if (stats.lastSessionDate !== dateStr) {
    const isConsecutive  = isYesterday(stats.lastSessionDate, dateStr);
    stats.currentStreak  = isConsecutive ? stats.currentStreak + 1 : 1;
    stats.longestStreak  = Math.max(stats.longestStreak, stats.currentStreak);
    stats.lastSessionDate = dateStr;
  }

  await saveStats(stats);
  const persona = await loadPersona();
  updateSharedData(buildSnapshot(stats, persona)).catch(() => {});
  return stats;
};

export const recordAbandon = async (): Promise<SessionStats> => {
  const stats = await loadStats();
  stats.sessionsAbandoned += 1;
  stats.totalEarned        = Math.max(0, stats.totalEarned - ABANDON_PENALTY);
  await saveStats(stats);
  const persona = await loadPersona();
  updateSharedData(buildSnapshot(stats, persona)).catch(() => {});
  return stats;
};

function isYesterday(prevDate: string, today: string): boolean {
  if (!prevDate) return false;
  const prev = new Date(prevDate);
  const curr = new Date(today);
  return curr.getTime() - prev.getTime() === 86400000;
}
```

- [ ] **Step 2: Update persona.ts**

Add import at top of `src/storage/persona.ts`:
```typescript
import { updateSharedData, buildSnapshot } from '../modules/SharedData';
import { loadStats } from './stats';
```

At the end of `savePersona` (after `await AsyncStorage.setItem(...)`), add:
```typescript
  const stats = await loadStats();
  updateSharedData(buildSnapshot(stats, withStart)).catch(() => {});
```

Full updated `persona.ts`:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PersonaData } from '../types';
import { updateSharedData, buildSnapshot } from '../modules/SharedData';
import { loadStats } from './stats';

const PERSONA_KEY  = '@method/persona';
const ONBOARDED_KEY = '@method/onboarded';

export const savePersona = async (data: PersonaData): Promise<void> => {
  const withStart: PersonaData = {
    ...data,
    startDate: data.startDate ?? new Date().toISOString().split('T')[0],
  };
  await AsyncStorage.setItem(PERSONA_KEY, JSON.stringify(withStart));
  const stats = await loadStats();
  updateSharedData(buildSnapshot(stats, withStart)).catch(() => {});
};

export const loadPersona = async (): Promise<PersonaData | null> => {
  const raw = await AsyncStorage.getItem(PERSONA_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PersonaData;
    if (!parsed.startDate) {
      parsed.startDate = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(PERSONA_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return null;
  }
};

export const clearPersona = async (): Promise<void> => {
  await AsyncStorage.removeItem(PERSONA_KEY);
};

export const isOnboarded = async (): Promise<boolean> => {
  return (await AsyncStorage.getItem(ONBOARDED_KEY)) === 'true';
};

export const setOnboarded = async (): Promise<void> => {
  await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
};
```

- [ ] **Step 3: Run the full test suite**

```bash
npx jest
```
Expected: All tests pass (no regressions from the import additions).

- [ ] **Step 4: Commit**

```bash
git add src/storage/stats.ts src/storage/persona.ts
git commit -m "feat(widgets): sync App Group after every stats/persona change"
git push origin main
```

---

## Task 15: Integration — FocusSessionScreen.tsx (Live Activity start/update/end)

**Files:**
- Modify: `src/screens/FocusSessionScreen.tsx`

- [ ] **Step 1: Add imports at the top of FocusSessionScreen.tsx**

After the existing imports, add:
```typescript
import { startLiveActivity, updateLiveActivity, endLiveActivity } from '../modules/LiveActivity';
import { loadPersona } from '../storage/persona';
import { loadStats } from '../storage/stats';
import { getRankProgress } from '../utils/ranks';
```

- [ ] **Step 2: Add Live Activity start inside useFocusEffect**

In `useFocusEffect`, after `loadInterval().then(setIntervalMinutes);`, add:
```typescript
      Promise.all([loadPersona(), loadStats()]).then(([persona, stats]) => {
        const rank = getRankProgress(stats.totalEarned).current;
        startLiveActivity({
          personaName:    persona?.name ?? '',
          rankTitle:      rank.title,
          intervalMinutes: DEV_SECONDS_OVERRIDE ? 1 : intervalMinutes,
          projectedMerit: calculateMerit(intervalMinutes),
        });
      });
```

- [ ] **Step 3: Add updateLiveActivity to the timer tick**

In the `setInterval` callback inside `startTimer`, replace:
```typescript
      } else {
        setTimeLeft(remaining);
      }
```
with:
```typescript
      } else {
        setTimeLeft(remaining);
        updateLiveActivity(remaining);
      }
```

- [ ] **Step 4: Add endLiveActivity on session complete**

Inside `startTimer`, before `nav.replace('SessionComplete', ...)`, add:
```typescript
        const earned = calculateMerit(intervalMinutes);
        endLiveActivity(earned);
        nav.replace('SessionComplete', {
          earnedThisSession: earned,
          intervalMinutes,
        });
```
Remove the existing duplicate `calculateMerit` call so merit is only calculated once.

- [ ] **Step 5: Add endLiveActivity on abandon**

In `handleEndSession`'s destructive onPress, before `nav.goBack()`, add:
```typescript
            await endLiveActivity(0);
```

- [ ] **Step 6: Run the test suite to verify no regressions**

```bash
npx jest
```
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/screens/FocusSessionScreen.tsx
git commit -m "feat(widgets): wire Live Activity start/update/end to focus session timer"
git push origin main
```

---

## Task 16: Register plugin in app.json + Mac build instructions

**Files:**
- Modify: `app.json`

- [ ] **Step 1: Add the plugin to app.json**

Open `app.json`. In the `"expo"` object, add or update the `"plugins"` array:

```json
{
  "expo": {
    "name": "Method",
    "slug": "method",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#1A1A1A"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.darrentabago.method"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "./plugins/withMethodWidgets"
    ],
    "extra": {
      "eas": {
        "projectId": "YOUR_EAS_PROJECT_ID"
      }
    },
    "owner": "YOUR_EXPO_ACCOUNT"
  }
}
```

- [ ] **Step 2: Run final test suite**

```bash
npx jest
```
Expected: All tests pass.

- [ ] **Step 3: Commit and push**

```bash
git add app.json
git commit -m "feat(widgets): register withMethodWidgets config plugin"
git push origin main
```

- [ ] **Step 4: Build on Mac (manual step — do on Mac, not Windows)**

On the Mac, pull and build:
```bash
cd "App Project/method"
git pull
npx expo run:ios --device
```

During this build, the plugin runs in sequence:
1. Adds App Group entitlement + Live Activity Info.plist keys
2. Copies Swift files to `ios/MethodWidget/` and `ios/Method/`
3. Adds the `MethodWidget` extension target to the Xcode project
4. Appends a `post_install` hook to the Podfile

After `pod install` runs, the hook appends `MethodSharedDataModule.self` and `MethodLiveActivityModule.self` into `ExpoModulesProvider.swift`. Xcode then compiles all of this together.

- [ ] **Step 5: Add widget to home screen and verify**

On the simulator or device after install:
1. Long-press home screen → tap `+` → search "Method"
2. Verify small widget shows rank title + merit number + 7 week dots
3. Verify medium widget shows rank progress bar + days to goal
4. Run a focus session in the app → Dynamic Island should show `₦  LOCKED IN  24:13`
5. Long-press Dynamic Island → expanded view should show persona name, rank, timer, and "MERIT INCOMING"
6. Let the session complete → Live Activity briefly shows `+N MERIT EARNED` then dismisses

- [ ] **Step 6: Verify App Group data flows correctly**

After completing a session, open the widget (or check it from the home screen). The merit total should reflect the newly earned amount without reopening the app. If it doesn't update within a few seconds, check that `WidgetCenter.reloadAllTimelines()` is being reached in `MethodSharedDataModule.swift`.

---

## Troubleshooting Guide

**`modulesProvider()` not found as override target**
If the build errors saying `MethodModulesProvider` can't find `ExpoModulesProvider`, it means `ExpoModulesProvider.swift` wasn't modified by the Podfile hook. Check if the `post_install` block was added to the Podfile at `ios/Podfile` and that the file path pattern matches your generated `ExpoModulesProvider.swift`.

**Widget appears but shows blank / zero data**
The App Group entitlement must match exactly. Open the generated `ios/Method/Method.entitlements` and `ios/MethodWidget/MethodWidget.entitlements` and verify both contain `group.com.darrentabago.method`. If missing, check `withAppGroupEntitlement` ran correctly.

**`ActivityKit` framework not found**
ActivityKit requires iOS 16.2+. If the extension target's deployment target is below 16.2, the build will fail. The build settings in `withXcodeTarget` set `IPHONEOS_DEPLOYMENT_TARGET = "16.2"`. Verify this in the generated Xcode project under the `MethodWidget` target → Build Settings → Deployment Target.

**`withPodfile` Podfile injection regex doesn't match**
If the generated `ExpoModulesProvider.swift` has a format different from `return [`, open it on the Mac after `pod install` and update the regex in `withPodfileRegistration` to match the actual format. The substitution must target the opening of the return array.

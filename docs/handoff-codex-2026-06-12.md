# Method App — Codex Handoff (2026-06-12)

## What This Is

**Method** is a React Native iOS focus/productivity app (Expo SDK 54, managed workflow, `newArchEnabled: true`). Users lock into timed focus sessions to earn "Merit$", climb a rank ladder, and build streaks. The app is built iOS-first and deployed via TestFlight.

- **Repo:** `App Project/method/` — default branch `main`
- **Push target:** `git push origin main`
- **Build workflow:** Edit on Windows → `git push` → Mac does `git pull && npx expo prebuild --clean && npx expo run:ios`

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React Native + Expo SDK 54, managed workflow |
| Architecture | `newArchEnabled: true` (Fabric + JSI) |
| Navigation | `@react-navigation/stack` |
| Animations | `react-native-reanimated` v4 — `useSharedValue`, `useAnimatedStyle`, `withTiming`, `withDelay`, `withSequence`, `withSpring`, `Easing`, `runOnJS` |
| Gestures | `react-native-gesture-handler` v2.28 — `Gesture.Pan()`, `GestureDetector`, `GestureHandlerRootView` (REQUIRED at root for new arch) |
| Storage | `@react-native-async-storage/async-storage` |
| Purchases | `react-native-purchases` (RevenueCat) |
| Native modules | `expo-modules-core` — `requireNativeModule` wrapped in try/catch |
| Screen capture | `react-native-view-shot` — `captureScreen()` |
| Sharing | `expo-sharing` — `Sharing.shareAsync()` |
| Blur | `expo-blur` — `BlurView` |
| Masked view | `@react-native-masked-view/masked-view` |
| Icons | `@expo/vector-icons` — `Ionicons`, `MaterialCommunityIcons` |
| Haptics | `expo-haptics` |

---

## Key Directories

```
method/
├── App.tsx                          # Root — GestureHandlerRootView wraps everything
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx           # Main dashboard: balance, rank bar, stat pills, start session
│   │   ├── FocusSessionScreen.tsx   # Active timer: liquid glass digits, slideshow BG, music bar
│   │   ├── SessionCompleteScreen.tsx # Post-session: merit earned, money rain, rank progress
│   │   ├── SettingsScreen.tsx       # Persona, Pro status, developer tools
│   │   ├── OnboardingScreen.tsx     # First-run persona setup
│   │   └── BreakScreen.tsx          # Post-session break
│   ├── components/
│   │   ├── RankUpCard.tsx           # Full-screen modal: animated rank-up ceremony
│   │   ├── SessionPickerModal.tsx   # Bottom sheet: session duration picker (15/30/60/custom)
│   │   ├── ShareCard.tsx            # Share progress modal: screenshot + expo-sharing
│   │   ├── MeritAmount.tsx          # Merit symbol + number display
│   │   ├── RankProgressBar.tsx      # XP-style progress bar
│   │   ├── PillButton.tsx           # Primary/secondary pill CTA
│   │   └── WeekStrip.tsx            # 7-day session activity strip
│   ├── storage/
│   │   ├── stats.ts                 # loadStats, recordSession, recordAbandon, resetStats
│   │   └── settings.ts             # loadInterval, saveInterval
│   ├── utils/
│   │   ├── ranks.ts                 # RANKS array, getRankProgress, didRankUp
│   │   ├── merit.ts                 # calculateMerit, meritRangeLabel
│   │   └── affirmations.ts         # getRankAffirmation
│   ├── modules/
│   │   ├── SharedData.ts            # Native widget data bridge (crash-safe)
│   │   └── LiveActivity.ts          # Live Activity bridge (crash-safe)
│   ├── services/
│   │   ├── purchases.ts             # checkAppUnlock via RevenueCat
│   │   └── audio.ts                 # playTrack, pauseAudio, etc.
│   ├── constants/
│   │   ├── colors.ts                # Colors.background, pureWhite, dim, glassBg, etc.
│   │   └── typography.ts            # Typography presets
│   └── types/
│       └── index.ts                 # SessionStats, PersonaData, RootStackParamList
└── modules/
    └── method-native/
        ├── expo-module.config.json  # Registers MethodSharedDataModule + MethodLiveActivityModule
        └── package.json
```

---

## SessionStats Shape

```typescript
type SessionStats = {
  totalEarned: number;
  sessionsCompleted: number;
  sessionsAbandoned: number;
  currentStreak: number;
  longestStreak: number;
  lastSessionDate: string;        // 'YYYY-MM-DD'
  totalMinutes: number;
  dailySessions: Record<string, number>;
  dailyEarned: Record<string, number>;   // green merit per day
  dailyLost: Record<string, number>;     // red merit per day (abandon penalty)
};
```

---

## Core Game Mechanics

- **Merit earned:** `calculateMerit(intervalMinutes)` — longer sessions earn more
- **Abandon penalty:** `ABANDON_PENALTY = 10` merit docked, recorded in `dailyLost`
- **Rank system:** `RANKS` array in `src/utils/ranks.ts` — `getRankProgress(totalEarned)` returns `{ current, next, percent, meritToNext }`
- **Rank up:** `didRankUp(prevTotal, newTotal)` — returns new `Rank` or null
- **Free presets:** 15, 30, 60 minutes. Custom interval is a Pro feature.

---

## What Was Built This Session (both previous + current conversation)

### Native Module Fix
- `modules/method-native/expo-module.config.json` created — registers `MethodSharedDataModule` and `MethodLiveActivityModule` for autolinking
- `src/modules/SharedData.ts` and `LiveActivity.ts` — `requireNativeModule` wrapped in try/catch to prevent top-level crashes

### HomeScreen
- `StatPill` component: shows per-day `+X MERIT$` (green `#52C97A`) and `-X MERIT$` (red `#FF6B6B`)
- Rank progress bar right label: `"XXX MERIT$ TO RANK"`
- "Start Session" button opens `SessionPickerModal`

### SessionPickerModal (`src/components/SessionPickerModal.tsx`)
- Bottom sheet with swipe-down-to-dismiss (`Gesture.Pan()` + `GestureDetector`)
- 3 free duration tiles (15/30/60 min): tall cards, selected state = white bg + dark text
- Locked Custom row with PRO badge for free users; stepper for Pro users
- `GestureHandlerRootView` added to `App.tsx` root (required for new arch gestures)

### FocusSessionScreen
- Liquid glass timer: `MaskedView` + `BlurView intensity={90} tint="light"` + white fill + gradient
- Font: 86px bold digits, `digitEdge` rim glow + `digitGlow` halo
- `DEV_SECONDS_OVERRIDE = 10` — set to `null` before shipping

### SessionCompleteScreen
- Money rain: 12 `MoneyParticle` components using `MaterialCommunityIcons name="cash"` (banknote icon)
- Merit symbol scaling matches HomeScreen (70px earn, 22px total)
- "I'm done for today" link → `nav.navigate('Main')`
- Stores full `SessionStats` in state and passes to `RankUpCard` on rank-up

### RankUpCard (`src/components/RankUpCard.tsx`)
- Letter-by-letter stagger animation (58ms apart, starts 380ms after visible)
- Light sweep `LinearGradient` slides across title after letters land
- Glow layer fades in after letters
- **Stats row:** 3 frosted chips (SESSIONS · MERIT EARNED · LOCKED IN) fade in with footer
- **"Share This":** calls `captureScreen()` from `react-native-view-shot` → `Sharing.shareAsync()` as PNG
- `stats` prop is optional — Settings test passes real loaded stats

### SettingsScreen — Developer Section
- **Reset merits, sessions & rank:** Alert → `resetStats()` (wipes AsyncStorage to defaults)
- **Test rank up screen:** cycles through all ranks, passes real loaded stats to `RankUpCard`
- **Go to onboarding:** `nav.reset` to Onboarding

---

## Important Gotchas

1. **`newArchEnabled: true`** — `PanResponder` does NOT work. Always use `Gesture.Pan()` from `react-native-gesture-handler`. `GestureHandlerRootView` must wrap the entire app in `App.tsx`.

2. **Native modules** — always wrap `requireNativeModule` in try/catch. Top-level throws crash the JS bundle before React renders.

3. **Full prebuild required** after any native change — `npx expo prebuild --clean && npx expo run:ios`. Needed after: adding packages with native code, changing `App.tsx` root structure, or touching `modules/`.

4. **`DEV_SECONDS_OVERRIDE`** in `FocusSessionScreen.tsx:27` — currently set to `10` seconds for fast testing. Must be set to `null` before App Store submission.

5. **Merit symbol** in `MeritAmount` — uses a custom `M` glyph. The `symbolSize` prop scales it independently from the number text. HomeScreen uses 72/82 ratio (~0.878).

6. **Modal capture** — `captureScreen()` (not `captureRef`) is used for sharing because the rank-up card is inside a `Modal` which renders outside the normal view hierarchy.

---

## Pending / Not Yet Tested

- [ ] Verify `Cannot find native module 'MethodSharedData'` is resolved after clean prebuild on Mac
- [ ] Test widget (home screen widget updates after session complete)
- [ ] Test Live Activity (appears on lock screen during focus session)
- [ ] Test swipe-to-dismiss on session picker modal on device
- [ ] Test letter stagger + light sweep on rank-up screen on device
- [ ] Test "Share This" PNG screenshot share on device
- [ ] Set `DEV_SECONDS_OVERRIDE = null` before shipping

---

## What To Work On Next

The core session loop is complete. Likely next priorities:
- App Store submission prep (icons, screenshots, privacy policy, `DEV_SECONDS_OVERRIDE = null`)
- Method Pro IAP (RevenueCat product setup + paywall screen)
- Widget polish (if native module issues are resolved)
- Onboarding polish

---

## Build Commands (Mac)

```bash
# Standard hot-reload build
git pull && npx expo run:ios

# After any native changes (new packages, App.tsx root changes, modules/ changes)
git pull && npx expo prebuild --clean && npx expo run:ios

# Release build for TestFlight
npx expo prebuild --clean
npx expo run:ios --configuration Release
```

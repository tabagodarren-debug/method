# Claude Instructions — rn-app-template

This is a React Native / Expo (iOS-first) app template built by Darren. When starting a new project from this template, follow these instructions exactly.

---

## Stack

- React Native + Expo SDK 54 (managed workflow)
- TypeScript (strict)
- react-native-reanimated (animations)
- expo-blur (modal backdrops)
- RevenueCat / react-native-purchases (IAP)
- AsyncStorage (local data)
- PostHog (analytics)
- Sentry (crash reporting)
- EAS Build (cloud builds)

---

## Starting a New Project

### Step 1 — Rename everything
Find and replace these placeholders throughout the entire codebase:

| Placeholder | Replace with |
|---|---|
| `AppName` | Your app's display name (e.g. `Pulse`) |
| `app-name` | Kebab-case slug (e.g. `pulse`) |
| `com.yourcompany.appname` | Your bundle ID (e.g. `com.getpulse.app`) |
| `app_unlock` | Your RevenueCat entitlement ID (e.g. `pulse_unlock`) |
| `@app/` | Your AsyncStorage prefix (e.g. `@pulse/`) |
| `APP_PLUS_PRICE` | Keep the constant name, update fallback price |
| `YOUR_EAS_PROJECT_ID` | Your actual EAS project ID from expo.dev |

### Step 2 — Update app.json
- `name`, `slug`, `ios.bundleIdentifier`
- `splash.backgroundColor` — match your brand color
- `plugins` notification color

### Step 3 — Update colors
Edit `src/constants/colors.ts`:
- `primary` — main brand color (used everywhere)
- `accentColors` — tracker/chip accent palette

### Step 4 — Replace assets
- `assets/icon.png` — 1024×1024 app icon
- `assets/splash-icon.png` — portrait splash (1284×2778)
- `assets/adaptive-icon.png` — Android adaptive icon
- `assets/pip.png` — replace with your mascot or remove references

### Step 5 — Configure services
- **RevenueCat**: update `RC_IOS_KEY` in `src/services/purchases.ts`
- **PostHog**: update API key in `src/services/analytics.ts`
- **Sentry**: update DSN in `App.tsx`
- **EAS**: run `eas init` to link to your Expo account

### Step 6 — Customize onboarding
Edit the 4 onboarding screens in `src/screens/onboarding/`:
- `Onboarding1Hook.tsx` — hook/welcome screen (your value prop)
- `Onboarding2Name.tsx` — name collection (works as-is)
- `Onboarding3Question.tsx` — replace placeholder options with your app's question
- `Onboarding4AllSet.tsx` — final screen before main app

Update `src/context/OnboardingContext.tsx` if you need to collect additional fields beyond `name`.

### Step 7 — Build your screens
Replace the placeholder screens in `src/screens/`:
- `HomeScreen.tsx` — your main tab (currently shows greeting + welcome)
- `BrowseScreen.tsx` — your second tab
- Settings tab is already functional — keep and extend it

---

## Architecture Patterns

### Modals
All modals follow the same pattern — blur backdrop, animated slide-up/down, no close button, tap outside to dismiss:

```tsx
// Always use handleDismiss for closing, never call onClose directly
const handleDismiss = () => {
  Animated.timing(translateY, {
    toValue: 600,
    duration: 280,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  }).start(() => onClose());
};

// Backdrop
<BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill}>
  <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleDismiss} />
</BlurView>
```

### Navigation
- Stack navigators per tab (HomeStack, BrowseStack, SettingsStack)
- Tab bar uses `CustomTabBar` with sliding pill indicator
- Onboarding is a separate stack, replaced by `MainTabs` on completion

### Theme
```tsx
const { colors } = useTheme(); // always use theme colors, never hardcode
const themeId = useThemeId();  // 'light' | 'dark'
```

### Paywall
```tsx
const unlocked = await checkAppUnlock();
if (!unlocked) setShowPaywall(true);

<PaywallModal
  visible={showPaywall}
  onClose={() => setShowPaywall(false)}
  onUnlocked={() => { setShowPaywall(false); /* proceed */ }}
/>
```

### Analytics
```tsx
import { capture } from '../services/analytics';
capture('event_name', { property: 'value' });
```

---

## Dev Workflow

- **Windows** for code editing, **Mac** for simulator and builds
- Always `git push` after every code change (Mac pulls to test)
- Use `npx expo start --clear` to clear cache on Mac
- Use `eas build --platform ios --profile production` for TestFlight builds
- After build: `eas submit --platform ios --latest`

### Dev Tools (Settings screen)
The Settings screen has a hidden dev section (always visible — toggle with a flag if needed):
- Revoke app unlock (test paywall)

---

## What's Already Wired Up

- Dark/light theme toggle (persisted)
- Onboarding flow with name collection
- RevenueCat IAP (one-time purchase)
- Push notification scheduling
- AsyncStorage helpers
- Haptics + sound on key interactions
- Reduced motion support (respects iOS accessibility setting)
- App Store review prompt (trigger manually at milestone moments)
- Sentry crash reporting
- PostHog anonymous analytics

---

## ASO Notes (for App Store submission)

- App name format: `[Brand] — [Keyword] & [Keyword]` (e.g. `Pip — Symptom & Health Tracker`)
- Subtitle: max 30 chars, use high-intent keywords not in the title
- Keywords field: comma-separated, no spaces, 100 char limit
- Screenshots: 1320×2868px (6.9" required), purple/brand background, iPhone device frame
- First screenshot = hero slide (hand holding phone, bold headline, offline badge)
- Price: start with one-time IAP, consider subscription after traction
- Category: pick the most specific relevant category
- Age rating: answer honestly — health apps typically get 13+

---

## Folder Structure

```
src/
  components/       # Reusable UI components
  constants/        # Colors, typography, theme definitions
  context/          # React context (Theme, Onboarding)
  navigation/       # AppNavigator, TabNavigator
  screens/
    onboarding/     # 4-screen onboarding flow
  services/         # Analytics, purchases, external APIs
  storage/          # AsyncStorage helpers
  types/            # TypeScript navigation types
  utils/            # Dates, colors, notifications, haptics, uuid
```

---

## Darren's Preferences

- No comments unless the WHY is non-obvious
- No close buttons on modals — tap outside or drag down to dismiss
- Forest green or purple as primary brand colors (pick one per app)
- Pip-style mascot on splash, onboarding, and insights screens
- Always push to GitHub after every change
- iOS only (no Android until after launch)
- Freemium model — free core, one-time IAP for premium features
- Keep it simple — no over-engineering, no premature abstractions

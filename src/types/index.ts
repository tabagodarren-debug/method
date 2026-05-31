export type AppSettings = {
  reminderEnabled: boolean;
  reminderTime: string; // HH:MM
};

// Root stack — onboarding + main tabs entry point
export type RootStackParamList = {
  Onboarding1: undefined;
  Onboarding2: undefined;
  Onboarding3: undefined;
  Onboarding4: undefined;
  MainTabs: undefined;
};

// Tab navigator
export type TabParamList = {
  HomeTab:     undefined;
  BrowseTab:   undefined;
  SettingsTab: undefined;
};

// Per-tab stacks
export type HomeStackParamList = {
  Home: undefined;
};

export type BrowseStackParamList = {
  Browse: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
  PrivacyPolicy: undefined;
};

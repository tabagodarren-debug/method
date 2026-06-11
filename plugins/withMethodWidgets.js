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

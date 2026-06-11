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

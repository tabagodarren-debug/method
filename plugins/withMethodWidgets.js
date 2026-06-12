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
  config = withXcodeTarget(config);
  config = withPodfileRegistration(config);
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

// ── 4. Add MethodWidget extension target to Xcode project ────────────────────
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

// ── 5. Podfile post_install: register custom modules in ExpoModulesProvider ──
function withPodfileRegistration(config) {
  return withPodfile(config, (c) => {
    const appName = c.modRequest.projectName;
    const snippet = `
# Method: register custom native modules in ExpoModulesProvider
post_install do |installer|
  app_dir = File.join(File.dirname(__FILE__), '${appName}')
  delegate_path = File.join(app_dir, 'AppDelegate.swift')
  already_patched = File.exist?(delegate_path) && File.read(delegate_path).include?('MethodModulesProvider')

  unless already_patched
    provider_path = File.join(app_dir, 'ExpoModulesProvider.swift')
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
end
`;
    if (!c.modResults.includes('MethodSharedDataModule')) {
      c.modResults += snippet;
    }
    return c;
  });
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

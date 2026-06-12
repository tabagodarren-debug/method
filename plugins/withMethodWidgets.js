// plugins/withMethodWidgets.js
const {
  withEntitlementsPlist,
  withInfoPlist,
  withDangerousMod,
  withXcodeProject,
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
        'MethodLiveActivityAttributes.swift',
      ];
      for (const f of moduleFiles) {
        fs.copyFileSync(path.join(SWIFT_DIR, f), path.join(appDir, f));
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

    // Add Swift source files to extension target — direct PBX manipulation
    // (addSourceFile with a target calls addPluginFile which uses the wrong target)
    const extSources = [
      'MethodWidgetBundle.swift',
      'MethodWidget.swift',
      'MethodLiveActivityAttributes.swift',
      'MethodLiveActivityWidget.swift',
      'MethodSharedData.swift',
    ];
    {
      const objs = project.hash.project.objects;
      // Use pbxNativeTarget directly — avoids UUID key-format mismatches
      const extBuildPhases = extTarget.pbxNativeTarget.buildPhases || [];
      let extSourcesPhaseUUID = null;
      for (const phase of extBuildPhases) {
        // buildPhases entries may be plain UUID strings or { value, comment } objects
        const uuid = typeof phase === 'string' ? phase : phase.value;
        if (uuid && objs['PBXSourcesBuildPhase']?.[uuid]) {
          extSourcesPhaseUUID = uuid; break;
        }
      }
      if (extSourcesPhaseUUID) {
        const extSourcesPhase = objs['PBXSourcesBuildPhase'][extSourcesPhaseUUID];
        for (const f of extSources) {
          const filePath = `${EXTENSION_NAME}/${f}`;
          const fileRefUUID = project.generateUuid();
          objs['PBXFileReference'][fileRefUUID] = {
            isa: 'PBXFileReference',
            lastKnownFileType: 'sourcecode.swift',
            name: `"${f}"`,
            path: `"${filePath}"`,
            sourceTree: '"SOURCE_ROOT"',
          };
          objs['PBXFileReference'][`${fileRefUUID}_comment`] = f;
          const buildFileUUID = project.generateUuid();
          objs['PBXBuildFile'][buildFileUUID] = {
            isa: 'PBXBuildFile', fileRef: fileRefUUID, fileRef_comment: f,
          };
          objs['PBXBuildFile'][`${buildFileUUID}_comment`] = `${f} in Sources`;
          extSourcesPhase.files.push({ value: buildFileUUID, comment: `${f} in Sources` });
          objs['PBXGroup'][extGroup.uuid].children.push({ value: fileRefUUID, comment: f });
        }
      }
    }

    // Link WidgetKit and ActivityKit
    project.addFramework('WidgetKit.framework', {
      target: extTarget.uuid, link: true,
    });
    project.addFramework('ActivityKit.framework', {
      target: extTarget.uuid, link: true,
    });

    // Add native module Swift files to main app target
    // getFirstTarget() can return a comment entry (string), so find by name instead
    let mainTargetUuid = null;
    for (const [key, target] of Object.entries(targets)) {
      if (key.endsWith('_comment')) continue;
      if (target && typeof target === 'object') {
        const name = (target.name ?? '').replace(/^"|"$/g, '');
        if (name === appName) { mainTargetUuid = key; break; }
      }
    }
    if (mainTargetUuid) {
      const moduleFiles = [
        'MethodSharedDataModule.swift',
        'MethodLiveActivityModule.swift',
        'MethodLiveActivityAttributes.swift',
      ];

      // Direct PBX manipulation — avoids addSourceFile/addPluginFile crash
      const objects = project.hash.project.objects;
      const mainTarget = objects['PBXNativeTarget'][mainTargetUuid];

      // Find Sources build phase for main target
      let sourcesBuildPhaseUUID = null;
      for (const phase of (mainTarget.buildPhases || [])) {
        const uuid = typeof phase === 'string' ? phase : phase.value;
        if (uuid && objects['PBXSourcesBuildPhase']?.[uuid]) {
          sourcesBuildPhaseUUID = uuid;
          break;
        }
      }

      // Find main app group (by path = appName)
      let mainGroupKey = null;
      for (const [key, group] of Object.entries(objects['PBXGroup'] || {})) {
        if (key.endsWith('_comment') || !group || typeof group !== 'object') continue;
        if ((group.path ?? '').replace(/^"|"$/g, '') === appName) {
          mainGroupKey = key;
          break;
        }
      }

      if (sourcesBuildPhaseUUID) {
        const sourcesBuildPhase = objects['PBXSourcesBuildPhase'][sourcesBuildPhaseUUID];
        for (const f of moduleFiles) {
          const filePath = `${appName}/${f}`;
          // Skip if already present
          const exists = Object.entries(objects['PBXFileReference'] || {})
            .some(([k, r]) => !k.endsWith('_comment') && r &&
              (r.path === filePath || r.path === `"${filePath}"`));
          if (exists) continue;

          // File reference (SOURCE_ROOT so Xcode finds ios/Method/<f>)
          const fileRefUUID = project.generateUuid();
          objects['PBXFileReference'][fileRefUUID] = {
            isa: 'PBXFileReference',
            lastKnownFileType: 'sourcecode.swift',
            name: `"${f}"`,
            path: `"${filePath}"`,
            sourceTree: '"SOURCE_ROOT"',
          };
          objects['PBXFileReference'][`${fileRefUUID}_comment`] = f;

          // Build file
          const buildFileUUID = project.generateUuid();
          objects['PBXBuildFile'][buildFileUUID] = {
            isa: 'PBXBuildFile',
            fileRef: fileRefUUID,
            fileRef_comment: f,
          };
          objects['PBXBuildFile'][`${buildFileUUID}_comment`] = `${f} in Sources`;

          // Add to Sources build phase
          sourcesBuildPhase.files.push({ value: buildFileUUID, comment: `${f} in Sources` });

          // Add to main group so it shows in Xcode navigator
          if (mainGroupKey) {
            objects['PBXGroup'][mainGroupKey].children.push({ value: fileRefUUID, comment: f });
          }
        }
      }
    }

    return c;
  });
}

// ── 5. Podfile post_install: register custom modules in ExpoModulesProvider ──
function withPodfileRegistration(config) {
  return withDangerousMod(config, [
    'ios',
    async (c) => {
      const appName = c.modRequest.projectName;
      const podfilePath = path.join(c.modRequest.platformProjectRoot, 'Podfile');
      if (!fs.existsSync(podfilePath)) return c;

      let podfile = fs.readFileSync(podfilePath, 'utf8');
      if (podfile.includes('MethodSharedDataModule')) return c;

      // Inject into existing post_install block (CocoaPods forbids multiple blocks)
      const injection = `
  # Method: register custom native modules in ExpoModulesProvider
  provider_path = File.join(File.dirname(__FILE__), '${appName}', 'ExpoModulesProvider.swift')
  if File.exist?(provider_path)
    content = File.read(provider_path)
    unless content.include?('MethodSharedDataModule')
      content.sub!(/return \\[/, "return [\\n      MethodSharedDataModule.self,\\n      MethodLiveActivityModule.self,")
      File.write(provider_path, content)
    end
  end
`;
      if (podfile.includes('post_install do |installer|')) {
        podfile = podfile.replace('post_install do |installer|', `post_install do |installer|${injection}`);
      } else {
        podfile += `\npost_install do |installer|\n${injection}end\n`;
      }
      fs.writeFileSync(podfilePath, podfile);
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

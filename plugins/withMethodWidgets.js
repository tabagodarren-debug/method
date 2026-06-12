// plugins/withMethodWidgets.js
const {
  withEntitlementsPlist,
  withInfoPlist,
  withDangerousMod,
  withXcodeProject,
} = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const APP_GROUP = 'group.com.darrentabago.method';
const EXTENSION_NAME = 'MethodWidget';
const EXTENSION_BUNDLE_ID = 'com.darrentabago.method.MethodWidget';
const SWIFT_DIR = path.join(__dirname, 'swift');

const EXTENSION_SWIFT_FILES = [
  'MethodWidgetBundle.swift',
  'MethodWidget.swift',
  'MethodLiveActivityAttributes.swift',
  'MethodLiveActivityWidget.swift',
  'MethodSharedData.swift',
];

const MODULE_SWIFT_FILES = [
  'MethodSharedDataModule.swift',
  'MethodLiveActivityModule.swift',
  'MethodLiveActivityAttributes.swift',
];

function withMethodWidgets(config) {
  config = withAppGroupEntitlement(config);
  config = withLiveActivityInfoPlist(config);
  config = withWidgetFiles(config);
  config = withXcodeTarget(config);
  config = withPodfileRegistration(config);
  return config;
}

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

function withLiveActivityInfoPlist(config) {
  return withInfoPlist(config, (c) => {
    c.modResults.NSSupportsLiveActivities = true;
    c.modResults.NSSupportsLiveActivitiesFrequentUpdates = false;
    return c;
  });
}

function withWidgetFiles(config) {
  return withDangerousMod(config, [
    'ios',
    async (c) => {
      const root = c.modRequest.projectRoot;
      const appName = c.modRequest.projectName;

      const extDir = path.join(root, 'ios', EXTENSION_NAME);
      fs.mkdirSync(extDir, { recursive: true });
      for (const f of EXTENSION_SWIFT_FILES) {
        fs.copyFileSync(path.join(SWIFT_DIR, f), path.join(extDir, f));
      }
      fs.writeFileSync(path.join(extDir, 'Info.plist'), extensionInfoPlist());
      fs.writeFileSync(path.join(extDir, `${EXTENSION_NAME}.entitlements`), extensionEntitlements());

      const appDir = path.join(root, 'ios', appName);
      for (const f of MODULE_SWIFT_FILES) {
        fs.copyFileSync(path.join(SWIFT_DIR, f), path.join(appDir, f));
      }

      return c;
    },
  ]);
}

function withXcodeTarget(config) {
  return withXcodeProject(config, (c) => {
    const project = c.modResults;
    const appName = c.modRequest.projectName;

    let extTargetUuid = findTargetUuidByName(project, EXTENSION_NAME);
    const extTarget = extTargetUuid
      ? { uuid: extTargetUuid, pbxNativeTarget: project.pbxNativeTargetSection()[extTargetUuid] }
      : project.addTarget(EXTENSION_NAME, 'app_extension', EXTENSION_NAME, EXTENSION_BUNDLE_ID);
    extTargetUuid = extTarget.uuid;
    const mainTargetUuid = findTargetUuidByName(project, appName);

    configureExtensionBuildSettings(project, extTarget.pbxNativeTarget);
    if (mainTargetUuid) {
      ensureTargetDependency(project, mainTargetUuid, extTargetUuid);
      ensureEmbeddedAppExtension(project, mainTargetUuid, extTarget.pbxNativeTarget.productReference);
    }

    let extGroup = findGroupByPath(project, EXTENSION_NAME);
    if (!extGroup) {
      extGroup = project.addPbxGroup([], EXTENSION_NAME, EXTENSION_NAME);
    }

    const rootGroupUuid = project.getFirstProject().firstProject.mainGroup;
    if (!groupHasChild(project, rootGroupUuid, EXTENSION_NAME)) {
      project.addToPbxGroup(extGroup.uuid, rootGroupUuid);
    }

    const extSourcesPhaseUuid = ensureBuildPhase(
      project,
      extTargetUuid,
      'PBXSourcesBuildPhase',
      'Sources'
    );
    ensureBuildPhase(project, extTargetUuid, 'PBXFrameworksBuildPhase', 'Frameworks');

    for (const f of EXTENSION_SWIFT_FILES) {
      addSwiftSourceFile(project, {
        fileName: f,
        filePath: `${EXTENSION_NAME}/${f}`,
        groupUuid: extGroup.uuid,
        sourcesPhaseUuid: extSourcesPhaseUuid,
      });
    }

    addFrameworkOnce(project, 'WidgetKit.framework', extTargetUuid);
    addFrameworkOnce(project, 'ActivityKit.framework', extTargetUuid);

    const mainSourcesPhaseUuid = mainTargetUuid
      ? findBuildPhaseUuid(project, mainTargetUuid, 'PBXSourcesBuildPhase')
      : null;
    const mainGroup = findGroupByPath(project, appName);

    if (mainSourcesPhaseUuid) {
      for (const f of MODULE_SWIFT_FILES) {
        addSwiftSourceFile(project, {
          fileName: f,
          filePath: `${appName}/${f}`,
          groupUuid: mainGroup?.uuid,
          sourcesPhaseUuid: mainSourcesPhaseUuid,
        });
      }
    }

    return c;
  });
}

function configureExtensionBuildSettings(project, nativeTarget) {
  const buildConfigs = project.pbxXCBuildConfigurationSection();
  const configList = project.pbxXCConfigurationList()[nativeTarget.buildConfigurationList];

  for (const { value: cfgUuid } of configList.buildConfigurations || []) {
    const bc = buildConfigs[cfgUuid];
    if (!bc?.buildSettings) continue;
    bc.buildSettings.SWIFT_VERSION = '"5.0"';
    bc.buildSettings.PRODUCT_NAME = `"${EXTENSION_NAME}"`;
    bc.buildSettings.EXECUTABLE_NAME = `"${EXTENSION_NAME}"`;
    bc.buildSettings.EXECUTABLE_PREFIX = '""';
    bc.buildSettings.EXECUTABLE_EXTENSION = '""';
    bc.buildSettings.WRAPPER_EXTENSION = 'appex';
    bc.buildSettings.MACH_O_TYPE = 'mh_execute';
    bc.buildSettings.DEFINES_MODULE = 'YES';
    bc.buildSettings.APPLICATION_EXTENSION_API_ONLY = 'YES';
    bc.buildSettings.SDKROOT = 'iphoneos';
    bc.buildSettings.SUPPORTED_PLATFORMS = '"iphoneos iphonesimulator"';
    bc.buildSettings.SUPPORTS_MACCATALYST = 'NO';
    bc.buildSettings.GENERATE_INFOPLIST_FILE = 'NO';
    bc.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = '"16.2"';
    bc.buildSettings.LD_RUNPATH_SEARCH_PATHS = '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"';
    bc.buildSettings.INFOPLIST_FILE = `"${EXTENSION_NAME}/Info.plist"`;
    bc.buildSettings.CODE_SIGN_ENTITLEMENTS = `"${EXTENSION_NAME}/${EXTENSION_NAME}.entitlements"`;
    bc.buildSettings.PRODUCT_BUNDLE_IDENTIFIER = `"${EXTENSION_BUNDLE_ID}"`;
    bc.buildSettings.SKIP_INSTALL = 'YES';
    bc.buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';
    bc.buildSettings.MARKETING_VERSION = '"1.0"';
    bc.buildSettings.CURRENT_PROJECT_VERSION = '"1"';
  }
}

function findTargetUuidByName(project, targetName) {
  for (const [uuid, target] of Object.entries(project.pbxNativeTargetSection() || {})) {
    if (uuid.endsWith('_comment') || !target || typeof target !== 'object') continue;
    if (unquote(target.name) === targetName) return uuid;
  }
  return null;
}

function findGroupByPath(project, groupPath) {
  for (const [uuid, group] of Object.entries(project.hash.project.objects.PBXGroup || {})) {
    if (uuid.endsWith('_comment') || !group || typeof group !== 'object') continue;
    if (unquote(group.path) === groupPath || unquote(group.name) === groupPath) {
      return { uuid, group };
    }
  }
  return null;
}

function groupHasChild(project, groupUuid, childName) {
  const group = project.hash.project.objects.PBXGroup?.[groupUuid];
  return (group?.children || []).some((child) => child.comment === childName);
}

function findBuildPhaseUuid(project, targetUuid, phaseType) {
  const objects = project.hash.project.objects;
  const nativeTarget = objects.PBXNativeTarget?.[targetUuid];
  for (const phase of nativeTarget?.buildPhases || []) {
    const uuid = typeof phase === 'string' ? phase : phase.value;
    if (uuid && objects[phaseType]?.[uuid]) return uuid;
  }
  return null;
}

function ensureBuildPhase(project, targetUuid, phaseType, comment) {
  const existing = findBuildPhaseUuid(project, targetUuid, phaseType);
  if (existing) return existing;
  return project.addBuildPhase([], phaseType, comment, targetUuid).uuid;
}

function ensureTargetDependency(project, targetUuid, dependencyTargetUuid) {
  const objects = project.hash.project.objects;
  const nativeTarget = objects.PBXNativeTarget?.[targetUuid];
  if (!nativeTarget) return;

  objects.PBXContainerItemProxy ||= {};
  objects.PBXTargetDependency ||= {};
  nativeTarget.dependencies ||= [];

  const alreadyDepends = nativeTarget.dependencies.some(({ value }) => {
    const dependency = objects.PBXTargetDependency[value];
    return dependency?.target === dependencyTargetUuid;
  });
  if (alreadyDepends) return;

  const dependencyTarget = objects.PBXNativeTarget?.[dependencyTargetUuid];
  if (!dependencyTarget) return;

  const proxyUuid = project.generateUuid();
  objects.PBXContainerItemProxy[proxyUuid] = {
    isa: 'PBXContainerItemProxy',
    containerPortal: project.hash.project.rootObject,
    containerPortal_comment: project.hash.project.rootObject_comment || 'Project object',
    proxyType: 1,
    remoteGlobalIDString: dependencyTargetUuid,
    remoteInfo: unquote(dependencyTarget.name),
  };
  objects.PBXContainerItemProxy[`${proxyUuid}_comment`] = 'PBXContainerItemProxy';

  const dependencyUuid = project.generateUuid();
  objects.PBXTargetDependency[dependencyUuid] = {
    isa: 'PBXTargetDependency',
    target: dependencyTargetUuid,
    target_comment: unquote(dependencyTarget.name),
    targetProxy: proxyUuid,
    targetProxy_comment: 'PBXContainerItemProxy',
  };
  objects.PBXTargetDependency[`${dependencyUuid}_comment`] = 'PBXTargetDependency';
  nativeTarget.dependencies.push({ value: dependencyUuid, comment: 'PBXTargetDependency' });
}

function ensureEmbeddedAppExtension(project, appTargetUuid, productFileRefUuid) {
  const objects = project.hash.project.objects;
  const phaseUuid =
    findCopyFilesPhaseContainingFile(project, appTargetUuid, productFileRefUuid) ||
    ensureCopyFilesBuildPhase(project, appTargetUuid, 'Embed App Extensions', 13);
  const phase = objects.PBXCopyFilesBuildPhase[phaseUuid];
  phase.name = '"Embed App Extensions"';
  phase.dstPath = '""';
  phase.dstSubfolderSpec = 13;
  phase.files ||= [];

  const alreadyEmbedded = phase.files.some(({ value }) => {
    const buildFile = objects.PBXBuildFile[value];
    if (buildFile?.fileRef === productFileRefUuid) {
      buildFile.settings ||= { ATTRIBUTES: ['RemoveHeadersOnCopy'] };
    }
    return buildFile?.fileRef === productFileRefUuid;
  });
  if (alreadyEmbedded) return;

  const productRef = objects.PBXFileReference?.[productFileRefUuid];
  const productName = unquote(productRef?.path || productRef?.name || `${EXTENSION_NAME}.appex`);
  const buildFileUuid = project.generateUuid();
  objects.PBXBuildFile[buildFileUuid] = {
    isa: 'PBXBuildFile',
    fileRef: productFileRefUuid,
    fileRef_comment: productName,
    settings: { ATTRIBUTES: ['RemoveHeadersOnCopy'] },
  };
  objects.PBXBuildFile[`${buildFileUuid}_comment`] = `${productName} in Embed App Extensions`;
  phase.files.push({ value: buildFileUuid, comment: `${productName} in Embed App Extensions` });
}

function findCopyFilesPhaseContainingFile(project, targetUuid, fileRefUuid) {
  const objects = project.hash.project.objects;
  const nativeTarget = objects.PBXNativeTarget?.[targetUuid];
  for (const phase of nativeTarget?.buildPhases || []) {
    const uuid = typeof phase === 'string' ? phase : phase.value;
    const candidate = uuid ? objects.PBXCopyFilesBuildPhase?.[uuid] : null;
    if (!candidate) continue;
    const containsFile = (candidate.files || []).some(({ value }) => {
      return objects.PBXBuildFile[value]?.fileRef === fileRefUuid;
    });
    if (containsFile) return uuid;
  }
  return null;
}

function ensureCopyFilesBuildPhase(project, targetUuid, phaseName, dstSubfolderSpec) {
  const objects = project.hash.project.objects;
  const nativeTarget = objects.PBXNativeTarget?.[targetUuid];
  objects.PBXCopyFilesBuildPhase ||= {};
  nativeTarget.buildPhases ||= [];

  for (const phase of nativeTarget.buildPhases) {
    const uuid = typeof phase === 'string' ? phase : phase.value;
    const candidate = uuid ? objects.PBXCopyFilesBuildPhase[uuid] : null;
    if (candidate && unquote(candidate.name) === phaseName) {
      candidate.dstPath = '""';
      candidate.dstSubfolderSpec = dstSubfolderSpec;
      return uuid;
    }
  }

  const uuid = project.generateUuid();
  objects.PBXCopyFilesBuildPhase[uuid] = {
    isa: 'PBXCopyFilesBuildPhase',
    buildActionMask: 2147483647,
    dstPath: '""',
    dstSubfolderSpec,
    files: [],
    name: `"${phaseName}"`,
    runOnlyForDeploymentPostprocessing: 0,
  };
  objects.PBXCopyFilesBuildPhase[`${uuid}_comment`] = phaseName;
  nativeTarget.buildPhases.push({ value: uuid, comment: phaseName });
  return uuid;
}

function addSwiftSourceFile(project, { fileName, filePath, groupUuid, sourcesPhaseUuid }) {
  const objects = project.hash.project.objects;
  const existingFileRefUuid = findFileRefUuidByPath(project, filePath);
  const fileRefUuid = existingFileRefUuid || project.generateUuid();

  if (!existingFileRefUuid) {
    objects.PBXFileReference[fileRefUuid] = {
      isa: 'PBXFileReference',
      lastKnownFileType: 'sourcecode.swift',
      name: `"${fileName}"`,
      path: `"${filePath}"`,
      sourceTree: '"SOURCE_ROOT"',
    };
    objects.PBXFileReference[`${fileRefUuid}_comment`] = fileName;
  }

  if (groupUuid && !groupHasChild(project, groupUuid, fileName)) {
    objects.PBXGroup[groupUuid].children.push({ value: fileRefUuid, comment: fileName });
  }

  const sourcesPhase = objects.PBXSourcesBuildPhase[sourcesPhaseUuid];
  if ((sourcesPhase.files || []).some(({ value }) => objects.PBXBuildFile[value]?.fileRef === fileRefUuid)) {
    return;
  }

  const buildFileUuid = project.generateUuid();
  objects.PBXBuildFile[buildFileUuid] = {
    isa: 'PBXBuildFile',
    fileRef: fileRefUuid,
    fileRef_comment: fileName,
  };
  objects.PBXBuildFile[`${buildFileUuid}_comment`] = `${fileName} in Sources`;
  sourcesPhase.files.push({ value: buildFileUuid, comment: `${fileName} in Sources` });
}

function addFrameworkOnce(project, framework, targetUuid) {
  ensureBuildPhase(project, targetUuid, 'PBXFrameworksBuildPhase', 'Frameworks');
  const objects = project.hash.project.objects;
  const existingFileRefUuid = findFileRefUuidByPath(project, framework);
  const frameworkPhaseUuid = findBuildPhaseUuid(project, targetUuid, 'PBXFrameworksBuildPhase');
  const frameworkPhase = objects.PBXFrameworksBuildPhase[frameworkPhaseUuid];

  if (
    existingFileRefUuid &&
    (frameworkPhase.files || []).some(({ value }) => objects.PBXBuildFile[value]?.fileRef === existingFileRefUuid)
  ) {
    return;
  }

  if (existingFileRefUuid) {
    const buildFileUuid = project.generateUuid();
    objects.PBXBuildFile[buildFileUuid] = {
      isa: 'PBXBuildFile',
      fileRef: existingFileRefUuid,
      fileRef_comment: framework,
    };
    objects.PBXBuildFile[`${buildFileUuid}_comment`] = `${framework} in Frameworks`;
    frameworkPhase.files.push({ value: buildFileUuid, comment: `${framework} in Frameworks` });
    return;
  }

  project.addFramework(framework, { target: targetUuid, link: true });
}

function findFileRefUuidByPath(project, filePath) {
  for (const [uuid, ref] of Object.entries(project.hash.project.objects.PBXFileReference || {})) {
    if (uuid.endsWith('_comment') || !ref || typeof ref !== 'object') continue;
    if (unquote(ref.path) === filePath) return uuid;
  }
  return null;
}

function unquote(value) {
  return typeof value === 'string' ? value.replace(/^"|"$/g, '') : value;
}

function withPodfileRegistration(config) {
  return withDangerousMod(config, [
    'ios',
    async (c) => {
      const appName = c.modRequest.projectName;
      const podfilePath = path.join(c.modRequest.platformProjectRoot, 'Podfile');
      if (!fs.existsSync(podfilePath)) return c;

      let podfile = fs.readFileSync(podfilePath, 'utf8');
      if (podfile.includes('Method: register custom native modules')) return c;

      const injection = `
  # Method: register custom native modules in ExpoModulesProvider
  provider_path = File.join(File.dirname(__FILE__), '${appName}', 'ExpoModulesProvider.swift')
  if File.exist?(provider_path)
    content = File.read(provider_path)
    unless content.include?('MethodSharedDataModule')
      updated = content.sub(/return\\s*\\[/, "return [\\n      MethodSharedDataModule.self,\\n      MethodLiveActivityModule.self,")
      if updated != content
        File.write(provider_path, updated)
      else
        Pod::UI.warn "Method: could not patch ExpoModulesProvider.swift"
      end
    end
  else
    Pod::UI.warn "Method: ExpoModulesProvider.swift not found at #{provider_path}"
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

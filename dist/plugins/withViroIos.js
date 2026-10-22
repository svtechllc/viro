"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withViroIos = exports.withDefaultInfoPlist = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
const insertLinesHelper_1 = require("./util/insertLinesHelper");
const withViro_1 = require("./withViro");
const withViroPods = (config) => {
    config = (0, config_plugins_1.withDangerousMod)(config, [
        "ios",
        async (newConfig) => {
            const root = newConfig.modRequest.platformProjectRoot;
            // Check plugin configuration options
            let iosLinkage;
            if (Array.isArray(config.plugins)) {
                const pluginConfig = config?.plugins?.find((plugin) => Array.isArray(plugin) && plugin[0] === "@reactvision/react-viro");
                if (Array.isArray(pluginConfig) && pluginConfig.length > 1) {
                    const options = pluginConfig[1];
                    iosLinkage = options.iosLinkage;
                }
            }
            let data = fs_1.default.readFileSync(`${root}/Podfile`, "utf-8");
            // ViroReact with integrated Fabric support
            let viroPods = `  # ViroReact with integrated New Architecture (Fabric) support\n` +
                `  # Automatically includes Fabric components when RCT_NEW_ARCH_ENABLED=1\n` +
                `  pod 'ViroReact', :path => '../node_modules/@reactvision/react-viro/ios'\n` +
                `  pod 'ViroKit', :path => '../node_modules/@reactvision/react-viro/ios/dist/ViroRenderer/'`;
            // This fork's vendored ViroKit.framework already contains the ARCore SDK
            // and its resource bundles. Adding ARCore pods here would put a second
            // copy of GARSession, Firebase, and nanopb into the app executable. That
            // duplicate native runtime can crash while GARSession initializes.
            // Add use_frameworks! only when explicitly configured. ARCore's CocoaPods
            // integration does not require dynamic frameworks, and forcing every pod
            // to build dynamically breaks Expo's core-module integration on SDK 55.
            const effectiveLinkage = iosLinkage;
            if (effectiveLinkage) {
                // Insert use_frameworks! before the target block
                const linkageComment = `# Framework linkage configured via app.json (iosLinkage: "${effectiveLinkage}")`;
                data = (0, insertLinesHelper_1.insertLinesHelper)(`${linkageComment}\nuse_frameworks! :linkage => :${effectiveLinkage}\n`, "target '", data, -1);
            }
            // Add New Architecture enforcement
            viroPods +=
                `\n\n  # Enforce New Architecture requirement\n` +
                    `  # ViroReact 2.43.1+ requires React Native New Architecture\n` +
                    `  if ENV['RCT_NEW_ARCH_ENABLED'] != '1'\n` +
                    `    raise "ViroReact requires New Architecture to be enabled. Please set RCT_NEW_ARCH_ENABLED=1 in ios/.xcode.env"\n` +
                    `  end`;
            // Insert the pods into the Podfile
            data = (0, insertLinesHelper_1.insertLinesHelper)(viroPods, "post_install do |installer|", data, -1);
            fs_1.default.writeFileSync(`${root}/Podfile`, data, "utf-8");
            return newConfig;
        },
    ]);
    return config;
};
const withEnabledBitcode = (config) => (0, config_plugins_1.withXcodeProject)(config, async (newConfig) => {
    newConfig.modResults.addBuildProperty("ENABLE_BITCODE", "NO", "Release");
    return newConfig;
});
const setExcludedArchitectures = (project) => {
    const configurations = project.pbxXCBuildConfigurationSection();
    // @ts-ignore
    for (const { buildSettings } of Object.values(configurations || {})) {
        if (typeof (buildSettings === null || buildSettings === void 0
            ? void 0
            : buildSettings.PRODUCT_NAME) !== "undefined") {
            buildSettings['"EXCLUDED_ARCHS[sdk=iphonesimulator*]"'] = '"arm64"';
        }
    }
    return project;
};
const withExcludedSimulatorArchitectures = (config) => {
    return (0, config_plugins_1.withXcodeProject)(config, (newConfig) => {
        newConfig.modResults = setExcludedArchitectures(newConfig.modResults);
        return newConfig;
    });
};
const withDefaultInfoPlist = (config, _props) => {
    let savePhotosPermission = withViro_1.DEFAULTS.ios.savePhotosPermission;
    let photosPermission = withViro_1.DEFAULTS.ios.photosPermission;
    let cameraUsagePermission = withViro_1.DEFAULTS.ios.cameraUsagePermission;
    let microphoneUsagePermission = withViro_1.DEFAULTS.ios.microphoneUsagePermission;
    let locationUsagePermission = withViro_1.DEFAULTS.ios.locationUsagePermission;
    let googleCloudApiKey;
    let rvApiKey;
    let rvProjectId;
    let rvEndpoint;
    let cloudAnchorProvider;
    let geospatialAnchorProvider;
    let includeARCore;
    if (Array.isArray(config.plugins)) {
        const pluginConfig = config?.plugins?.find((plugin) => Array.isArray(plugin) && plugin[0] === "@reactvision/react-viro");
        if (Array.isArray(pluginConfig) && pluginConfig.length > 1) {
            const pluginOptions = pluginConfig[1];
            savePhotosPermission =
                pluginOptions.ios?.savePhotosPermission || savePhotosPermission;
            photosPermission = pluginOptions.ios?.photosPermission || photosPermission;
            microphoneUsagePermission =
                pluginOptions.ios?.microphoneUsagePermission || microphoneUsagePermission;
            cameraUsagePermission =
                pluginOptions.ios?.cameraUsagePermission || cameraUsagePermission;
            locationUsagePermission =
                pluginOptions.ios?.locationUsagePermission || locationUsagePermission;
            googleCloudApiKey = pluginOptions.googleCloudApiKey;
            rvApiKey = pluginOptions.rvApiKey;
            rvProjectId = pluginOptions.rvProjectId;
            rvEndpoint = pluginOptions.rvEndpoint;
            // Resolve unified provider prop; old props override for backward compat.
            // Default to "reactvision" only when rvApiKey is present (implies RV intent).
            const defaultProvider2 = pluginOptions.rvApiKey ? "reactvision" : undefined;
            const legacyOpts2 = pluginOptions;
            cloudAnchorProvider = legacyOpts2.cloudAnchorProvider ?? pluginOptions.provider ?? defaultProvider2;
            geospatialAnchorProvider = legacyOpts2.geospatialAnchorProvider ?? pluginOptions.provider ?? defaultProvider2;
            includeARCore = pluginOptions.ios?.includeARCore;
        }
    }
    if (!config.ios)
        config.ios = {};
    if (!config.ios.infoPlist)
        config.ios.infoPlist = {};
    config.ios.infoPlist.NSPhotoLibraryUsageDescription =
        config.ios.infoPlist.NSPhotoLibraryUsageDescription || photosPermission;
    config.ios.infoPlist.NSPhotoLibraryAddUsageDescription =
        config.ios.infoPlist.NSPhotoLibraryAddUsageDescription ||
            savePhotosPermission;
    config.ios.infoPlist.NSCameraUsageDescription =
        config.ios.infoPlist.NSCameraUsageDescription || cameraUsagePermission;
    config.ios.infoPlist.NSMicrophoneUsageDescription =
        config.ios.infoPlist.NSMicrophoneUsageDescription ||
            microphoneUsagePermission;
    // Add Google Cloud API key for ARCore Cloud Anchors and Geospatial API (iOS)
    if (googleCloudApiKey) {
        config.ios.infoPlist.GARAPIKey = googleCloudApiKey;
    }
    // Add ReactVision credentials for ReactVision Cloud Anchors and Geospatial API (iOS)
    if (rvApiKey) {
        config.ios.infoPlist.RVApiKey = rvApiKey;
    }
    if (rvProjectId) {
        config.ios.infoPlist.RVProjectId = rvProjectId;
    }
    if (rvEndpoint) {
        config.ios.infoPlist.RVEndpoint = rvEndpoint;
    }
    // Add location permissions for Geospatial API
    if (geospatialAnchorProvider === "arcore" || geospatialAnchorProvider === "reactvision" || includeARCore === true) {
        config.ios.infoPlist.NSLocationWhenInUseUsageDescription =
            config.ios.infoPlist.NSLocationWhenInUseUsageDescription || locationUsagePermission;
        config.ios.infoPlist.NSLocationAlwaysAndWhenInUseUsageDescription =
            config.ios.infoPlist.NSLocationAlwaysAndWhenInUseUsageDescription || locationUsagePermission;
    }
    return config;
};
exports.withDefaultInfoPlist = withDefaultInfoPlist;
const withViroIos = (config, props) => {
    config = (0, config_plugins_1.withPlugins)(config, [[withViroPods, props]]);
    (0, exports.withDefaultInfoPlist)(config, props);
    withEnabledBitcode(config);
    withExcludedSimulatorArchitectures(config);
    return config;
};
exports.withViroIos = withViroIos;

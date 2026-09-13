const fs = require('fs');
const path = require('path');
const { IOSConfig, createRunOncePlugin, withAppDelegate, withInfoPlist, withXcodeProject } = require('@expo/config-plugins');

const SCENE_DELEGATE = `internal import Expo
import React
import UIKit

final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory else { return }
    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window
    factory.startReactNative(withModuleName: "main", in: window, launchOptions: nil)
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let url = URLContexts.first?.url else { return }
    RCTLinkingManager.application(UIApplication.shared, open: url, options: [:])
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    RCTLinkingManager.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
  }
}
`;

function withIosSceneLifecycle(config) {
  config = withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [{
          UISceneConfigurationName: 'Default Configuration',
          UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
        }],
      },
    };
    return config;
  });

  config = withAppDelegate(config, (config) => {
    if (config.modResults.language !== 'swift') throw new Error('A Swift AppDelegate is required.');
    const legacyStartup = /#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?launchOptions: launchOptions\)\n#endif/;
    if (!legacyStartup.test(config.modResults.contents)) throw new Error('Expo window startup block not found.');
    config.modResults.contents = config.modResults.contents.replace(legacyStartup, '// React Native UI startup is owned by SceneDelegate on iOS.');
    return config;
  });

  return withXcodeProject(config, (config) => {
    const { projectRoot, platformProjectRoot } = config.modRequest;
    const projectName = IOSConfig.XcodeUtils.getProjectName(projectRoot);
    const relativePath = path.join(projectName, 'SceneDelegate.swift');
    const filepath = path.join(platformProjectRoot, relativePath);
    fs.writeFileSync(filepath, SCENE_DELEGATE);
    if (!config.modResults.hasFile(filepath)) {
      config.modResults = IOSConfig.XcodeUtils.addBuildSourceFileToGroup({ filepath: relativePath, groupName: projectName, project: config.modResults, verbose: true });
    }
    return config;
  });
}

module.exports = createRunOncePlugin(withIosSceneLifecycle, 'with-ios-scene-lifecycle', '1.0.0');

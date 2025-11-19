// Shared types for App SDK utilities
export enum AppSDKSupportedLanguageEnum {
  java = "java",
  nodejs = "nodejs",
  python = "python",
  ruby = "ruby",
  csharp = "csharp",
}
export type AppSDKSupportedLanguage = keyof typeof AppSDKSupportedLanguageEnum;

export enum AppSDKSupportedFrameworkEnum {
  appium = "appium",
}

export type AppSDKSupportedFramework =
  keyof typeof AppSDKSupportedFrameworkEnum;

export enum AppSDKSupportedTestingFrameworkEnum {
  testng = "testng",
  junit5 = "junit5",
  junit4 = "junit4",
  selenide = "selenide",
  jbehave = "jbehave",
  serenity = "serenity",
  cucumberTestng = "cucumberTestng",
  cucumberJunit4 = "cucumberJunit4",
  cucumberJunit5 = "cucumberJunit5",
  webdriverio = "webdriverio",
  nightwatch = "nightwatch",
  jest = "jest",
  mocha = "mocha",
  cucumberJs = "cucumberJs",
  robot = "robot",
  pytest = "pytest",
  behave = "behave",
  lettuce = "lettuce",
  rspec = "rspec",
  cucumberRuby = "cucumberRuby",
  nunit = "nunit",
  mstest = "mstest",
  xunit = "xunit",
  specflow = "specflow",
  reqnroll = "reqnroll",
}

export type AppSDKSupportedTestingFramework =
  keyof typeof AppSDKSupportedTestingFrameworkEnum;

export enum AppSDKSupportedPlatformEnum {
  android = "android",
  ios = "ios",
}
export type AppSDKSupportedPlatform = keyof typeof AppSDKSupportedPlatformEnum;

// App SDK instruction type
export interface AppSDKInstruction {
  content: string;
  type: "config" | "run" | "setup";
}

export const SUPPORTED_CONFIGURATIONS = {
  appium: {
    ruby: ["cucumberRuby"],
    java: [
      "testng",
      "cucumber",
      "junit4",
      "junit5",
      "jbehave",
      "selenide",
      "serenity",
    ],
    csharp: [],
    python: ["pytest", "robot", "behave", "lettuce"],
    nodejs: ["jest", "mocha", "cucumberJs", "webdriverio", "nightwatch"],
  },
};

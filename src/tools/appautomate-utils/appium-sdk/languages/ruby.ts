// Ruby instructions and commands for App SDK utilities
import {
  createStep,
  combineInstructions,
  createEnvStep,
  PLATFORM_UTILS,
} from "../index.js";

const username = "${process.env.BROWSERSTACK_USERNAME}";
const accessKey = "${process.env.BROWSERSTACK_ACCESS_KEY}";

export function getRubyAppInstructions(): string {
  const configStep = createStep(
    "Create/Update the config file (config.yml) as follows:",
    `\`\`\`yaml
server: "hub-cloud.browserstack.com"

common_caps:
  "browserstack.user": "${username}"
  "browserstack.key": "${accessKey}"
  "project": "First Cucumber Android Project"
  "build": "Cucumber Android"
  "browserstack.debug": true

browser_caps:
  -
    "deviceName": "Google Pixel 3"
    "os_version": "9.0"
    "app": "<replace with the APK path from the upload step>"
    "name": "first_test"
\`\`\``,
  );

  const envStep = createStep(
    "Create/Update your support/env.rb file:",
    `\`\`\`ruby
require 'rubygems'
require 'appium_lib'

# Load configuration from config.yml
caps = Appium.load_appium_txt file: File.expand_path('./../config.yml', __FILE__)
username = "${username}"
password = "${accessKey}"

# Create desired capabilities
desired_caps = {
  caps: caps,
  appium_lib: {
    server_url: "https://#{username}:#{password}@#{caps['server']}/wd/hub"
  }
}

# Initialize Appium driver
begin
  $appium_driver = Appium::Driver.new(desired_caps, true)
  $driver = $appium_driver.start_driver
rescue Exception => e
  puts e.message
  Process.exit(0)
end

# Add cleanup hook
at_exit do
  $driver.quit if $driver
end
\`\`\``,
  );

  const runStep = createStep(
    "Run the test:",
    `\`\`\`bash
bundle exec cucumber
\`\`\``,
  );

  return combineInstructions(configStep, envStep, runStep);
}

export function getRubySDKCommand(
  framework: string,
  username: string,
  accessKey: string,
): string {
  const { isWindows, getPlatformLabel } = PLATFORM_UTILS;

  const envStep = createEnvStep(
    username,
    accessKey,
    isWindows,
    getPlatformLabel(),
    "Set your BrowserStack credentials as environment variables:",
  );

  const installStep = createStep(
    "Install required Ruby gems:",
    `\`\`\`bash
# Install Bundler if not already installed
gem install bundler

# Install Appium Ruby client library
gem install appium_lib

# Install Cucumber
gem install cucumber
\`\`\``,
  );

  const gemfileStep = createStep(
    "Create a Gemfile for dependency management:",
    `\`\`\`ruby
# Gemfile
source 'https://rubygems.org'

gem 'appium_lib'
gem 'cucumber'
\`\`\`

Then run:
\`\`\`bash
bundle install
\`\`\``,
  );

  return combineInstructions(envStep, installStep, gemfileStep);
}

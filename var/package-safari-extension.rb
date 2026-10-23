#!/usr/bin/env ruby
require "fileutils"
require "json"
require "xcodeproj"

root = File.expand_path("..", __dir__)
resources = File.join(root, "build/safari")
output = File.join(root, "build/safari-xcode")
app_name = "Psono for Safari"
app_id = ENV.fetch("SAFARI_APP_IDENTIFIER", "com.psono.safari")
extension_id = "#{app_id}.Extension"
manifest = JSON.parse(File.read(File.join(resources, "manifest.json")))
pipeline_number = Integer(ENV.fetch("CI_PIPELINE_IID", "1"))
build_number = ENV.fetch("APP_BUILD_NUMBER", "#{1 + pipeline_number / 10000}.#{pipeline_number / 100 % 100}.#{pipeline_number % 100}")

raise "Safari packaging requires macOS and Xcode" unless RUBY_PLATFORM.include?("darwin")
raise "Invalid Safari bundle identifier" unless app_id.match?(/\A[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+\z/)
raise "Invalid Apple build number" unless build_number.match?(/\A\d{1,4}(?:\.\d{1,2}){0,2}\z/)

FileUtils.rm_rf(output)
FileUtils.mkdir_p(output)
# Xcode renamed converter to packager; support both Xcode tool names.
tool = system("xcrun", "--find", "safari-web-extension-packager", out: File::NULL, err: File::NULL) ?
  "safari-web-extension-packager" : "safari-web-extension-converter"
success = system("xcrun", tool, resources,
  "--project-location", output, "--app-name", app_name,
  "--bundle-identifier", app_id, "--macos-only", "--swift",
  "--copy-resources", "--no-open", "--no-prompt")
raise "Safari WebExtension packaging failed" unless success

projects = Dir.glob(File.join(output, "**/*.xcodeproj"))
raise "Expected one generated Safari Xcode project" unless projects.length == 1
project = Xcodeproj::Project.open(projects.first)
project_dir = File.dirname(project.path)
app = project.targets.find { |target| target.product_type == "com.apple.product-type.application" }
extension = project.targets.find { |target| target.product_type == "com.apple.product-type.app-extension" }
raise "Safari packager did not generate the expected app and extension targets" unless app && extension && project.targets.length == 2

# Xcode 26+ writes `dstSubfolder = PlugIns` for the embed phase, an attribute the
# xcodeproj gem does not know and drops when saving. Without it the extension is
# archived as a top-level product instead of being embedded, which invalidates
# the archive (no ApplicationProperties, no distribution methods).
app.build_phases.each do |phase|
  next unless phase.is_a?(Xcodeproj::Project::Object::PBXCopyFilesBuildPhase)
  next unless phase.files_references.include?(extension.product_reference)

  phase.dst_subfolder_spec = "13" # PlugIns
end

signed = ENV["SAFARI_SIGNING"] == "appstore"
profiles = JSON.parse(ENV.fetch("SAFARI_PROVISIONING_PROFILES", "{}"))
Xcodeproj::Plist.write_to_path({
  "com.apple.security.app-sandbox" => true,
  "com.apple.security.network.client" => true
}, File.join(project_dir, "Psono.entitlements"))
[[app, app_id], [extension, extension_id]].each do |target, identifier|
  target.build_configurations.each do |config|
    settings = config.build_settings
    settings["PRODUCT_BUNDLE_IDENTIFIER"] = identifier
    settings["MARKETING_VERSION"] = manifest.fetch("version")
    settings["CURRENT_PROJECT_VERSION"] = build_number
    settings["MACOSX_DEPLOYMENT_TARGET"] = "12.0"
    settings["ARCHS"] = "$(ARCHS_STANDARD)"
    settings["ONLY_ACTIVE_ARCH"] = "NO"
    settings["DEVELOPMENT_TEAM"] = ENV.fetch("APPLE_TEAM_ID", "CVDV85ZV93")
    settings["CODE_SIGN_STYLE"] = "Manual"
    settings["CODE_SIGN_ENTITLEMENTS"] = "Psono.entitlements"
    settings["ENABLE_HARDENED_RUNTIME"] = "YES"
    settings["INFOPLIST_KEY_CFBundleShortVersionString"] = manifest.fetch("version")
    settings["INFOPLIST_KEY_CFBundleVersion"] = build_number
    settings["INFOPLIST_KEY_ITSAppUsesNonExemptEncryption"] = "NO"
    settings["INFOPLIST_KEY_CFBundleDisplayName"] = app_name if target == app
    settings["INFOPLIST_KEY_LSApplicationCategoryType"] = "public.app-category.productivity" if target == app
    if signed
      settings["CODE_SIGN_IDENTITY"] = ENV.fetch("SAFARI_CODE_SIGN_IDENTITY")
      settings["CODE_SIGN_IDENTITY[sdk=macosx*]"] = ENV.fetch("SAFARI_CODE_SIGN_IDENTITY")
      settings["PROVISIONING_PROFILE_SPECIFIER"] = profiles.fetch(identifier)
    end

    # Older packagers emit hardcoded plist versions instead of build settings.
    plist_path = File.expand_path(settings.fetch("INFOPLIST_FILE", "").gsub("$(SRCROOT)", project_dir), project_dir)
    if File.file?(plist_path)
      plist = Xcodeproj::Plist.read_from_path(plist_path)
      plist["CFBundleShortVersionString"] = "$(MARKETING_VERSION)"
      plist["CFBundleVersion"] = "$(CURRENT_PROJECT_VERSION)"
      plist["ITSAppUsesNonExemptEncryption"] = false
      plist["CFBundleDisplayName"] = app_name if target == app
      plist["LSApplicationCategoryType"] = "public.app-category.productivity" if target == app
      Xcodeproj::Plist.write_to_path(plist, plist_path)
    end
  end
end
project.save

# Use a predictable shared scheme even if the installed Xcode generates user schemes.
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(app)
scheme.set_launch_target(app)
scheme.save_as(project.path, app_name, true)

Dir.glob(File.join(output, "**/AppIcon.appiconset")).each do |icon_dir|
  images = [16, 32, 128, 256, 512].flat_map do |size|
    [1, 2].map do |scale|
      filename = "icon-#{size}@#{scale}x.png"
      pixels = (size * scale).to_s
      raise "App icon generation failed" unless system("sips", "-z", pixels, pixels,
        File.join(resources, "data/img/icon-128.png"), "--out", File.join(icon_dir, filename), out: File::NULL)
      { "idiom" => "mac", "size" => "#{size}x#{size}", "scale" => "#{scale}x", "filename" => filename }
    end
  end
  File.write(File.join(icon_dir, "Contents.json"), JSON.pretty_generate({ "images" => images, "info" => { "version" => 1, "author" => "xcode" } }))
end
puts "Safari project: #{project.path} (#{manifest.fetch('version')}, build #{build_number})"

/// Runtime config file name
pub const RC_FILE_NAME: &str = ".presetrc";

/// Default project name
pub const DEFAULT_PROJECT_NAME: &str = "my-preset-app";

/// Package name for self-upgrade
pub const PACKAGE_NAME: &str = "create-preset";

/// Clone metadata that must not leak into a project created from a private preset.
pub const PRIVATE_PRESET_METADATA: &[&str] = &[".git"];

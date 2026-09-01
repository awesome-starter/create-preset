/// Default base URL for remote config
pub const DEFAULT_BASE_URL: &str = "https://preset.js.org/config";

/// Runtime config file name
pub const RC_FILE_NAME: &str = ".presetrc";

/// Default project name
pub const DEFAULT_PROJECT_NAME: &str = "my-preset-app";

/// Package name for self-upgrade
pub const PACKAGE_NAME: &str = "create-preset";

/// Files to remove from downloaded templates
pub const OUT_OF_TEMPLATE_FILES: &[&str] = &[
    ".git",
    ".github",
    ".gitlab",
    ".gitee",
    "LICENSE",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
];

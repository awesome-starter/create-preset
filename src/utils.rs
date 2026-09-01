use regex::Regex;
use std::path::Path;

/// Check if a package name is valid for package.json
pub fn is_valid_package_name(name: &str) -> bool {
    if name.is_empty() {
        return false;
    }

    // Package name rules:
    // - can contain lowercase letters, digits, hyphens, underscores, dots
    // - cannot start with a dot or underscore
    // - scoped packages: @scope/name
    let re = Regex::new(r"^(@[a-z0-9-~][a-z0-9-._~]*/)?[a-z0-9-~][a-z0-9-._~]*$").unwrap();
    re.is_match(name)
}

/// Convert a string to a valid package name
pub fn to_valid_package_name(name: &str) -> String {
    name.trim()
        .to_lowercase()
        .replace(char::is_whitespace, "-")
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '-' || c == '_' {
                c
            } else {
                '-'
            }
        })
        .collect::<String>()
        .trim_matches('-')
        .to_string()
}

/// Check if a directory is empty
pub fn is_dir_empty<P: AsRef<Path>>(path: P) -> std::io::Result<bool> {
    let path = path.as_ref();
    if !path.exists() {
        return Ok(true);
    }

    let entries = std::fs::read_dir(path)?;
    Ok(entries.count() == 0)
}

/// Empty a directory (remove all contents but keep the directory)
pub fn empty_dir<P: AsRef<Path>>(path: P) -> std::io::Result<()> {
    let path = path.as_ref();
    if !path.exists() {
        return Ok(());
    }

    for entry in std::fs::read_dir(path)? {
        let entry = entry?;
        let path = entry.path();
        if path.is_dir() {
            std::fs::remove_dir_all(&path)?;
        } else {
            std::fs::remove_file(&path)?;
        }
    }

    Ok(())
}

/// Detect package manager from npm_config_user_agent environment variable
pub fn detect_package_manager() -> crate::types::PackageManager {
    if let Ok(user_agent) = std::env::var("npm_config_user_agent") {
        if user_agent.contains("pnpm") {
            return crate::types::PackageManager::Pnpm;
        } else if user_agent.contains("yarn") {
            return crate::types::PackageManager::Yarn;
        } else if user_agent.contains("bun") {
            return crate::types::PackageManager::Bun;
        }
    }
    crate::types::PackageManager::Npm
}

/// Ellipsis a string to a maximum length
pub fn ellipsis(s: &str, max_len: usize) -> String {
    if s.chars().count() <= max_len {
        s.to_string()
    } else if max_len <= 3 {
        ".".repeat(max_len)
    } else {
        format!("{}...", s.chars().take(max_len - 3).collect::<String>())
    }
}

/// Check if URL is a valid download URL
pub fn is_valid_download_url(url: &str) -> bool {
    !url.is_empty()
        && (url.starts_with("http://") || url.starts_with("https://") || url.starts_with("git@"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_valid_package_name() {
        assert!(is_valid_package_name("my-package"));
        assert!(is_valid_package_name("my_package"));
        assert!(is_valid_package_name("my-package-123"));
        assert!(is_valid_package_name("@scope/my-package"));
        assert!(!is_valid_package_name("My-Package")); // uppercase
        assert!(!is_valid_package_name(".my-package")); // starts with dot
        assert!(!is_valid_package_name("_my-package")); // starts with underscore
        assert!(!is_valid_package_name("")); // empty
    }

    #[test]
    fn test_to_valid_package_name() {
        assert_eq!(to_valid_package_name("My Package"), "my-package");
        assert_eq!(to_valid_package_name("my@package"), "my-package");
        assert_eq!(to_valid_package_name("  my-package  "), "my-package");
        assert_eq!(to_valid_package_name("my__package"), "my__package");
    }

    #[test]
    fn test_ellipsis() {
        assert_eq!(ellipsis("hello", 10), "hello");
        assert_eq!(ellipsis("hello world", 8), "hello...");
        assert_eq!(ellipsis("hi", 5), "hi");
        assert_eq!(ellipsis("你好世界", 3), "...");
        assert_eq!(ellipsis("你好世界", 4), "你好世界");
    }

    #[test]
    fn test_is_valid_download_url() {
        assert!(is_valid_download_url("https://github.com/user/repo"));
        assert!(is_valid_download_url("http://example.com"));
        assert!(is_valid_download_url("git@github.com:user/repo.git"));
        assert!(!is_valid_download_url(""));
        assert!(!is_valid_download_url("invalid-url"));
    }
}

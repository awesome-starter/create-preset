use crate::error::{PresetError, Result};
use crate::types::ConfigItem;
use crate::utils::is_valid_download_url;
use std::path::Path;
use std::process::Command;

/// Keep compatibility with download-git-repo's shorthand/direct syntax.
pub fn format_download_url(repo: &str) -> String {
    for (prefix, shorthand) in [
        ("https://github.com/", "github:"),
        ("https://gitlab.com/", "gitlab:"),
        ("https://bitbucket.com/", "bitbucket:"),
    ] {
        if let Some(rest) = repo.strip_prefix(prefix) {
            return format!("{}{}", shorthand, rest);
        }
    }

    if repo.starts_with("http://") || repo.starts_with("https://") || repo.starts_with("git@") {
        return format!("direct:{}", repo);
    }

    repo.to_string()
}

pub fn get_download_url(template: &str, variants: &[ConfigItem]) -> Result<String> {
    let target = variants
        .iter()
        .find(|item| item.name == template || crate::utils::ellipsis(&item.name, 20) == template)
        .ok_or_else(|| PresetError::ValidationError(format!("Unknown template: {}", template)))?;

    let repo = &target.repo;

    if !is_valid_download_url(repo) {
        return Err(PresetError::ValidationError(format!(
            "Invalid download URL for template {}",
            template
        )));
    }

    Ok(format_download_url(repo))
}

pub fn download_repo(repo: &str, folder: &Path) -> Result<()> {
    let expanded;
    let source = if let Some(value) = repo.strip_prefix("direct:") {
        value
    } else if let Some(value) = repo.strip_prefix("github:") {
        expanded = format!("https://github.com/{}", value);
        &expanded
    } else if let Some(value) = repo.strip_prefix("gitlab:") {
        expanded = format!("https://gitlab.com/{}", value);
        &expanded
    } else if let Some(value) = repo.strip_prefix("bitbucket:") {
        expanded = format!("https://bitbucket.com/{}", value);
        &expanded
    } else {
        repo
    };
    if !is_valid_download_url(source) {
        return Err(PresetError::ValidationError(format!(
            "Invalid Git URL: {}",
            source
        )));
    }

    let (source, branch) = source
        .split_once('#')
        .map_or((source, None), |(url, branch)| {
            (url, (!branch.is_empty()).then_some(branch))
        });

    let mut command = Command::new("git");
    command.arg("clone").arg("--depth").arg("1");
    if let Some(branch) = branch {
        command.arg("--branch").arg(branch);
    }
    command.arg(source);
    command.arg(folder);

    let output = command
        .output()
        .map_err(|e| PresetError::DownloadError(format!("Failed to execute git: {}", e)))?;
    if !output.status.success() {
        let detail = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(PresetError::DownloadError(if detail.is_empty() {
            format!("git clone exited with {}", output.status)
        } else {
            detail
        }));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn formats_git_urls() {
        assert_eq!(format_download_url("https://github.com/a/b"), "github:a/b");
        assert_eq!(
            format_download_url("https://example.com/a/b"),
            "direct:https://example.com/a/b"
        );
        assert_eq!(
            format_download_url("git@github.com:a/b"),
            "direct:git@github.com:a/b"
        );
    }

    #[test]
    fn selects_repo_and_preserves_branch() {
        let variants = vec![ConfigItem {
            tech: "vue".to_string(),
            name: "starter".to_string(),
            desc: String::new(),
            repo: "https://github.com/example/starter#main".to_string(),
        }];
        assert_eq!(
            get_download_url("starter", &variants).unwrap(),
            "github:example/starter#main"
        );
    }
}

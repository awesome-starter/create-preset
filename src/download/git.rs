use crate::error::{PresetError, Result};
use crate::utils::is_valid_download_url;
use std::path::Path;
use std::process::Command;

pub fn download_repo(repo: &str, folder: &Path) -> Result<()> {
    if !is_valid_download_url(repo) {
        return Err(PresetError::ValidationError(format!(
            "Invalid Git URL: {}",
            repo
        )));
    }

    let (source, branch) = repo.split_once('#').map_or((repo, None), |(url, branch)| {
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
    fn rejects_invalid_git_urls() {
        let temp = tempfile::tempdir().unwrap();
        assert!(download_repo("not-a-url", &temp.path().join("project")).is_err());
    }
}

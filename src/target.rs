use crate::error::{PresetError, Result};
use crate::utils::empty_dir;
use std::fs;
use std::path::{Path, PathBuf};
use tempfile::TempDir;

/// Keep backups beside the target so renames remain on the same filesystem.
/// Never rename the current directory itself (especially on Windows).
pub struct TargetTransaction {
    root: PathBuf,
    existed: bool,
    backup: Option<TempDir>,
    active: bool,
}

pub fn validate_target(root: &Path) -> Result<()> {
    if root.parent().is_none() {
        return Err(PresetError::ValidationError(
            "The filesystem root cannot be a project target".to_string(),
        ));
    }
    match fs::symlink_metadata(root) {
        Ok(metadata) if metadata.file_type().is_symlink() || !metadata.is_dir() => {
            Err(PresetError::ValidationError(
                "The project target must be a directory, not a file or symbolic link".to_string(),
            ))
        }
        Ok(_) => Ok(()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(error.into()),
    }
}

pub fn staging_directory(root: &Path) -> Result<TempDir> {
    let parent = root.parent().ok_or_else(|| {
        PresetError::ValidationError("The project target must have a parent directory".to_string())
    })?;
    fs::create_dir_all(parent)?;
    Ok(tempfile::Builder::new()
        .prefix(".preset-")
        .tempdir_in(parent)?)
}

impl TargetTransaction {
    pub fn begin(root: &Path, delegated: bool) -> Result<Self> {
        validate_target(root)?;
        let existed = root.exists();
        let backup = staging_directory(root)?;
        let original = backup.path().join("original");
        fs::create_dir(&original)?;
        let mut transaction = Self {
            root: root.to_path_buf(),
            existed,
            backup: Some(backup),
            active: false,
        };

        if existed {
            let result = (|| -> std::io::Result<()> {
                for entry in fs::read_dir(root)? {
                    let entry = entry?;
                    fs::rename(entry.path(), original.join(entry.file_name()))?;
                }
                Ok(())
            })();
            if let Err(error) = result {
                // A partial backup must restore only moved entries, without
                // deleting originals that have not moved yet.
                return Err(transaction.restore_error(error.into(), false));
            }
        }
        transaction.active = true;
        let cwd = std::env::current_dir().and_then(fs::canonicalize);
        let prepared = if delegated && fs::canonicalize(root).ok() != cwd.ok() {
            if existed {
                fs::remove_dir(root)
            } else {
                Ok(())
            }
        } else {
            fs::create_dir_all(root)
        };
        if let Err(error) = prepared {
            return Err(transaction.fail(error.into()));
        }
        Ok(transaction)
    }

    /// Publish a fully generated private preset after its operations succeed.
    pub fn publish(&self, staged: &Path) -> Result<()> {
        fs::create_dir_all(&self.root)?;
        for entry in fs::read_dir(staged)? {
            let entry = entry?;
            fs::rename(entry.path(), self.root.join(entry.file_name()))?;
        }
        Ok(())
    }

    pub fn commit(mut self) {
        self.active = false;
    }

    pub fn fail(mut self, error: PresetError) -> PresetError {
        self.restore_error(error, true)
    }

    fn restore(&self, clear_generated: bool) -> Result<()> {
        if clear_generated {
            // A generator may replace the target with a symlink or a file.
            // Remove the entry itself rather than following it during rollback.
            match fs::symlink_metadata(&self.root) {
                Ok(metadata) if metadata.file_type().is_symlink() || !metadata.is_dir() => {
                    fs::remove_file(&self.root)?;
                }
                Ok(_) => empty_dir(&self.root)?,
                Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
                Err(error) => return Err(error.into()),
            }
        }
        if self.existed {
            fs::create_dir_all(&self.root)?;
            let original = self
                .backup
                .as_ref()
                .expect("active backup")
                .path()
                .join("original");
            for entry in fs::read_dir(original)? {
                let entry = entry?;
                fs::rename(entry.path(), self.root.join(entry.file_name()))?;
            }
        } else if self.root.exists() {
            fs::remove_dir(&self.root)?;
        }
        Ok(())
    }

    fn restore_error(&mut self, error: PresetError, clear_generated: bool) -> PresetError {
        self.active = false;
        match self.restore(clear_generated) {
            Ok(()) => error,
            Err(restore_error) => {
                // Keep the only copy of the user's originals if restoration fails.
                let backup = self.backup.take().expect("active backup").keep();
                PresetError::IoError(format!(
                    "{}; restoration failed: {}. Original files are retained in {}",
                    error,
                    restore_error,
                    backup.join("original").display()
                ))
            }
        }
    }
}

impl Drop for TargetTransaction {
    fn drop(&mut self) {
        if self.active {
            let error = self.restore_error(PresetError::UserCancelled, true);
            if !matches!(error, PresetError::UserCancelled) {
                eprintln!("{}", error);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn restores_original_files_and_removes_partial_output() {
        let temp = tempfile::tempdir().unwrap();
        let root = temp.path().join("existing");
        fs::create_dir_all(root.join(".git")).unwrap();
        fs::write(root.join(".git/config"), "original git metadata").unwrap();
        fs::write(root.join("README.md"), "original").unwrap();
        let transaction = TargetTransaction::begin(&root, false).unwrap();
        fs::write(root.join("README.md"), "generated").unwrap();
        fs::write(root.join("partial"), "partial").unwrap();
        transaction.fail(PresetError::GeneratorError("failed".to_string()));
        assert_eq!(
            fs::read_to_string(root.join("README.md")).unwrap(),
            "original"
        );
        assert_eq!(
            fs::read_to_string(root.join(".git/config")).unwrap(),
            "original git metadata"
        );
        assert!(!root.join("partial").exists());
    }

    #[test]
    fn removes_new_target_on_failure_and_commits_completed_output() {
        let temp = tempfile::tempdir().unwrap();
        let root = temp.path().join("new");
        let transaction = TargetTransaction::begin(&root, true).unwrap();
        fs::create_dir(&root).unwrap();
        fs::write(root.join("partial"), "partial").unwrap();
        drop(transaction);
        assert!(!root.exists());
        let staged = staging_directory(&root).unwrap();
        fs::write(staged.path().join("complete"), "complete").unwrap();
        let transaction = TargetTransaction::begin(&root, false).unwrap();
        transaction.publish(staged.path()).unwrap();
        transaction.commit();
        assert_eq!(
            fs::read_to_string(root.join("complete")).unwrap(),
            "complete"
        );
    }
}

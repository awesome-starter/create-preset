use crate::error::{PresetError, Result};
use crate::types::PackageManager;
use std::path::{Path, PathBuf};
use std::process::Command;

/// Windows package managers commonly use .cmd shims. Rust only infers .exe,
/// so resolve the shim explicitly and let Command escape its arguments.
pub fn package_manager_command(manager: PackageManager) -> Result<Command> {
    let program = manager.as_str();
    if cfg!(windows) {
        let paths: Vec<_> = std::env::var_os("PATH")
            .map(|value| std::env::split_paths(&value).collect())
            .unwrap_or_default();
        let executable = resolve_windows_program(program, &paths).ok_or_else(|| {
            PresetError::GeneratorError(format!("Cannot find {} on PATH", program))
        })?;
        Ok(Command::new(executable))
    } else {
        Ok(Command::new(program))
    }
}

fn resolve_windows_program(program: &str, paths: &[PathBuf]) -> Option<PathBuf> {
    for directory in paths {
        // Ignore empty/relative PATH entries instead of executing a project file.
        if !directory.is_absolute() {
            continue;
        }
        for extension in ["exe", "cmd", "bat", "com"] {
            let path = directory.join(format!("{}.{}", program, extension));
            if Path::new(&path).is_file() {
                return Some(path);
            }
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolves_windows_shims_in_path_order() {
        let temp = tempfile::tempdir().unwrap();
        let first = temp.path().join("first path with spaces");
        let second = temp.path().join("second");
        std::fs::create_dir_all(&first).unwrap();
        std::fs::create_dir_all(&second).unwrap();
        std::fs::write(first.join("npm.cmd"), "shim").unwrap();
        std::fs::write(second.join("npm.exe"), "binary").unwrap();
        assert_eq!(
            resolve_windows_program("npm", &[first.clone(), second]),
            Some(first.join("npm.cmd"))
        );
        std::fs::write(first.join("npm.exe"), "binary").unwrap();
        assert_eq!(
            resolve_windows_program("npm", std::slice::from_ref(&first)),
            Some(first.join("npm.exe"))
        );
        assert_eq!(resolve_windows_program("missing", &[first]), None);
    }
}

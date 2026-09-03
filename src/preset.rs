use crate::download::download_repo;
use crate::error::{PresetError, Result};
use crate::types::PresetPlan;
use crate::utils::is_valid_download_url;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::fs;
use std::io::Read;
use std::path::{Component, Path, PathBuf};
use std::process::Command;
use std::time::Duration;

const MAX_CONFIG_BYTES: usize = 1024 * 1024;
const MAX_OPERATIONS: usize = 1_000;

pub fn load_preset_plan(reference: &str) -> Result<PresetPlan> {
    let remote = reference.starts_with("https://") || reference.starts_with("http://");
    let content = if remote {
        let url = reqwest::Url::parse(reference).map_err(|error| {
            PresetError::ValidationError(format!("Invalid preset config URL: {}", error))
        })?;
        if !url.path().ends_with(".json") {
            return Err(PresetError::ValidationError(
                "Remote preset configs must use a .json URL".to_string(),
            ));
        }
        let client = reqwest::blocking::Client::builder()
            .timeout(Duration::from_secs(30))
            .build()?;
        let response = client
            .get(reference)
            .send()?
            .error_for_status()
            .map_err(|error| PresetError::NetworkError(error.to_string()))?;
        let final_scheme = response.url().scheme();
        if !matches!(final_scheme, "http" | "https")
            || (reference.starts_with("https://") && final_scheme != "https")
        {
            return Err(PresetError::ValidationError(
                "Remote preset config redirects must remain on HTTP(S) and cannot downgrade HTTPS"
                    .to_string(),
            ));
        }
        if response
            .headers()
            .get(reqwest::header::CONTENT_TYPE)
            .and_then(|value| value.to_str().ok())
            .is_some_and(|value| {
                let media_type = value.split(';').next().unwrap_or_default().trim();
                media_type != "application/json"
                    && !media_type.ends_with("+json")
                    && media_type != "text/plain"
                    && media_type != "application/octet-stream"
            })
        {
            return Err(PresetError::ValidationError(
                "Remote preset config must use a JSON content type".to_string(),
            ));
        }
        if response
            .content_length()
            .is_some_and(|length| length > MAX_CONFIG_BYTES as u64)
        {
            return Err(PresetError::ValidationError(
                "Remote preset config exceeds the 1 MiB limit".to_string(),
            ));
        }
        let mut bytes = Vec::new();
        response
            .take(MAX_CONFIG_BYTES as u64 + 1)
            .read_to_end(&mut bytes)?;
        if bytes.len() > MAX_CONFIG_BYTES {
            return Err(PresetError::ValidationError(
                "Remote preset config exceeds the 1 MiB limit".to_string(),
            ));
        }
        bytes
    } else {
        let path = PathBuf::from(reference);
        if path.extension().and_then(|value| value.to_str()) != Some("json") {
            return Err(PresetError::ValidationError(
                "Preset config paths must end in .json".to_string(),
            ));
        }
        if !path.is_file() {
            return Err(PresetError::ValidationError(format!(
                "Preset config is not a file: {}",
                path.display()
            )));
        }
        let content = fs::read(path)?;
        if content.len() > MAX_CONFIG_BYTES {
            return Err(PresetError::ValidationError(
                "Preset config exceeds the 1 MiB limit".to_string(),
            ));
        }
        content
    };

    let plan: PresetPlan = serde_json::from_slice(&content).map_err(|error| {
        PresetError::ConfigError(format!("Preset config is invalid: {}", error))
    })?;
    validate_plan(&plan, remote)?;
    Ok(plan)
}

pub fn materialize_preset_plan(plan: &PresetPlan, target: &Path) -> Result<()> {
    let temporary = tempfile::tempdir()?;
    let checkout = temporary.path().join("source");
    download_repo(&plan.source.repo, &checkout)?;

    let directory = safe_relative_path(&plan.source.directory, "source directory", true)?;
    let source = checkout.join(directory);
    if !source.is_dir() {
        return Err(PresetError::ValidationError(format!(
            "Preset source directory does not exist: {}",
            plan.source.directory
        )));
    }
    let checkout_root = fs::canonicalize(&checkout)?;
    let source_root = fs::canonicalize(&source)?;
    if !source_root.starts_with(&checkout_root) {
        return Err(PresetError::ValidationError(
            "Preset source directory cannot escape the repository checkout".to_string(),
        ));
    }

    let excludes = plan
        .exclude
        .iter()
        .map(|path| safe_relative_path(path, "excluded path", false))
        .collect::<Result<Vec<_>>>()?;
    copy_filtered(&source_root, target, Path::new(""), &excludes)?;
    apply_writes(target, &plan.write)?;
    apply_replacements(target, &plan.replace)?;
    apply_json_merges(target, &plan.json)?;
    if plan.package_json.resolve_workspace {
        resolve_workspace_dependencies(target, &plan.package_json.workspace_versions)?;
    }
    Ok(())
}

fn validate_plan(plan: &PresetPlan, remote: bool) -> Result<()> {
    if plan.version != 1 {
        return Err(PresetError::ConfigError(format!(
            "Unsupported preset config version: {}",
            plan.version
        )));
    }
    if !is_valid_download_url(&plan.source.repo) {
        return Err(PresetError::ValidationError(
            "Preset config contains an invalid repository URL".to_string(),
        ));
    }
    if plan.source.repo.len() > 2_048 {
        return Err(PresetError::ValidationError(
            "Preset repository URL exceeds the 2,048 character limit".to_string(),
        ));
    }
    if remote
        && !plan.source.repo.starts_with("https://")
        && !plan.source.repo.starts_with("http://")
    {
        return Err(PresetError::ValidationError(
            "Remote preset configs must use an HTTP(S) repository URL".to_string(),
        ));
    }
    let operation_count =
        plan.exclude.len() + plan.write.len() + plan.replace.len() + plan.json.len();
    if operation_count > MAX_OPERATIONS {
        return Err(PresetError::ValidationError(format!(
            "Preset config exceeds the {} operation limit",
            MAX_OPERATIONS
        )));
    }
    safe_relative_path(&plan.source.directory, "source directory", true)?;
    for path in &plan.exclude {
        safe_relative_path(path, "excluded path", false)?;
    }
    for write in &plan.write {
        safe_relative_path(&write.path, "write path", false)?;
        if write
            .lines
            .iter()
            .any(|line| line.contains('\r') || line.contains('\n'))
        {
            return Err(PresetError::ValidationError(
                "Preset write lines cannot contain newline characters".to_string(),
            ));
        }
    }
    for replacement in &plan.replace {
        safe_relative_path(&replacement.path, "replacement path", false)?;
        if replacement.from.is_empty() {
            return Err(PresetError::ValidationError(
                "Preset replacement text cannot be empty".to_string(),
            ));
        }
    }
    for merge in &plan.json {
        safe_relative_path(&merge.path, "JSON merge path", false)?;
        if !merge.value.is_object() {
            return Err(PresetError::ValidationError(
                "Preset JSON merge values must be objects".to_string(),
            ));
        }
    }
    Ok(())
}

fn safe_relative_path(value: &str, label: &str, allow_empty: bool) -> Result<PathBuf> {
    let path = Path::new(value);
    if (!allow_empty && value.trim().is_empty())
        || value.len() > 512
        || path.is_absolute()
        || path.components().any(|component| {
            matches!(
                component,
                Component::ParentDir | Component::RootDir | Component::Prefix(_)
            )
        })
    {
        return Err(PresetError::ValidationError(format!(
            "Preset {} must be a safe relative path: {}",
            label, value
        )));
    }
    Ok(path.to_path_buf())
}

fn copy_filtered(
    source: &Path,
    target: &Path,
    relative: &Path,
    excludes: &[PathBuf],
) -> Result<()> {
    fs::create_dir_all(target)?;
    for entry in fs::read_dir(source)? {
        let entry = entry?;
        let child_relative = relative.join(entry.file_name());
        if child_relative == Path::new(".git")
            || excludes
                .iter()
                .any(|excluded| child_relative == *excluded || child_relative.starts_with(excluded))
        {
            continue;
        }
        let source_path = entry.path();
        let target_path = target.join(entry.file_name());
        let file_type = entry.file_type()?;
        if file_type.is_dir() {
            copy_filtered(&source_path, &target_path, &child_relative, excludes)?;
        } else if file_type.is_file() {
            fs::copy(source_path, target_path)?;
        } else {
            return Err(PresetError::ValidationError(format!(
                "Preset sources cannot contain symbolic links: {}",
                child_relative.display()
            )));
        }
    }
    Ok(())
}

fn apply_replacements(target: &Path, replacements: &[crate::types::TextReplacement]) -> Result<()> {
    for replacement in replacements {
        let path = target.join(&replacement.path);
        if !path.is_file() {
            return Err(PresetError::ValidationError(format!(
                "Preset replacement file does not exist: {}",
                replacement.path
            )));
        }
        let content = fs::read_to_string(&path)?;
        if !content.contains(&replacement.from) {
            return Err(PresetError::ValidationError(format!(
                "Preset replacement text was not found in {}",
                replacement.path
            )));
        }
        fs::write(path, content.replace(&replacement.from, &replacement.to))?;
    }
    Ok(())
}

fn apply_writes(target: &Path, writes: &[crate::types::FileWrite]) -> Result<()> {
    for write in writes {
        let path = target.join(&write.path);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(path, write.lines.join("\n") + "\n")?;
    }
    Ok(())
}

fn apply_json_merges(target: &Path, merges: &[crate::types::JsonMerge]) -> Result<()> {
    for merge in merges {
        let path = target.join(&merge.path);
        if !path.is_file() {
            return Err(PresetError::ValidationError(format!(
                "Preset JSON merge file does not exist: {}",
                merge.path
            )));
        }
        let mut document: Value = serde_json::from_str(&fs::read_to_string(&path)?)?;
        merge_json(&mut document, &merge.value);
        fs::write(path, serde_json::to_string_pretty(&document)? + "\n")?;
    }
    Ok(())
}

fn merge_json(target: &mut Value, patch: &Value) {
    let Value::Object(patch) = patch else {
        *target = patch.clone();
        return;
    };
    if !target.is_object() {
        *target = json!({});
    }
    let target = target
        .as_object_mut()
        .expect("target was converted to an object");
    for (key, value) in patch {
        if value.is_null() {
            target.remove(key);
        } else {
            merge_json(target.entry(key).or_insert(Value::Null), value);
        }
    }
}

fn resolve_workspace_dependencies(
    target: &Path,
    workspace_versions: &HashMap<String, String>,
) -> Result<()> {
    let path = target.join("package.json");
    if !path.is_file() {
        return Err(PresetError::ValidationError(
            "packageJson.resolveWorkspace requires a package.json file".to_string(),
        ));
    }
    let mut package: Value = serde_json::from_str(&fs::read_to_string(&path)?)?;
    let mut versions = HashMap::<String, String>::new();
    replace_workspace_versions(&mut package, workspace_versions, |name| {
        if let Some(version) = versions.get(name) {
            return Ok(version.clone());
        }
        let version = resolve_npm_version(name)?;
        versions.insert(name.to_string(), version.clone());
        Ok(version)
    })?;
    fs::write(path, serde_json::to_string_pretty(&package)? + "\n")?;
    Ok(())
}

fn replace_workspace_versions<F>(
    package: &mut Value,
    overrides: &HashMap<String, String>,
    mut resolve: F,
) -> Result<()>
where
    F: FnMut(&str) -> Result<String>,
{
    for section in [
        "dependencies",
        "devDependencies",
        "peerDependencies",
        "optionalDependencies",
    ] {
        let Some(dependencies) = package.get_mut(section).and_then(Value::as_object_mut) else {
            continue;
        };
        for (name, requirement) in dependencies {
            let Some(current) = requirement.as_str() else {
                continue;
            };
            if !current.starts_with("workspace:") {
                continue;
            }
            if let Some(version) = overrides.get(name) {
                *requirement = Value::String(version.clone());
                continue;
            }
            let prefix = if current.starts_with("workspace:~") {
                "~"
            } else {
                "^"
            };
            *requirement = Value::String(format!("{}{}", prefix, resolve(name)?));
        }
    }
    Ok(())
}

fn resolve_npm_version(package: &str) -> Result<String> {
    let output = Command::new("npm")
        .args(["view", package, "version", "--json"])
        .output()
        .map_err(|error| {
            PresetError::GeneratorError(format!(
                "Failed to resolve {} from npm: {}",
                package, error
            ))
        })?;
    if !output.status.success() {
        let detail = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(PresetError::NetworkError(format!(
            "Failed to resolve {} from npm: {}",
            package,
            if detail.is_empty() {
                output.status.to_string()
            } else {
                detail
            }
        )));
    }
    let version: String = serde_json::from_slice(&output.stdout).map_err(|error| {
        PresetError::ConfigError(format!(
            "npm returned an invalid version for {}: {}",
            package, error
        ))
    })?;
    semver::Version::parse(&version).map_err(|error| {
        PresetError::ConfigError(format!(
            "npm returned an invalid version for {}: {}",
            package, error
        ))
    })?;
    Ok(version)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{JsonMerge, PresetPackageJson, PresetSource, TextReplacement};

    #[test]
    fn loads_a_local_json_config() {
        let temporary = tempfile::tempdir().unwrap();
        let config = temporary.path().join("preset.json");
        fs::write(
            &config,
            r#"{"version":1,"source":{"repo":"https://example.com/repo"}}"#,
        )
        .unwrap();
        let plan = load_preset_plan(config.to_str().unwrap()).unwrap();
        assert_eq!(plan.source.repo, "https://example.com/repo");
    }

    #[test]
    fn filters_files_and_applies_text_replacements() {
        let temporary = tempfile::tempdir().unwrap();
        let source = temporary.path().join("source");
        let target = temporary.path().join("target");
        fs::create_dir_all(source.join("cache")).unwrap();
        fs::write(source.join("README.md"), "hello starter").unwrap();
        fs::write(source.join("cache/generated"), "skip").unwrap();
        let excludes = vec![PathBuf::from("cache")];
        copy_filtered(&source, &target, Path::new(""), &excludes).unwrap();
        apply_replacements(
            &target,
            &[TextReplacement {
                path: "README.md".to_string(),
                from: "starter".to_string(),
                to: "project".to_string(),
            }],
        )
        .unwrap();
        assert_eq!(
            fs::read_to_string(target.join("README.md")).unwrap(),
            "hello project"
        );
        assert!(!target.join("cache").exists());
    }

    #[test]
    fn resolves_workspace_protocols_with_the_base_runtime() {
        let mut package = json!({
            "dependencies": {
                "blackwork": "workspace:*",
                "@blackwork/docs": "workspace:~"
            },
            "devDependencies": {"vitest": "^4.0.0"}
        });
        replace_workspace_versions(&mut package, &HashMap::new(), |name| {
            Ok(match name {
                "blackwork" => "0.12.2",
                "@blackwork/docs" => "0.5.0",
                _ => unreachable!(),
            }
            .to_string())
        })
        .unwrap();
        assert_eq!(package["dependencies"]["blackwork"], "^0.12.2");
        assert_eq!(package["dependencies"]["@blackwork/docs"], "~0.5.0");
        assert_eq!(package["devDependencies"]["vitest"], "^4.0.0");
    }

    #[test]
    fn uses_explicit_workspace_version_overrides() {
        let mut package = json!({
            "dependencies": {
                "vue": "workspace:*",
                "@company/ui": "workspace:~"
            }
        });
        let overrides = HashMap::from([
            ("vue".to_string(), "3.4.38".to_string()),
            ("@company/ui".to_string(), "1.8.2".to_string()),
        ]);
        replace_workspace_versions(&mut package, &overrides, |_| {
            panic!("an explicit override should not query the registry")
        })
        .unwrap();
        assert_eq!(package["dependencies"]["vue"], "3.4.38");
        assert_eq!(package["dependencies"]["@company/ui"], "1.8.2");
    }

    #[test]
    fn applies_json_merge_patches() {
        let temporary = tempfile::tempdir().unwrap();
        let path = temporary.path().join("package.json");
        fs::write(
            &path,
            r#"{"scripts":{"test":"vitest","build":"old"},"private":false}"#,
        )
        .unwrap();
        apply_json_merges(
            temporary.path(),
            &[JsonMerge {
                path: "package.json".to_string(),
                value: json!({
                    "scripts": {"test": null, "build": "next build"},
                    "private": true
                }),
            }],
        )
        .unwrap();
        let package: Value = serde_json::from_str(&fs::read_to_string(path).unwrap()).unwrap();
        assert_eq!(package["scripts"]["build"], "next build");
        assert!(package["scripts"].get("test").is_none());
        assert_eq!(package["private"], true);
    }

    #[test]
    fn rejects_paths_that_escape_the_source() {
        let plan = PresetPlan {
            _schema: None,
            version: 1,
            source: PresetSource {
                repo: "https://example.com/repo".to_string(),
                directory: "../private".to_string(),
            },
            exclude: Vec::new(),
            write: Vec::new(),
            replace: Vec::new(),
            json: Vec::new(),
            package_json: PresetPackageJson::default(),
        };
        assert!(validate_plan(&plan, false).is_err());
    }

    #[test]
    fn rejects_local_sources_from_remote_configs() {
        let plan = PresetPlan {
            _schema: None,
            version: 1,
            source: PresetSource {
                repo: "file:///tmp/repo".to_string(),
                directory: String::new(),
            },
            exclude: Vec::new(),
            write: Vec::new(),
            replace: Vec::new(),
            json: Vec::new(),
            package_json: PresetPackageJson::default(),
        };
        assert!(validate_plan(&plan, true).is_err());
    }

    #[test]
    fn accepts_http_sources_from_remote_configs_for_private_networks() {
        let plan = PresetPlan {
            _schema: None,
            version: 1,
            source: PresetSource {
                repo: "http://192.168.1.10/starter.git".to_string(),
                directory: String::new(),
            },
            exclude: Vec::new(),
            write: Vec::new(),
            replace: Vec::new(),
            json: Vec::new(),
            package_json: PresetPackageJson::default(),
        };
        assert!(validate_plan(&plan, true).is_ok());
    }
}

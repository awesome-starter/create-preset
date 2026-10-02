use crate::error::{PresetError, Result};
use crate::generator::{built_in_techs, official_generators};
use crate::types::{PrivatePreset, PrivatePresetFile, StarterChoice, TechMetadata, TechStack};
use crate::utils::is_valid_download_url;
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};

pub struct PrivateCatalog {
    pub techs: HashMap<String, TechMetadata>,
    pub presets: Vec<PrivatePreset>,
}

pub fn load_private_catalog(path: &Path) -> Result<PrivateCatalog> {
    if !path.is_file() {
        return Err(PresetError::ValidationError(format!(
            "Private preset config is not a file: {}",
            path.display()
        )));
    }
    let content = std::fs::read_to_string(path)
        .map_err(|error| PresetError::IoError(format!("Failed to read config file: {}", error)))?;
    let file: PrivatePresetFile = serde_json::from_str(&content).map_err(|error| {
        PresetError::ConfigError(format!("Failed to parse private preset config: {}", error))
    })?;
    let (techs, mut presets) = match file {
        PrivatePresetFile::Presets(presets) => (HashMap::new(), presets),
        PrivatePresetFile::Manifest {
            version,
            techs,
            presets,
        } => {
            if version != 1 {
                return Err(PresetError::ConfigError(format!(
                    "Unsupported private preset config version: {}",
                    version
                )));
            }
            (techs, presets)
        }
    };
    resolve_config_paths(
        &mut presets,
        path.parent().unwrap_or_else(|| Path::new(".")),
    );
    validate_private_presets(&presets)?;
    Ok(PrivateCatalog { techs, presets })
}

fn resolve_config_paths(presets: &mut [PrivatePreset], base: &Path) {
    for preset in presets {
        let Some(config) = preset.config.as_mut() else {
            continue;
        };
        if !config.starts_with("https://") && !config.starts_with("http://") {
            let path = PathBuf::from(&*config);
            if !path.is_absolute() {
                *config = base.join(path).to_string_lossy().into_owned();
            }
        }
    }
}

fn validate_private_presets(presets: &[PrivatePreset]) -> Result<()> {
    if presets.is_empty() {
        return Err(PresetError::ValidationError(
            "Private preset config must contain at least one preset".to_string(),
        ));
    }
    let mut names = HashSet::new();
    let mut sources = HashSet::new();
    for (index, preset) in presets.iter().enumerate() {
        let item = index + 1;
        if preset.tech.trim().is_empty() {
            return Err(PresetError::ValidationError(format!(
                "Preset {} must define tech",
                item
            )));
        }
        if preset.name.trim().is_empty() {
            return Err(PresetError::ValidationError(format!(
                "Preset {} must define name",
                item
            )));
        }
        let repo = preset
            .repo
            .as_deref()
            .filter(|value| !value.trim().is_empty());
        let config = preset
            .config
            .as_deref()
            .filter(|value| !value.trim().is_empty());
        if repo.is_some() == config.is_some() {
            return Err(PresetError::ValidationError(format!(
                "Preset {} must define exactly one of repo or config",
                preset.name
            )));
        }
        if repo.is_some_and(|value| !is_valid_download_url(value)) {
            return Err(PresetError::ValidationError(format!(
                "Preset {} has an invalid repository URL",
                preset.name
            )));
        }
        if let Some(config) = config {
            let is_remote = config.starts_with("https://") || config.starts_with("http://");
            let is_json = if is_remote {
                reqwest::Url::parse(config).is_ok_and(|url| url.path().ends_with(".json"))
            } else {
                Path::new(config)
                    .extension()
                    .and_then(|value| value.to_str())
                    == Some("json")
            };
            if !is_json || (!is_remote && !Path::new(config).is_file()) {
                return Err(PresetError::ValidationError(format!(
                    "Preset {} has an invalid JSON config",
                    preset.name
                )));
            }
        }
        if !names.insert(preset.name.clone()) {
            return Err(PresetError::ValidationError(format!(
                "Duplicate preset name: {}",
                preset.name
            )));
        }
        let source = repo.or(config).expect("validated preset source");
        if !sources.insert(source.to_string()) {
            return Err(PresetError::ValidationError(format!(
                "Duplicate preset source: {}",
                source
            )));
        }
    }
    Ok(())
}

pub fn build_catalog(private: Option<PrivateCatalog>) -> Vec<TechStack> {
    let mut stacks = Vec::<TechStack>::new();
    for tech in built_in_techs() {
        stacks.push(TechStack {
            id: tech.id.to_string(),
            label: tech.label.to_string(),
            color: tech.color.to_string(),
            choices: Vec::new(),
        });
    }

    let (metadata, presets) = private
        .map(|catalog| (catalog.techs, catalog.presets))
        .unwrap_or_default();
    for preset in presets {
        let tech_id = preset.tech.clone();
        get_or_insert_stack(&mut stacks, &tech_id, metadata.get(&tech_id))
            .choices
            .push(StarterChoice::Private(preset));
    }
    for generator in official_generators() {
        let tech_id = generator.tech.clone();
        get_or_insert_stack(&mut stacks, &tech_id, metadata.get(&tech_id))
            .choices
            .push(StarterChoice::Official(generator));
    }
    stacks.retain(|stack| !stack.choices.is_empty());
    stacks
}

fn get_or_insert_stack<'a>(
    stacks: &'a mut Vec<TechStack>,
    id: &str,
    metadata: Option<&TechMetadata>,
) -> &'a mut TechStack {
    if let Some(index) = stacks.iter().position(|stack| stack.id == id) {
        if let Some(metadata) = metadata {
            apply_metadata(&mut stacks[index], metadata);
        }
        return &mut stacks[index];
    }
    let mut stack = TechStack {
        id: id.to_string(),
        label: title_case(id),
        color: String::new(),
        choices: Vec::new(),
    };
    if let Some(metadata) = metadata {
        apply_metadata(&mut stack, metadata);
    }
    stacks.push(stack);
    stacks.last_mut().expect("inserted stack must exist")
}

fn apply_metadata(stack: &mut TechStack, metadata: &TechMetadata) {
    if !metadata.label.trim().is_empty() {
        stack.label = metadata.label.trim().to_string();
    }
    if !metadata.color.trim().is_empty() {
        stack.color = metadata.color.trim().to_string();
    }
}

fn title_case(value: &str) -> String {
    value
        .split(['-', '_', ' '])
        .filter(|part| !part.is_empty())
        .map(|part| {
            let mut chars = part.chars();
            chars
                .next()
                .map(|first| first.to_uppercase().collect::<String>() + chars.as_str())
                .unwrap_or_default()
        })
        .collect::<Vec<_>>()
        .join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn adds_unknown_private_tech_and_keeps_private_choice_first() {
        let private = PrivateCatalog {
            techs: HashMap::new(),
            presets: vec![PrivatePreset {
                tech: "python".to_string(),
                name: "company-api".to_string(),
                desc: String::new(),
                repo: Some("https://example.com/api".to_string()),
                config: None,
            }],
        };
        let catalog = build_catalog(Some(private));
        let python = catalog.iter().find(|stack| stack.id == "python").unwrap();
        assert_eq!(python.label, "Python");
        assert!(matches!(python.choices[0], StarterChoice::Private(_)));
    }

    #[test]
    fn applies_manifest_metadata_to_custom_tech() {
        let private = PrivateCatalog {
            techs: HashMap::from([(
                "company_backend".to_string(),
                TechMetadata {
                    label: "Company Backend".to_string(),
                    color: "#123456".to_string(),
                },
            )]),
            presets: vec![PrivatePreset {
                tech: "company_backend".to_string(),
                name: "service".to_string(),
                desc: String::new(),
                repo: Some("https://example.com/service".to_string()),
                config: None,
            }],
        };
        let catalog = build_catalog(Some(private));
        let stack = catalog
            .iter()
            .find(|stack| stack.id == "company_backend")
            .unwrap();
        assert_eq!(stack.label, "Company Backend");
        assert_eq!(stack.color, "#123456");
    }

    #[test]
    fn keeps_private_presets_before_official_generators() {
        let private = PrivateCatalog {
            techs: HashMap::new(),
            presets: vec![PrivatePreset {
                tech: "react".to_string(),
                name: "company-react".to_string(),
                desc: String::new(),
                repo: Some("https://example.com/react".to_string()),
                config: None,
            }],
        };
        let catalog = build_catalog(Some(private));
        let react = catalog.iter().find(|stack| stack.id == "react").unwrap();
        assert!(matches!(react.choices[0], StarterChoice::Private(_)));
        assert!(matches!(react.choices[1], StarterChoice::Official(_)));
    }

    #[test]
    fn rejects_empty_and_duplicate_private_presets() {
        let temp = tempfile::tempdir().unwrap();
        let empty = temp.path().join("empty.json");
        fs::write(&empty, "[]").unwrap();
        assert!(load_private_catalog(&empty).is_err());

        let duplicate = temp.path().join("duplicate.json");
        fs::write(
            &duplicate,
            r#"[
              {"tech":"go","name":"service","repo":"https://example.com/a"},
              {"tech":"go","name":"service","repo":"https://example.com/b"}
            ]"#,
        )
        .unwrap();
        assert!(load_private_catalog(&duplicate).is_err());
    }

    #[test]
    fn loads_relative_config_paths_from_the_manifest_directory() {
        let temp = tempfile::tempdir().unwrap();
        let config = temp.path().join("company.json");
        fs::write(&config, r#"{"version":1}"#).unwrap();
        let manifest = temp.path().join("presets.json");
        fs::write(
            &manifest,
            r#"[{"tech":"go","name":"company-go","config":"company.json"}]"#,
        )
        .unwrap();
        let catalog = load_private_catalog(&manifest).unwrap();
        assert_eq!(catalog.presets[0].config.as_deref(), config.to_str());
    }
}

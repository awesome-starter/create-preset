use serde::{Deserialize, Serialize};

/// Runtime config file content (~/.presetrc)
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RuntimeConfig {
    #[serde(default)]
    pub proxy: String,

    #[serde(default, rename = "localTech")]
    pub local_tech: String,

    #[serde(default, rename = "localPreset")]
    pub local_preset: String,
}

/// Tech stack configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TechConfig {
    pub name: String,
    #[serde(default)]
    pub color: String,
}

/// Variant item (template) in a tech stack
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VariantItem {
    pub name: String,
    pub desc: String,
    pub repo: String,
    pub mirror: String,
}

/// Tech stack with variants
#[derive(Debug, Clone)]
pub struct TechStack {
    pub name: String,
    pub variants: Vec<VariantItem>,
}

/// A command-based official project generator.
#[derive(Debug, Clone)]
pub struct GeneratorConfig {
    pub id: String,
    pub tech: String,
    pub name: String,
    pub desc: String,
    pub commands: std::collections::HashMap<PackageManager, Vec<String>>,
}

/// A selectable starter source. Git presets remain user-owned; generators are
/// delegated to the upstream CLI and keep their own interactive experience.
#[derive(Debug, Clone)]
pub enum StarterChoice {
    Private(ConfigItem),
    Official(GeneratorConfig),
}

/// Origin config item from remote/local JSON files
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OriginConfigItem {
    pub tech: String,
    pub name: String,
    #[serde(default)]
    pub desc: String,
    pub repo: String,
    #[serde(default)]
    pub mirror: String,
    #[serde(default)]
    pub r#type: String,
}

/// Template source type
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TemplateSource {
    Official,
    #[allow(dead_code)]
    Community,
    Local,
}

/// Config item with source information
#[derive(Debug, Clone)]
pub struct ConfigItem {
    pub tech: String,
    pub name: String,
    pub desc: String,
    pub repo: String,
    pub mirror: String,
    pub source: TemplateSource,
}

impl From<OriginConfigItem> for ConfigItem {
    fn from(origin: OriginConfigItem) -> Self {
        Self {
            tech: origin.tech,
            name: origin.name,
            desc: origin.desc,
            repo: origin.repo,
            mirror: origin.mirror,
            source: TemplateSource::Official,
        }
    }
}

/// Package upgrade information
#[derive(Debug)]
pub struct PackageUpgradeInfo {
    pub package_name: String,
    pub current_version: String,
    pub latest_version: String,
    pub need_to_upgrade: bool,
}

/// Package manager type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum PackageManager {
    Npm,
    Yarn,
    Pnpm,
    Bun,
}

impl PackageManager {
    pub fn as_str(&self) -> &'static str {
        match self {
            PackageManager::Npm => "npm",
            PackageManager::Yarn => "yarn",
            PackageManager::Pnpm => "pnpm",
            PackageManager::Bun => "bun",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_optional_template_fields_from_remote_config() {
        let item: OriginConfigItem = serde_json::from_str(
            r#"{"tech":"node","name":"node-basic","repo":"https://example.com/repo"}"#,
        )
        .unwrap();
        assert_eq!(item.desc, "");
        assert_eq!(item.mirror, "");
    }
}

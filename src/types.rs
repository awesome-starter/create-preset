use clap::ValueEnum;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RuntimeConfig {
    #[serde(default, rename = "localPreset")]
    pub local_preset: String,
}

#[derive(Debug, Clone, Deserialize, Default)]
pub struct TechMetadata {
    #[serde(default)]
    pub label: String,
    #[serde(default)]
    pub color: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct PrivatePreset {
    pub tech: String,
    pub name: String,
    #[serde(default)]
    pub desc: String,
    #[serde(default)]
    pub repo: Option<String>,
    #[serde(default)]
    pub config: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(untagged)]
pub enum PrivatePresetFile {
    Presets(Vec<PrivatePreset>),
    Manifest {
        version: u32,
        #[serde(default)]
        techs: HashMap<String, TechMetadata>,
        presets: Vec<PrivatePreset>,
    },
}

#[derive(Debug, Clone)]
pub struct GeneratorConfig {
    pub id: String,
    pub tech: String,
    pub name: String,
    pub desc: String,
    pub commands: HashMap<PackageManager, Vec<String>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PresetPlan {
    #[serde(default, rename = "$schema")]
    pub _schema: Option<String>,
    pub version: u32,
    pub source: PresetSource,
    #[serde(default)]
    pub exclude: Vec<String>,
    #[serde(default)]
    pub write: Vec<FileWrite>,
    #[serde(default)]
    pub replace: Vec<TextReplacement>,
    #[serde(default)]
    pub json: Vec<JsonMerge>,
    #[serde(default)]
    pub package_json: PresetPackageJson,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct FileWrite {
    pub path: String,
    pub lines: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PresetSource {
    pub repo: String,
    #[serde(default)]
    pub directory: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TextReplacement {
    pub path: String,
    pub from: String,
    pub to: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct JsonMerge {
    pub path: String,
    pub value: serde_json::Value,
}

#[derive(Debug, Clone, Deserialize, Default)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PresetPackageJson {
    #[serde(default)]
    pub resolve_workspace: bool,
}

#[derive(Debug, Clone)]
pub enum StarterChoice {
    Private(PrivatePreset),
    Official(GeneratorConfig),
}

#[derive(Debug, Clone)]
pub struct TechStack {
    pub id: String,
    pub label: String,
    pub color: String,
    pub choices: Vec<StarterChoice>,
}

pub struct BuiltInTech {
    pub id: &'static str,
    pub label: &'static str,
    pub color: &'static str,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, ValueEnum)]
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
    fn reads_legacy_array_and_manifest_formats() {
        let legacy: PrivatePresetFile = serde_json::from_str(
            r#"[{"tech":"python","name":"api","repo":"https://example.com/api"}]"#,
        )
        .unwrap();
        assert!(matches!(legacy, PrivatePresetFile::Presets(_)));

        let manifest: PrivatePresetFile = serde_json::from_str(
            r##"{"version":1,"techs":{"python":{"label":"Python","color":"#3776ab"}},"presets":[]}"##,
        )
        .unwrap();
        assert!(matches!(manifest, PrivatePresetFile::Manifest { .. }));
    }

    #[test]
    fn reads_a_preset_plan_and_rejects_unknown_fields() {
        let plan: PresetPlan = serde_json::from_str(
            r#"{
              "version": 1,
              "source": {"repo": "https://example.com/repo", "directory": "apps/docs"},
              "exclude": ["node_modules"],
              "packageJson": {"resolveWorkspace": true}
            }"#,
        )
        .unwrap();
        assert_eq!(plan.source.directory, "apps/docs");
        assert!(plan.package_json.resolve_workspace);
        assert!(serde_json::from_str::<PresetPlan>(
            r#"{"version":1,"source":{"repo":"https://example.com"},"typo":true}"#
        )
        .is_err());
    }
}

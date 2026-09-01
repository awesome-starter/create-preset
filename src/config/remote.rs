use crate::constants::{DEFAULT_BASE_URL, MIRROR_BASE_URL};
use crate::error::{PresetError, Result};
use crate::types::{ConfigItem, OriginConfigItem, TechConfig, TemplateSource};
use crate::utils::ellipsis;
use console::style;
use std::collections::HashMap;

/// Remote config manager for fetching tech stacks and templates
pub struct RemoteConfigManager {
    base_url: String,
    use_proxy: bool,
    client: reqwest::blocking::Client,
}

impl RemoteConfigManager {
    /// Create a new remote config manager
    pub fn new(use_proxy: bool) -> Self {
        let base_url = if use_proxy {
            MIRROR_BASE_URL.to_string()
        } else {
            DEFAULT_BASE_URL.to_string()
        };

        Self {
            base_url,
            use_proxy,
            client: reqwest::blocking::Client::new(),
        }
    }

    /// Fetch tech stack config from remote
    pub fn fetch_tech_config(&self) -> Result<Vec<TechConfig>> {
        let url = format!("{}/tech.json", self.base_url);

        let response = self
            .client
            .get(&url)
            .timeout(std::time::Duration::from_secs(15))
            .send()
            .map_err(|e| {
                PresetError::NetworkError(format!("Failed to fetch tech config: {}", e))
            })?;

        if !response.status().is_success() {
            return Err(PresetError::NetworkError(format!(
                "HTTP error: {}",
                response.status()
            )));
        }

        let tech_config: Vec<TechConfig> = response
            .json()
            .map_err(|e| PresetError::ConfigError(format!("Failed to parse tech config: {}", e)))?;

        Ok(tech_config)
    }

    /// Fetch config file (official or community)
    #[allow(dead_code)]
    pub fn fetch_config_file(
        &self,
        file_name: &str,
        source: TemplateSource,
    ) -> Result<Vec<ConfigItem>> {
        let url = format!("{}/{}.json", self.base_url, file_name);

        let response = self
            .client
            .get(&url)
            .timeout(std::time::Duration::from_secs(15))
            .send()
            .map_err(|e| {
                PresetError::NetworkError(format!("Failed to fetch {} config: {}", file_name, e))
            })?;

        if !response.status().is_success() {
            // If fetch fails, return empty list instead of error
            return Ok(Vec::new());
        }

        let origin_config: Vec<OriginConfigItem> = response.json().map_err(|e| {
            PresetError::ConfigError(format!("Failed to parse {} config: {}", file_name, e))
        })?;

        let config_items: Vec<ConfigItem> = origin_config
            .into_iter()
            .filter(|item| !item.tech.is_empty() && !item.name.is_empty() && !item.repo.is_empty())
            .map(|item| {
                let mut config_item = ConfigItem::from(item);
                config_item.source = source;
                config_item
            })
            .collect();

        Ok(config_items)
    }

    /// Read local config file
    pub fn read_local_config(
        &self,
        file_path: &std::path::Path,
        source: TemplateSource,
    ) -> Result<Vec<ConfigItem>> {
        if !file_path.exists() {
            return Ok(Vec::new());
        }

        let content = std::fs::read_to_string(file_path)
            .map_err(|e| PresetError::IoError(format!("Failed to read local config: {}", e)))?;

        let origin_config: Vec<OriginConfigItem> = serde_json::from_str(&content).map_err(|e| {
            PresetError::ConfigError(format!("Failed to parse local config: {}", e))
        })?;

        let config_items: Vec<ConfigItem> = origin_config
            .into_iter()
            .filter(|item| !item.tech.is_empty() && !item.name.is_empty() && !item.repo.is_empty())
            .map(|item| {
                let mut config_item = ConfigItem::from(item);
                config_item.source = source;
                config_item
            })
            .collect();

        Ok(config_items)
    }

    /// Merge and deduplicate config items
    /// Priority: local > official > community
    pub fn merge_configs(&self, configs: Vec<Vec<ConfigItem>>) -> Vec<ConfigItem> {
        let mut seen_names = HashMap::new();
        let mut seen_repos = HashMap::new();
        let mut result = Vec::new();

        for config_list in configs {
            for item in config_list {
                // Deduplicate by name first
                if seen_names.contains_key(&item.name) {
                    continue;
                }

                // Deduplicate by repo
                if seen_repos.contains_key(&item.repo) {
                    continue;
                }

                seen_names.insert(item.name.clone(), true);
                seen_repos.insert(item.repo.clone(), true);
                result.push(item);
            }
        }

        result
    }

    /// Build tech stacks with variants from config items
    pub fn build_tech_stacks(
        &self,
        tech_configs: Vec<TechConfig>,
        config_items: Vec<ConfigItem>,
    ) -> Vec<crate::types::TechStack> {
        let mut tech_stacks: Vec<crate::types::TechStack> = tech_configs
            .into_iter()
            .map(|tech| crate::types::TechStack {
                name: tech.name,
                color: tech.color,
                variants: Vec::new(),
            })
            .collect();

        // Group config items by tech
        for item in config_items {
            if let Some(tech_stack) = tech_stacks.iter_mut().find(|t| t.name == item.tech) {
                tech_stack.variants.push(crate::types::VariantItem {
                    name: item.name,
                    desc: ellipsis(&item.desc, 80),
                    repo: item.repo,
                    mirror: item.mirror,
                });
            }
        }

        tech_stacks
    }

    /// Load all configuration sources in the same priority order as the legacy CLI.
    pub fn load(
        &self,
        runtime: &crate::config::RuntimeConfigManager,
    ) -> Result<(Vec<TechConfig>, Vec<ConfigItem>)> {
        let local_tech = match runtime.get_local_tech_path()? {
            Some(path) => self.read_local_tech_config(&path)?,
            None => Vec::new(),
        };
        let mut tech_configs = match self.fetch_tech_config() {
            Ok(remote) => merge_tech_configs(remote, local_tech),
            Err(_) if !local_tech.is_empty() => local_tech,
            Err(_) => Vec::new(),
        };

        for generator in crate::generator::official_generators() {
            if !tech_configs.iter().any(|tech| tech.name == generator.tech) {
                tech_configs.push(TechConfig {
                    name: generator.tech,
                    color: String::new(),
                });
            }
        }

        let mut configs = Vec::new();
        if let Some(path) = runtime.get_local_preset_path()? {
            configs.push(self.read_local_config(&path, TemplateSource::Local)?);
        }

        Ok((tech_configs, self.merge_configs(configs)))
    }

    fn read_local_tech_config(&self, path: &std::path::Path) -> Result<Vec<TechConfig>> {
        if !path.exists() {
            return Ok(Vec::new());
        }
        let content = std::fs::read_to_string(path).map_err(|e| {
            PresetError::IoError(format!("Failed to read local tech config: {}", e))
        })?;
        let config: Vec<TechConfig> = serde_json::from_str(&content).map_err(|e| {
            PresetError::ConfigError(format!("Failed to parse local tech config: {}", e))
        })?;
        Ok(config)
    }

    /// Display welcome message
    pub fn display_welcome(&self) {
        println!();
        println!("{}", style("create-preset").cyan().bold());
        println!(
            "{}",
            style("Provides the ability to quickly create preset projects.").dim()
        );
    }

    /// Display proxy tip
    pub fn display_proxy_tip(&self) {
        if !self.use_proxy {
            println!();
            println!("{}", style("💡 Tip:").yellow());
            println!(
                "  If you are in China and experiencing slow downloads, try: {}",
                style("preset proxy on").cyan()
            );
        }
    }
}

fn merge_tech_configs(remote: Vec<TechConfig>, local: Vec<TechConfig>) -> Vec<TechConfig> {
    let mut result = remote;
    for item in local {
        if !result.iter().any(|existing| existing.name == item.name) {
            result.push(item);
        }
    }
    result
}

impl Default for RemoteConfigManager {
    fn default() -> Self {
        Self::new(false)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_base_url_without_proxy() {
        let manager = RemoteConfigManager::new(false);
        assert_eq!(manager.base_url, DEFAULT_BASE_URL);
    }

    #[test]
    fn test_base_url_with_proxy() {
        let manager = RemoteConfigManager::new(true);
        assert_eq!(manager.base_url, MIRROR_BASE_URL);
    }

    #[test]
    fn test_merge_configs_deduplication() {
        let manager = RemoteConfigManager::new(false);

        let config1 = vec![ConfigItem {
            tech: "vue".to_string(),
            name: "vue-starter".to_string(),
            desc: "Vue starter".to_string(),
            repo: "https://github.com/user/vue-starter".to_string(),
            mirror: "".to_string(),
            source: TemplateSource::Official,
        }];

        let config2 = vec![
            ConfigItem {
                tech: "vue".to_string(),
                name: "vue-starter".to_string(), // duplicate name
                desc: "Another Vue starter".to_string(),
                repo: "https://github.com/user/vue-starter-2".to_string(),
                mirror: "".to_string(),
                source: TemplateSource::Community,
            },
            ConfigItem {
                tech: "react".to_string(),
                name: "react-starter".to_string(),
                desc: "React starter".to_string(),
                repo: "https://github.com/user/react-starter".to_string(),
                mirror: "".to_string(),
                source: TemplateSource::Community,
            },
        ];

        let merged = manager.merge_configs(vec![config1, config2]);

        // Should only have 2 items (vue-starter from config1, react-starter from config2)
        assert_eq!(merged.len(), 2);
        assert_eq!(merged[0].name, "vue-starter");
        assert_eq!(merged[0].source, TemplateSource::Official);
        assert_eq!(merged[1].name, "react-starter");
    }
}

use crate::constants::RC_FILE_NAME;
use crate::error::{PresetError, Result};
use crate::types::RuntimeConfig;
use std::path::PathBuf;

/// Runtime config manager for ~/.presetrc
pub struct RuntimeConfigManager {
    config_path: PathBuf,
}

impl RuntimeConfigManager {
    /// Create a new runtime config manager
    pub fn new() -> Result<Self> {
        let home_dir = dirs::home_dir()
            .ok_or_else(|| PresetError::ConfigError("Cannot find home directory".to_string()))?;

        let config_path = home_dir.join(RC_FILE_NAME);

        Ok(Self { config_path })
    }

    /// Read runtime config from ~/.presetrc
    pub fn read(&self) -> Result<RuntimeConfig> {
        if !self.config_path.exists() {
            return Ok(RuntimeConfig::default());
        }

        let content = std::fs::read_to_string(&self.config_path)
            .map_err(|e| PresetError::IoError(format!("Failed to read config file: {}", e)))?;

        let config: RuntimeConfig = serde_json::from_str(&content)
            .map_err(|e| PresetError::ConfigError(format!("Failed to parse config file: {}", e)))?;

        Ok(config)
    }

    /// Write runtime config to ~/.presetrc
    pub fn write(&self, config: &RuntimeConfig) -> Result<()> {
        let content = serde_json::to_string_pretty(config)
            .map_err(|e| PresetError::ConfigError(format!("Failed to serialize config: {}", e)))?;

        std::fs::write(&self.config_path, content)
            .map_err(|e| PresetError::IoError(format!("Failed to write config file: {}", e)))?;

        Ok(())
    }

    /// Update a specific field in the runtime config
    pub fn update<F>(&self, updater: F) -> Result<()>
    where
        F: FnOnce(&mut RuntimeConfig),
    {
        let mut config = self.read()?;
        updater(&mut config);
        self.write(&config)?;
        Ok(())
    }

    /// Get local preset config path
    pub fn get_local_preset_path(&self) -> Result<Option<PathBuf>> {
        self.read().map(|config| {
            if config.local_preset.is_empty() {
                None
            } else {
                Some(resolve_config_path(config.local_preset))
            }
        })
    }

    /// Set local preset config path
    pub fn set_local_preset_path(&self, path: String) -> Result<()> {
        let path = resolve_config_path(path).to_string_lossy().into_owned();
        self.update(|config| {
            config.local_preset = path;
        })
    }

    /// Remove local preset config path
    pub fn remove_local_preset_path(&self) -> Result<()> {
        self.update(|config| {
            config.local_preset = String::new();
        })
    }
}

pub(crate) fn resolve_config_path(path: String) -> PathBuf {
    let path = PathBuf::from(path);
    if path.is_absolute() {
        path
    } else {
        std::env::current_dir()
            .map(|cwd| cwd.join(&path))
            .unwrap_or(path)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_runtime_config_serialization() {
        let config = RuntimeConfig {
            local_preset: "/path/to/preset.json".to_string(),
        };

        let json = serde_json::to_string(&config).unwrap();
        let deserialized: RuntimeConfig = serde_json::from_str(&json).unwrap();

        assert_eq!(config.local_preset, deserialized.local_preset);
    }

    #[test]
    fn test_default_runtime_config() {
        let config = RuntimeConfig::default();
        assert_eq!(config.local_preset, "");
    }

    #[test]
    fn ignores_legacy_proxy_field() {
        let config: RuntimeConfig =
            serde_json::from_str(r#"{"proxy":"on","localPreset":"/path/to/preset.json"}"#).unwrap();
        assert_eq!(config.local_preset, "/path/to/preset.json");
    }
}

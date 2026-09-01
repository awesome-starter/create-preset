use crate::cli::ConfigAction;
use crate::config::RuntimeConfigManager;
use crate::error::{PresetError, Result};
use console::style;

pub fn config_command(action: ConfigAction, tech: bool) -> Result<()> {
    let config_manager = RuntimeConfigManager::new()?;

    let target_type = if tech { "tech stack" } else { "configuration" };
    let command_hint = if tech {
        "preset config --tech set <filePath>"
    } else {
        "preset config set <filePath>"
    };

    match action {
        ConfigAction::Get => {
            let path = if tech {
                config_manager.get_local_tech_path()?
            } else {
                config_manager.get_local_preset_path()?
            };

            println!();
            if let Some(path) = path {
                println!("  The local {} is stored in:", target_type);
                println!("  Here → {}", style(path.display()).cyan());
                println!();
            } else {
                println!("  There is currently no local {}.", target_type);
                println!();
            }

            println!(
                "  Run {} to bind your local {}.",
                style(command_hint).cyan(),
                target_type
            );
            println!();
        }

        ConfigAction::Set { file_path } => {
            // Validate file path
            if !file_path.ends_with(".json") {
                return Err(PresetError::ValidationError(
                    "The file path must be a \".json\" file.".to_string(),
                ));
            }

            // Save config
            if tech {
                config_manager.set_local_tech_path(file_path)?;
            } else {
                config_manager.set_local_preset_path(file_path)?;
            }

            println!();
            println!(
                "  {}",
                style(format!("Saved {} successfully.", target_type)).green()
            );
            println!();
        }

        ConfigAction::Remove => {
            let path = if tech {
                config_manager.get_local_tech_path()?
            } else {
                config_manager.get_local_preset_path()?
            };

            if path.is_none() {
                // If no config exists, show the get message
                return config_command(ConfigAction::Get, tech);
            }

            // Remove config
            if tech {
                config_manager.remove_local_tech_path()?;
            } else {
                config_manager.remove_local_preset_path()?;
            }

            println!();
            println!(
                "  {}",
                style(format!("Removed {} successfully.", target_type)).green()
            );
            println!();
            println!(
                "  Run {} to bind your local {}.",
                style(command_hint).cyan(),
                target_type
            );
            println!();
        }
    }

    Ok(())
}

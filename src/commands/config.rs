use crate::catalog::load_private_catalog;
use crate::cli::ConfigAction;
use crate::config::runtime::resolve_config_path;
use crate::config::RuntimeConfigManager;
use crate::error::{PresetError, Result};
use crate::i18n::{format_message, messages};
use console::style;

pub fn config_command(action: ConfigAction) -> Result<()> {
    let manager = RuntimeConfigManager::new()?;
    match action {
        ConfigAction::Get => display_config(&manager),
        ConfigAction::Set { file_path } => {
            if !file_path.ends_with(".json") {
                return Err(PresetError::ValidationError(
                    "The file path must be a .json file".to_string(),
                ));
            }
            let path = resolve_config_path(file_path.clone());
            load_private_catalog(&path)?;
            manager.set_local_preset_path(file_path)?;
            println!(
                "\n  {}\n",
                style(messages().saved_private_config.as_str()).green()
            );
            Ok(())
        }
        ConfigAction::Remove => {
            if manager.get_local_preset_path()?.is_none() {
                return display_config(&manager);
            }
            manager.remove_local_preset_path()?;
            println!(
                "\n  {}\n",
                style(messages().removed_private_config.as_str()).green()
            );
            Ok(())
        }
    }
}

fn display_config(manager: &RuntimeConfigManager) -> Result<()> {
    println!();
    if let Some(path) = manager.get_local_preset_path()? {
        println!("  {}", messages().private_config.as_str());
        println!("  {}\n", style(path.display()).cyan());
    } else {
        println!("  {}\n", messages().no_private_config.as_str());
        println!(
            "  {}\n",
            format_message(
                messages().bind_private_config.as_str(),
                &[(
                    "command",
                    &style("preset config set <filePath>").cyan().to_string(),
                )],
            )
        );
    }
    Ok(())
}

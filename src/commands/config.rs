use crate::catalog::load_private_catalog;
use crate::cli::ConfigAction;
use crate::config::runtime::resolve_config_path;
use crate::config::RuntimeConfigManager;
use crate::error::{PresetError, Result};
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
                style("Saved private preset configuration successfully.").green()
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
                style("Removed private preset configuration successfully.").green()
            );
            Ok(())
        }
    }
}

fn display_config(manager: &RuntimeConfigManager) -> Result<()> {
    println!();
    if let Some(path) = manager.get_local_preset_path()? {
        println!("  Private preset configuration:");
        println!("  {}\n", style(path.display()).cyan());
    } else {
        println!("  There is currently no private preset configuration.\n");
        println!(
            "  Run {} to bind one.\n",
            style("preset config set <filePath>").cyan()
        );
    }
    Ok(())
}

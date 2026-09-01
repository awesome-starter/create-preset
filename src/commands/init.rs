use crate::catalog::{build_catalog, load_private_catalog};
use crate::config::RuntimeConfigManager;
use crate::constants::{DEFAULT_PROJECT_NAME, PRIVATE_PRESET_METADATA};
use crate::download::download_repo;
use crate::error::{PresetError, Result};
use crate::generator::run_generator;
use crate::types::{PackageManager, PrivatePreset, StarterChoice, TechStack};
use crate::ui::{dialoguer_error, spinner};
use crate::utils::{
    detect_package_manager, empty_dir, is_dir_empty, is_valid_package_name, to_valid_package_name,
};
use console::style;
use dialoguer::{Confirm, Input, Select};
use serde_json::Value;
use std::path::Path;

pub fn init_command(
    app_name: Option<String>,
    preset: Option<String>,
    legacy_template: Option<String>,
    package_manager: Option<PackageManager>,
) -> Result<()> {
    display_welcome();
    let requested = resolve_requested_preset(preset, legacy_template)?;
    let runtime = RuntimeConfigManager::new()?;
    let private = runtime
        .get_local_preset_path()?
        .map(|path| load_private_catalog(&path))
        .transpose()?;
    let catalog = build_catalog(private);
    let target_dir = prompt_target_dir(app_name)?;
    let choice = choose_starter(requested.as_deref(), &catalog)?;
    let cwd = std::env::current_dir()?;
    let root = cwd.join(&target_dir);
    let target_existed = prepare_target(&root, matches!(choice, StarterChoice::Official(_)))?;

    let result = match choice {
        StarterChoice::Official(generator) => run_generator(
            &generator,
            &target_dir,
            &cwd,
            package_manager.unwrap_or_else(detect_package_manager),
        ),
        StarterChoice::Private(preset) => create_private_preset(&preset, &root, &target_dir),
    };
    if let Err(error) = result {
        cleanup_failed_target(&root, target_existed);
        return Err(error);
    }
    Ok(())
}

fn resolve_requested_preset(
    preset: Option<String>,
    legacy_template: Option<String>,
) -> Result<Option<String>> {
    match (preset, legacy_template) {
        (Some(_), Some(_)) => Err(PresetError::ValidationError(
            "Use either --preset or the legacy --template option, not both".to_string(),
        )),
        (Some(preset), None) => Ok(Some(preset)),
        (None, Some(template)) => {
            println!(
                "\n{}",
                style("--template is deprecated; use --preset instead.").yellow()
            );
            Ok(Some(template))
        }
        (None, None) => Ok(None),
    }
}

fn display_welcome() {
    println!();
    println!("{}", style("create-preset").cyan().bold());
    println!(
        "{}",
        style("Create projects with official generators and private presets.").dim()
    );
}

fn prompt_target_dir(app_name: Option<String>) -> Result<String> {
    if let Some(name) = app_name {
        let trimmed = name.trim();
        if trimmed.is_empty() {
            return Err(PresetError::ValidationError(
                "Project name cannot be empty".to_string(),
            ));
        }
        return Ok(trimmed.to_string());
    }
    Input::<String>::new()
        .with_prompt("Project name")
        .default(DEFAULT_PROJECT_NAME.to_string())
        .interact_text()
        .map(|value| {
            let value = value.trim();
            if value.is_empty() {
                DEFAULT_PROJECT_NAME.to_string()
            } else {
                value.to_string()
            }
        })
        .map_err(dialoguer_error)
}

fn choose_starter(requested: Option<&str>, catalog: &[TechStack]) -> Result<StarterChoice> {
    if let Some(name) = requested {
        if let Some(choice) = catalog
            .iter()
            .flat_map(|stack| stack.choices.iter())
            .find(|choice| choice_id(choice) == name || choice_name(choice) == name)
        {
            return Ok(choice.clone());
        }
        println!(
            "\n{}",
            style(format!(
                "\"{}\" is not a known preset. Please choose from below:",
                name
            ))
            .yellow()
        );
    }
    if catalog.is_empty() {
        return Err(PresetError::ConfigError(
            "No presets are currently available".to_string(),
        ));
    }
    let tech_names: Vec<String> = catalog
        .iter()
        .map(|stack| colorize(&stack.label, &stack.color))
        .collect();
    let tech_index = Select::new()
        .with_prompt("Select a tech stack")
        .items(&tech_names)
        .default(0)
        .interact()
        .map_err(dialoguer_error)?;
    let stack = &catalog[tech_index];
    let labels: Vec<String> = stack.choices.iter().map(choice_label).collect();
    let choice_index = Select::new()
        .with_prompt("Select a preset")
        .items(&labels)
        .default(0)
        .interact()
        .map_err(dialoguer_error)?;
    Ok(stack.choices[choice_index].clone())
}

fn choice_id(choice: &StarterChoice) -> &str {
    match choice {
        StarterChoice::Private(preset) => &preset.name,
        StarterChoice::Official(generator) => &generator.id,
    }
}

fn choice_name(choice: &StarterChoice) -> &str {
    match choice {
        StarterChoice::Private(preset) => &preset.name,
        StarterChoice::Official(generator) => &generator.name,
    }
}

fn choice_label(choice: &StarterChoice) -> String {
    match choice {
        StarterChoice::Private(preset) => {
            with_description(format!("★ {}", preset.name), &preset.desc)
        }
        StarterChoice::Official(generator) => {
            with_description(format!("{} ↗", generator.name), &generator.desc)
        }
    }
}

fn with_description(name: String, description: &str) -> String {
    if description.is_empty() {
        name
    } else {
        format!("{} - {}", name, description)
    }
}

fn prepare_target(root: &Path, delegated: bool) -> Result<bool> {
    let existed = root.exists();
    if existed && !is_dir_empty(root)? {
        let target = if root == std::env::current_dir()? {
            "Current directory".to_string()
        } else {
            format!(
                "Target directory \"{}\"",
                root.file_name()
                    .and_then(|name| name.to_str())
                    .unwrap_or_default()
            )
        };
        let overwrite = Confirm::new()
            .with_prompt(format!(
                "{} is not empty. Remove existing files and continue?",
                target
            ))
            .default(false)
            .interact()
            .map_err(dialoguer_error)?;
        if !overwrite {
            return Err(PresetError::UserCancelled);
        }
    }

    if delegated && root != std::env::current_dir()? {
        if root.exists() {
            std::fs::remove_dir_all(root)?;
        }
    } else {
        if root.exists() {
            empty_dir(root)?;
        } else {
            std::fs::create_dir_all(root)?;
        }
    }
    Ok(existed)
}

fn create_private_preset(preset: &PrivatePreset, root: &Path, target_dir: &str) -> Result<()> {
    println!("\nCreating project in {}...", root.display());
    let download_spinner = spinner("Downloading private preset...");
    let result = download_repo(&preset.repo, root)
        .and_then(|_| clean_private_preset(root))
        .and_then(|_| reset_package_name(root, target_dir));
    if result.is_ok() {
        download_spinner.finish_with_message(style("Created successfully.").green().to_string());
    } else {
        download_spinner.abandon_with_message(style("Creation failed.").red().to_string());
    }
    result
}

fn clean_private_preset(root: &Path) -> Result<()> {
    for name in PRIVATE_PRESET_METADATA {
        let path = root.join(name);
        if path.is_dir() {
            std::fs::remove_dir_all(path)?;
        } else if path.exists() {
            std::fs::remove_file(path)?;
        }
    }
    Ok(())
}

fn reset_package_name(root: &Path, target_dir: &str) -> Result<()> {
    let path = root.join("package.json");
    if !path.exists() {
        return Ok(());
    }
    let inferred = if target_dir == "." {
        root.file_name()
            .and_then(|name| name.to_str())
            .unwrap_or(DEFAULT_PROJECT_NAME)
            .to_string()
    } else {
        Path::new(target_dir)
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or(target_dir)
            .to_string()
    };
    let package_name = if is_valid_package_name(&inferred) {
        inferred
    } else {
        Input::<String>::new()
            .with_prompt("Package name")
            .default(to_valid_package_name(&inferred))
            .validate_with(|value: &String| -> std::result::Result<(), &str> {
                if is_valid_package_name(value) {
                    Ok(())
                } else {
                    Err("Invalid package.json name")
                }
            })
            .interact_text()
            .map_err(dialoguer_error)?
    };
    let content = std::fs::read_to_string(&path)?;
    let mut package: Value = serde_json::from_str(&content)?;
    let object = package.as_object_mut().ok_or_else(|| {
        PresetError::ConfigError("Private preset package.json must be an object".to_string())
    })?;
    object.insert("name".to_string(), Value::String(package_name));
    std::fs::write(path, serde_json::to_string_pretty(&package)? + "\n")?;
    Ok(())
}

fn cleanup_failed_target(root: &Path, target_existed: bool) {
    if !root.exists() {
        return;
    }
    if target_existed {
        let _ = empty_dir(root);
    } else {
        let _ = std::fs::remove_dir_all(root);
    }
}

fn colorize(value: &str, hex: &str) -> String {
    let hex = hex.trim_start_matches('#');
    if hex.len() == 6 {
        if let Ok(rgb) = u32::from_str_radix(hex, 16) {
            let r = ((rgb >> 16) & 0xff) as u8;
            let g = ((rgb >> 8) & 0xff) as u8;
            let b = (rgb & 0xff) as u8;
            return style(value).color256(rgb_to_ansi256(r, g, b)).to_string();
        }
    }
    value.to_string()
}

fn rgb_to_ansi256(r: u8, g: u8, b: u8) -> u8 {
    let channel = |value: u8| ((value as u16 * 5 + 127) / 255) as u8;
    16 + 36 * channel(r) + 6 * channel(g) + channel(b)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn updates_only_package_name() {
        let temp = tempfile::tempdir().unwrap();
        std::fs::write(
            temp.path().join("package.json"),
            r#"{"name":"old","version":"1.2.3","description":"keep","author":"keep"}"#,
        )
        .unwrap();
        reset_package_name(temp.path(), "new-name").unwrap();
        let package: Value = serde_json::from_str(
            &std::fs::read_to_string(temp.path().join("package.json")).unwrap(),
        )
        .unwrap();
        assert_eq!(package["name"], "new-name");
        assert_eq!(package["version"], "1.2.3");
        assert_eq!(package["description"], "keep");
    }

    #[test]
    fn cleans_only_clone_metadata() {
        let temp = tempfile::tempdir().unwrap();
        std::fs::create_dir(temp.path().join(".git")).unwrap();
        std::fs::write(temp.path().join("pnpm-lock.yaml"), "lock").unwrap();
        std::fs::create_dir(temp.path().join(".github")).unwrap();
        clean_private_preset(temp.path()).unwrap();
        assert!(!temp.path().join(".git").exists());
        assert!(temp.path().join("pnpm-lock.yaml").exists());
        assert!(temp.path().join(".github").exists());
    }
}

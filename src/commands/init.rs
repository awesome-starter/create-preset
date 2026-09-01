use crate::config::{RemoteConfigManager, RuntimeConfigManager};
use crate::constants::{DEFAULT_PROJECT_NAME, OUT_OF_TEMPLATE_FILES};
use crate::download::{download_repo, get_download_url};
use crate::error::{PresetError, Result};
use crate::generator::{official_generators, run_generator};
use crate::types::{ConfigItem, GeneratorConfig, StarterChoice, TechStack};
use crate::utils::{
    detect_package_manager, ellipsis, empty_dir, is_dir_empty, is_valid_package_name,
    to_valid_package_name,
};
use console::style;
use dialoguer::{Confirm, Input, Select};
use indicatif::{ProgressBar, ProgressStyle};
use serde_json::Value;
use std::path::Path;

pub fn init_command(app_name: Option<String>, template: Option<String>) -> Result<()> {
    let runtime = RuntimeConfigManager::new()?;
    let use_proxy = runtime.is_proxy_on()?;
    let remote = RemoteConfigManager::new(use_proxy);

    remote.display_welcome();
    remote.display_proxy_tip();

    let config_spinner = spinner("Fetching the latest config...");
    let (tech_configs, all_templates) = remote.load(&runtime)?;
    config_spinner.finish_with_message(
        style("Get the latest config successfully.")
            .green()
            .to_string(),
    );

    let tech_stacks = remote.build_tech_stacks(tech_configs, all_templates.clone());
    let target_dir = prompt_target_dir(app_name)?;
    let root = std::env::current_dir()?.join(&target_dir);
    let package_name = prompt_package_name(&target_dir)?;
    let choice = choose_starter(template.as_deref(), &tech_stacks, &all_templates)?;
    let target_was_created = prepare_target_dir(&root)?;

    println!("\nScaffolding project in {}...", root.display());
    let result = match choice {
        StarterChoice::Official(generator) => run_generator(
            &generator,
            &target_dir,
            &std::env::current_dir()?,
            detect_package_manager(),
        ),
        StarterChoice::Private(template) => {
            let download_url = get_download_url(&template.name, &all_templates, use_proxy)?;
            let download_spinner = spinner("Downloading...");
            let result = download_repo(&download_url, &root)
                .and_then(|_| clean_template(&root))
                .and_then(|_| reset_package_json(&root, &package_name));
            if result.is_ok() {
                download_spinner
                    .finish_with_message(style("Download successfully.").green().to_string());
            } else {
                download_spinner.abandon_with_message(style("Download failed.").red().to_string());
            }
            result
        }
    };
    if let Err(error) = result {
        cleanup_failed_target(&root, target_was_created);
        return Err(error);
    }
    print_next_steps(&root)?;
    Ok(())
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

fn prepare_target_dir(root: &Path) -> Result<bool> {
    let existed = root.exists();
    if root.exists() && !is_dir_empty(root)? {
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
        empty_dir(root)?;
    } else if !root.exists() {
        std::fs::create_dir_all(root)?;
    }
    Ok(!existed)
}

fn prompt_package_name(target_dir: &str) -> Result<String> {
    let inferred = if target_dir == "." {
        std::env::current_dir()?
            .file_name()
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
    if is_valid_package_name(&inferred) {
        return Ok(inferred);
    }

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
        .map_err(dialoguer_error)
}

fn choose_starter(
    requested: Option<&str>,
    tech_stacks: &[TechStack],
    all_templates: &[ConfigItem],
) -> Result<StarterChoice> {
    let generators = official_generators();
    if let Some(name) = requested {
        if let Some(item) = all_templates
            .iter()
            .find(|item| item.name == name || ellipsis(&item.name, 20) == name)
        {
            return Ok(StarterChoice::Private(item.clone()));
        }
        if let Some(generator) = generators
            .iter()
            .find(|item| item.id == name || item.name == name)
        {
            return Ok(StarterChoice::Official(generator.clone()));
        }
        println!(
            "\n{}",
            style(format!(
                "\"{}\" is a legacy or unknown template. Starter repositories are no longer maintained; please choose an official generator or a private preset:",
                name
            ))
            .yellow()
        );
    }

    let available: Vec<&TechStack> = tech_stacks
        .iter()
        .filter(|stack| {
            !stack.variants.is_empty() || generators.iter().any(|item| item.tech == stack.name)
        })
        .collect();
    if available.is_empty() {
        return Err(PresetError::ConfigError(
            "No templates are currently available".to_string(),
        ));
    }
    let names: Vec<String> = available
        .iter()
        .map(|stack| colorize(&stack.name, &stack.color))
        .collect();
    let tech_index = Select::new()
        .with_prompt("Select a tech stack")
        .items(&names)
        .default(0)
        .interact()
        .map_err(dialoguer_error)?;
    let stack = available[tech_index];
    let private: Vec<&ConfigItem> = all_templates
        .iter()
        .filter(|item| item.tech == stack.name)
        .collect();
    let official: Vec<&GeneratorConfig> = generators
        .iter()
        .filter(|item| item.tech == stack.name)
        .collect();
    let mut choices = Vec::new();
    choices.extend(private.iter().map(|item| {
        format!(
            "★ {}{}",
            item.name,
            if item.desc.is_empty() {
                String::new()
            } else {
                format!(" - {}", item.desc)
            }
        )
    }));
    choices.extend(official.iter().map(|item| {
        if item.desc.is_empty() {
            format!("{} ↗", item.name)
        } else {
            format!("{} ↗ - {}", item.name, item.desc)
        }
    }));
    let choice_index = Select::new()
        .with_prompt("Select a starter")
        .items(&choices)
        .default(0)
        .interact()
        .map_err(dialoguer_error)?;
    if choice_index < private.len() {
        Ok(StarterChoice::Private(private[choice_index].clone()))
    } else {
        Ok(StarterChoice::Official(
            official[choice_index - private.len()].clone(),
        ))
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

fn clean_template(root: &Path) -> Result<()> {
    for name in OUT_OF_TEMPLATE_FILES {
        let path = root.join(name);
        if path.is_dir() {
            std::fs::remove_dir_all(path)?;
        } else if path.exists() {
            std::fs::remove_file(path)?;
        }
    }
    Ok(())
}

fn reset_package_json(root: &Path, package_name: &str) -> Result<()> {
    let path = root.join("package.json");
    if !path.exists() {
        return Ok(());
    }
    let content = std::fs::read_to_string(&path)?;
    let mut package: Value = serde_json::from_str(&content)?;
    let object = package.as_object_mut().ok_or_else(|| {
        PresetError::ConfigError("Template package.json must contain a JSON object".to_string())
    })?;
    object.insert("name".to_string(), Value::String(package_name.to_string()));
    object.insert("version".to_string(), Value::String("0.0.0".to_string()));
    object.insert("description".to_string(), Value::String(String::new()));
    object.insert("author".to_string(), Value::String(String::new()));
    let content = serde_json::to_string_pretty(&package)? + "\n";
    std::fs::write(path, content)?;
    Ok(())
}

fn print_next_steps(root: &Path) -> Result<()> {
    let cwd = std::env::current_dir()?;
    let package_manager = detect_package_manager();
    println!("\nDone. Now run:\n");
    if root != cwd {
        let display = root.strip_prefix(&cwd).unwrap_or(root);
        println!("  cd {}", display.display());
    }
    if package_manager.as_str() == "yarn" {
        println!("  yarn\n  yarn dev");
    } else {
        println!(
            "  {} install\n  {} run dev",
            package_manager.as_str(),
            package_manager.as_str()
        );
    }
    println!();
    Ok(())
}

fn cleanup_failed_target(root: &Path, target_was_created: bool) {
    if !root.exists() {
        return;
    }
    if target_was_created {
        let _ = std::fs::remove_dir_all(root);
    } else {
        let _ = empty_dir(root);
    }
}

fn spinner(message: &str) -> ProgressBar {
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(ProgressStyle::with_template("{spinner} {msg}").unwrap());
    spinner.set_message(message.to_string());
    spinner.enable_steady_tick(std::time::Duration::from_millis(80));
    spinner
}

fn dialoguer_error(error: dialoguer::Error) -> PresetError {
    if matches!(error, dialoguer::Error::IO(ref io) if io.kind() == std::io::ErrorKind::Interrupted)
    {
        PresetError::UserCancelled
    } else {
        PresetError::IoError(error.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resets_package_metadata() {
        let temp = tempfile::tempdir().unwrap();
        std::fs::write(
            temp.path().join("package.json"),
            r#"{"name":"old","version":"1.2.3","description":"x","author":"y","private":true}"#,
        )
        .unwrap();
        reset_package_json(temp.path(), "new-name").unwrap();
        let package: Value = serde_json::from_str(
            &std::fs::read_to_string(temp.path().join("package.json")).unwrap(),
        )
        .unwrap();
        assert_eq!(package["name"], "new-name");
        assert_eq!(package["version"], "0.0.0");
        assert_eq!(package["private"], true);
    }

    #[test]
    fn cleans_only_template_metadata() {
        let temp = tempfile::tempdir().unwrap();
        std::fs::create_dir(temp.path().join(".git")).unwrap();
        std::fs::write(temp.path().join("pnpm-lock.yaml"), "lock").unwrap();
        std::fs::write(temp.path().join("src.txt"), "keep").unwrap();
        clean_template(temp.path()).unwrap();
        assert!(!temp.path().join(".git").exists());
        assert!(!temp.path().join("pnpm-lock.yaml").exists());
        assert!(temp.path().join("src.txt").exists());
    }
}

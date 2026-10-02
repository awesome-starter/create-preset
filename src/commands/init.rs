use crate::catalog::{build_catalog, load_private_catalog, PrivateCatalog};
use crate::config::RuntimeConfigManager;
use crate::constants::{DEFAULT_PROJECT_NAME, PRIVATE_PRESET_METADATA};
use crate::download::download_repo;
use crate::error::{PresetError, Result};
use crate::generator::{generator_arguments, run_generator};
use crate::i18n::{format_message, generator_name, messages};
use crate::preset::{load_preset_plan, materialize_preset_plan};
use crate::target::{staging_directory, validate_target, TargetTransaction};
use crate::types::{GeneratorConfig, PackageManager, PresetPlan, StarterChoice, TechStack};
use crate::ui::{dialoguer_error, spinner};
use crate::utils::{
    detect_package_manager, is_dir_empty, is_valid_package_name, to_valid_package_name,
};
use console::style;
use dialoguer::{Confirm, Input, Select};
use serde_json::{json, Value};
use std::path::{Path, PathBuf};

enum CreationSource {
    Official(GeneratorConfig),
    Repository(String),
    Config(PresetPlan),
}

pub fn list_command() -> Result<()> {
    for stack in registered_catalog()? {
        println!("{}", stack.label);
        for choice in stack.choices {
            println!("  {:<20} {}", choice_id(&choice), choice_label(&choice));
        }
    }
    Ok(())
}

fn registered_catalog() -> Result<Vec<TechStack>> {
    let runtime = RuntimeConfigManager::new()?;
    Ok(build_catalog(load_bound_private_catalog(
        runtime.get_local_preset_path(),
    )))
}

pub fn init_command(
    app_name: Option<String>,
    source: Option<String>,
    legacy_template: Option<String>,
    package_manager: Option<PackageManager>,
    dry_run: bool,
    yes: bool,
) -> Result<()> {
    if !dry_run {
        display_welcome();
    }
    let requested = resolve_requested_source(source, legacy_template)?;
    // Keep the familiar project-name-first order in the interactive flow.
    let target_dir = if requested.is_none() {
        Some(prompt_target_dir(app_name.clone())?)
    } else {
        None
    };
    // Resolve and validate local configs before asking to replace their directory.
    let creation = if let Some(config) = requested
        .as_deref()
        .filter(|value| is_preset_config_reference(value))
    {
        CreationSource::Config(load_config(config)?)
    } else {
        match choose_starter(requested.as_deref(), &registered_catalog()?)? {
            StarterChoice::Official(generator) => CreationSource::Official(generator),
            StarterChoice::Private(preset) => match (preset.repo, preset.config) {
                (_, Some(config)) => CreationSource::Config(load_config(&config)?),
                (Some(repo), None) => CreationSource::Repository(repo),
                (None, None) => {
                    return Err(PresetError::ConfigError(
                        "Private preset has no source".to_string(),
                    ))
                }
            },
        }
    };
    let target_dir = match target_dir {
        Some(target) => target,
        None => prompt_target_dir(app_name)?,
    };
    let cwd = std::fs::canonicalize(std::env::current_dir()?)?;
    let root = resolve_target(&cwd, &target_dir)?;
    let package_manager = package_manager.unwrap_or_else(detect_package_manager);
    let project = if root == cwd { "." } else { &target_dir };
    if dry_run {
        return preview_creation(&creation, &root, project, package_manager);
    }
    if !yes {
        confirm_target(&root)?;
    }

    match creation {
        CreationSource::Official(generator) => {
            let transaction = TargetTransaction::begin(&root, true)?;
            let result = run_generator(&generator, project, &cwd, package_manager).and_then(|_| {
                validate_target(&root)?;
                // Some generators treat cancellation as exit 0. Do not discard
                // the backup unless a project was actually created at the target.
                if !root.is_dir() || is_dir_empty(&root)? {
                    return Err(PresetError::GeneratorError(
                        "The generator exited without creating a project at the target".to_string(),
                    ));
                }
                Ok(())
            });
            if let Err(error) = result {
                return Err(transaction.fail(error));
            }
            transaction.commit();
        }
        source => {
            // Complete downloads and transformations before touching old files.
            let staged = staging_directory(&root)?;
            let output = staged.path().join("project");
            match source {
                CreationSource::Repository(repo) => {
                    create_repository_preset(&repo, &output, &target_dir, &root)?
                }
                CreationSource::Config(plan) => {
                    create_config_preset(&plan, &output, &target_dir, &root)?
                }
                CreationSource::Official(_) => unreachable!(),
            }
            let transaction = TargetTransaction::begin(&root, false)?;
            if let Err(error) = transaction.publish(&output) {
                return Err(transaction.fail(error));
            }
            transaction.commit();
            println!(
                "{}",
                style(messages().created_successfully.as_str()).green()
            );
        }
    }
    Ok(())
}

fn load_config(reference: &str) -> Result<PresetPlan> {
    if reference.starts_with("http://") {
        eprintln!(
            "{}",
            style(messages().http_config_warning.as_str()).yellow()
        );
    }
    let progress = spinner(messages().loading_preset_config.as_str());
    let result = load_preset_plan(reference);
    finish_creation_progress(progress, &result);
    let plan = result?;
    if plan.source.repo.starts_with("http://") && !reference.starts_with("http://") {
        eprintln!(
            "{}",
            style(messages().http_source_warning.as_str()).yellow()
        );
    }
    Ok(plan)
}

fn resolve_target(cwd: &Path, target: &str) -> Result<PathBuf> {
    let requested = cwd.join(target);
    validate_target(&requested)?;
    let mut missing = Vec::new();
    let mut ancestor = requested.as_path();
    while !ancestor.exists() {
        missing.push(ancestor.file_name().ok_or_else(|| {
            PresetError::ValidationError("Invalid project target path".to_string())
        })?);
        ancestor = ancestor.parent().ok_or_else(|| {
            PresetError::ValidationError("Invalid project target path".to_string())
        })?;
    }
    let mut root = std::fs::canonicalize(ancestor)?;
    for name in missing.into_iter().rev() {
        root.push(name);
    }
    validate_target(&root)?;
    if cwd != root && cwd.starts_with(&root) {
        return Err(PresetError::ValidationError(
            "The project target cannot contain the current working directory".to_string(),
        ));
    }
    Ok(root)
}

fn preview_creation(
    source: &CreationSource,
    root: &Path,
    project: &str,
    manager: PackageManager,
) -> Result<()> {
    let private = !matches!(source, CreationSource::Official(_));
    let source = match source {
        CreationSource::Official(generator) => json!({
            "type": "official",
            "id": generator.id,
            "command": { "program": manager.as_str(), "args": generator_arguments(generator, project, manager)? }
        }),
        CreationSource::Repository(repo) => json!({"type": "repository", "repo": repo}),
        CreationSource::Config(plan) => json!({"type": "config", "plan": plan}),
    };
    println!(
        "{}",
        serde_json::to_string_pretty(&json!({
            "target": root,
            "targetExists": root.exists(),
            "replacesExistingFiles": root.exists() && !is_dir_empty(root)?,
            "source": source,
            "cleanup": if private { PRIVATE_PRESET_METADATA } else { &[][..] },
            "resetPackageName": private
        }))?
    );
    Ok(())
}

fn load_bound_private_catalog(path: Result<Option<PathBuf>>) -> Option<PrivateCatalog> {
    let language = messages();
    let result = match path {
        Ok(Some(path)) => load_private_catalog(&path).map(Some),
        Ok(None) => return None,
        Err(error) => Err(error),
    };
    match result {
        Ok(catalog) => catalog,
        Err(error) => {
            eprintln!(
                "\n{}",
                style(format_message(
                    language.bound_presets_warning.as_str(),
                    &[("error", &error.to_string())],
                ))
                .yellow()
            );
            eprintln!("{}\n", style(language.clear_saved_path.as_str()).dim());
            None
        }
    }
}

fn resolve_requested_source(
    source: Option<String>,
    legacy_template: Option<String>,
) -> Result<Option<String>> {
    match (source, legacy_template) {
        (Some(_), Some(_)) => Err(PresetError::ValidationError(
            "Use either --from or the legacy --template option, not both".to_string(),
        )),
        (Some(source), None) => Ok(Some(source)),
        (None, Some(template)) => {
            eprintln!(
                "\n{}",
                style(messages().template_deprecated.as_str()).yellow()
            );
            Ok(Some(template))
        }
        (None, None) => Ok(None),
    }
}

fn is_preset_config_reference(source: &str) -> bool {
    if source.starts_with("https://") || source.starts_with("http://") {
        return true;
    }
    Path::new(source)
        .extension()
        .and_then(|extension| extension.to_str())
        == Some("json")
}

fn display_welcome() {
    println!();
    println!("{}", style("create-preset").cyan().bold());
    println!("{}", style(messages().app_description.as_str()).dim());
}

fn prompt_target_dir(app_name: Option<String>) -> Result<String> {
    if let Some(name) = app_name {
        let trimmed = name.trim();
        if trimmed.is_empty() {
            return Err(PresetError::ValidationError(
                messages().project_name_empty.as_str().to_string(),
            ));
        }
        return Ok(trimmed.to_string());
    }
    Input::<String>::new()
        .with_prompt(messages().project_name.as_str())
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
        return Err(PresetError::ValidationError(format_message(
            messages().unknown_preset.as_str(),
            &[("source", name)],
        )));
    }
    if catalog.is_empty() {
        return Err(PresetError::ConfigError(
            messages().no_presets.as_str().to_string(),
        ));
    }
    let tech_names: Vec<String> = catalog
        .iter()
        .map(|stack| colorize(&stack.label, &stack.color))
        .collect();
    let tech_index = Select::new()
        .with_prompt(messages().select_tech_stack.as_str())
        .items(&tech_names)
        .default(0)
        .interact()
        .map_err(dialoguer_error)?;
    let stack = &catalog[tech_index];
    let labels: Vec<String> = stack.choices.iter().map(choice_label).collect();
    let choice_index = Select::new()
        .with_prompt(messages().select_preset.as_str())
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
        StarterChoice::Official(generator) => with_description(
            format!("{} ↗", generator_name(&generator.id, &generator.name)),
            &generator.desc,
        ),
    }
}

fn with_description(name: String, description: &str) -> String {
    if description.is_empty() {
        name
    } else {
        format!("{} - {}", name, description)
    }
}

fn confirm_target(root: &Path) -> Result<()> {
    validate_target(root)?;
    if root.exists() && !is_dir_empty(root)? {
        let target = if root == std::fs::canonicalize(std::env::current_dir()?)? {
            messages().current_directory.as_str().to_string()
        } else {
            format_message(
                messages().target_directory.as_str(),
                &[(
                    "name",
                    root.file_name()
                        .and_then(|name| name.to_str())
                        .unwrap_or_default(),
                )],
            )
        };
        let overwrite = Confirm::new()
            .with_prompt(format_message(
                messages().overwrite_directory.as_str(),
                &[("target", &target)],
            ))
            .default(false)
            .interact()
            .map_err(dialoguer_error)?;
        if !overwrite {
            return Err(PresetError::UserCancelled);
        }
    }

    Ok(())
}

fn create_repository_preset(
    repo: &str,
    root: &Path,
    target_dir: &str,
    destination: &Path,
) -> Result<()> {
    println!(
        "\n{}",
        format_message(
            messages().creating_project.as_str(),
            &[("path", &destination.display().to_string())]
        )
    );
    let progress = spinner(messages().downloading_private_preset.as_str());
    let result = download_repo(repo, root)
        .and_then(|_| clean_private_preset(root))
        .and_then(|_| {
            reset_package_name(
                root,
                destination
                    .file_name()
                    .and_then(|name| name.to_str())
                    .unwrap_or(target_dir),
            )
        });
    finish_creation_progress(progress, &result);
    result
}

fn create_config_preset(
    plan: &PresetPlan,
    root: &Path,
    target_dir: &str,
    destination: &Path,
) -> Result<()> {
    println!(
        "\n{}",
        format_message(
            messages().creating_project.as_str(),
            &[("path", &destination.display().to_string())]
        )
    );
    let progress = spinner(messages().applying_preset_config.as_str());
    let result = materialize_preset_plan(plan, root)
        .and_then(|_| clean_private_preset(root))
        .and_then(|_| {
            reset_package_name(
                root,
                destination
                    .file_name()
                    .and_then(|name| name.to_str())
                    .unwrap_or(target_dir),
            )
        });
    finish_creation_progress(progress, &result);
    result
}

fn finish_creation_progress<T>(progress: indicatif::ProgressBar, result: &Result<T>) {
    if result.is_ok() {
        progress.finish_and_clear();
    } else {
        progress.abandon_with_message(style(messages().creation_failed.as_str()).red().to_string());
    }
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
    if std::fs::symlink_metadata(&path).is_ok_and(|metadata| metadata.file_type().is_symlink()) {
        return Err(PresetError::ValidationError(
            "Private preset package.json cannot be a symbolic link".to_string(),
        ));
    }
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
            .with_prompt(messages().package_name.as_str())
            .default(to_valid_package_name(&inferred))
            .validate_with(|value: &String| -> std::result::Result<(), &str> {
                if is_valid_package_name(value) {
                    Ok(())
                } else {
                    Err(messages().invalid_package_name.as_str())
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

    #[test]
    fn identifies_remote_and_local_json_sources() {
        assert!(is_preset_config_reference(
            "https://example.com/preset.json"
        ));
        assert!(is_preset_config_reference(
            "http://192.168.1.10/preset.json"
        ));
        assert!(is_preset_config_reference("./preset.json"));
        assert!(is_preset_config_reference("https://example.com/not-json"));
        assert!(!is_preset_config_reference("vue"));
        assert!(!is_preset_config_reference("company-docs"));
    }

    #[test]
    fn ignores_an_unavailable_bound_private_catalog() {
        assert!(load_bound_private_catalog(Ok(Some(PathBuf::from(
            "/path/that/does/not/exist.json"
        ))))
        .is_none());
        assert!(load_bound_private_catalog(Err(PresetError::ConfigError(
            "broken runtime config".to_string()
        )))
        .is_none());
    }
}

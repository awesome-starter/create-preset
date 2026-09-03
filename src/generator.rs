use crate::error::{PresetError, Result};
use crate::types::{BuiltInTech, GeneratorConfig, PackageManager};
use std::collections::HashMap;
use std::path::Path;
use std::process::{Command, Stdio};

fn command(tech: &str, id: &str, name: &str, args: &[&str]) -> GeneratorConfig {
    let mut commands = HashMap::new();
    for manager in [
        PackageManager::Pnpm,
        PackageManager::Npm,
        PackageManager::Yarn,
        PackageManager::Bun,
    ] {
        let mut values = vec!["create".to_string(), id.to_string()];
        if manager == PackageManager::Npm {
            values[1].push_str("@latest");
        } else if manager == PackageManager::Yarn {
            values[1] = id.to_string();
        }
        values.extend(args.iter().map(|arg| (*arg).to_string()));
        commands.insert(manager, values);
    }
    GeneratorConfig {
        id: id.to_string(),
        tech: tech.to_string(),
        name: name.to_string(),
        desc: String::new(),
        commands,
    }
}

pub fn official_generators() -> Vec<GeneratorConfig> {
    vec![
        command("vue", "vue", "Official Vue Starter", &["{project}"]),
        command("vue", "nuxt", "Nuxt", &["{project}"]),
        command("vite", "vite", "Official Vite CLI", &["{project}"]),
        command(
            "react",
            "next-app",
            "Official Next.js Starter",
            &["{project}"],
        ),
    ]
}

pub fn built_in_techs() -> Vec<BuiltInTech> {
    vec![
        BuiltInTech {
            id: "vue",
            label: "Vue",
            color: "#42b983",
        },
        BuiltInTech {
            id: "react",
            label: "React",
            color: "#61dafb",
        },
        BuiltInTech {
            id: "vite",
            label: "Vite",
            color: "#787ffd",
        },
    ]
}

pub fn run_generator(
    generator: &GeneratorConfig,
    project: &str,
    cwd: &Path,
    manager: PackageManager,
) -> Result<()> {
    let args = generator.commands.get(&manager).ok_or_else(|| {
        PresetError::ValidationError(format!(
            "No {} command configured for {}",
            manager.as_str(),
            generator.name
        ))
    })?;
    let args: Vec<String> = args
        .iter()
        .map(|arg| {
            if arg == "{project}" {
                project.to_string()
            } else {
                arg.clone()
            }
        })
        .collect();
    println!("\nRunning {} via {}...\n", generator.name, manager.as_str());
    let status = Command::new(manager.as_str())
        .args(&args)
        .current_dir(cwd)
        .stdin(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .status()
        .map_err(|error| {
            PresetError::GeneratorError(format!(
                "Failed to execute {}: {}",
                manager.as_str(),
                error
            ))
        })?;
    if !status.success() {
        return Err(PresetError::GeneratorError(format!(
            "{} exited with {}",
            generator.name, status
        )));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn includes_supported_official_generators() {
        let generators = official_generators();
        assert!(generators.iter().any(|item| item.id == "vue"));
        assert!(generators.iter().any(|item| item.id == "vite"));
        assert!(generators
            .iter()
            .any(|item| item.id == "nuxt" && item.tech == "vue"));
        assert!(generators
            .iter()
            .any(|item| item.id == "next-app" && item.tech == "react"));
        assert!(!generators.iter().any(|item| item.id == "blackwork"));
    }

    #[test]
    fn builds_package_manager_specific_commands() {
        let vue = official_generators()
            .into_iter()
            .find(|item| item.id == "vue")
            .unwrap();
        assert_eq!(
            vue.commands[&PackageManager::Npm],
            ["create", "vue@latest", "{project}"]
        );
        assert_eq!(
            vue.commands[&PackageManager::Pnpm],
            ["create", "vue", "{project}"]
        );
    }
}

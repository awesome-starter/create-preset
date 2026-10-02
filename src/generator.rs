use crate::error::{PresetError, Result};
use crate::i18n::{format_message, generator_name, messages};
use crate::process::package_manager_command;
use crate::types::{BuiltInTech, GeneratorConfig, PackageManager};
use std::collections::HashMap;
use std::path::Path;
use std::process::Stdio;

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

fn sv_command() -> GeneratorConfig {
    let mut commands = HashMap::new();
    commands.insert(
        PackageManager::Pnpm,
        vec!["dlx", "sv", "create", "{project}"]
            .into_iter()
            .map(String::from)
            .collect(),
    );
    commands.insert(
        PackageManager::Npm,
        vec!["exec", "sv", "create", "{project}"]
            .into_iter()
            .map(String::from)
            .collect(),
    );
    commands.insert(
        PackageManager::Yarn,
        vec!["dlx", "sv", "create", "{project}"]
            .into_iter()
            .map(String::from)
            .collect(),
    );
    commands.insert(
        PackageManager::Bun,
        vec!["x", "sv", "create", "{project}"]
            .into_iter()
            .map(String::from)
            .collect(),
    );
    GeneratorConfig {
        id: "svelte".to_string(),
        tech: "svelte".to_string(),
        name: "Official SvelteKit Starter".to_string(),
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
        command(
            "react",
            "react-router",
            "Official React Router",
            &["{project}"],
        ),
        command("astro", "astro", "Official Astro Starter", &["{project}"]),
        command("react", "expo-app", "Official Expo App", &["{project}"]),
        sv_command(),
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
        BuiltInTech {
            id: "svelte",
            label: "Svelte",
            color: "#ff3e00",
        },
    ]
}

pub fn generator_arguments(
    generator: &GeneratorConfig,
    project: &str,
    manager: PackageManager,
) -> Result<Vec<String>> {
    let args = generator.commands.get(&manager).ok_or_else(|| {
        PresetError::ValidationError(format!(
            "No {} command configured for {}",
            manager.as_str(),
            generator.name
        ))
    })?;
    Ok(args
        .iter()
        .map(|arg| {
            if arg == "{project}" {
                project.to_string()
            } else {
                arg.clone()
            }
        })
        .collect())
}

pub fn run_generator(
    generator: &GeneratorConfig,
    project: &str,
    cwd: &Path,
    manager: PackageManager,
) -> Result<()> {
    let args = generator_arguments(generator, project, manager)?;
    // Resolve Windows shims before any child process is started.
    let mut command = package_manager_command(manager)?;
    println!(
        "\n{}\n",
        format_message(
            messages().running_generator.as_str(),
            &[
                ("name", generator_name(&generator.id, &generator.name)),
                ("manager", manager.as_str()),
            ],
        )
    );
    let status = command
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
        assert!(generators
            .iter()
            .any(|item| item.id == "react-router" && item.tech == "react"));
        assert!(generators
            .iter()
            .any(|item| item.id == "astro" && item.tech == "astro"));
        assert!(generators
            .iter()
            .any(|item| item.id == "expo-app" && item.tech == "react"));
        assert!(generators
            .iter()
            .any(|item| item.id == "svelte" && item.tech == "svelte"));
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

    #[test]
    fn builds_new_official_generator_commands() {
        let generators = official_generators();
        let astro = generators.iter().find(|item| item.id == "astro").unwrap();
        assert_eq!(
            astro.commands[&PackageManager::Pnpm],
            ["create", "astro", "{project}"]
        );
        let expo = generators
            .iter()
            .find(|item| item.id == "expo-app")
            .unwrap();
        assert_eq!(
            expo.commands[&PackageManager::Pnpm],
            ["create", "expo-app", "{project}"]
        );
        let router = generators
            .iter()
            .find(|item| item.id == "react-router")
            .unwrap();
        assert_eq!(
            router.commands[&PackageManager::Pnpm],
            ["create", "react-router", "{project}"]
        );
        let svelte = generators.iter().find(|item| item.id == "svelte").unwrap();
        assert_eq!(
            svelte.commands[&PackageManager::Pnpm],
            ["dlx", "sv", "create", "{project}"]
        );
        assert_eq!(
            svelte.commands[&PackageManager::Npm],
            ["exec", "sv", "create", "{project}"]
        );
    }
}

use crate::constants::PACKAGE_NAME;
use crate::error::{PresetError, Result};
use crate::i18n::{format_message, messages};
use crate::types::PackageManager;
use crate::ui::{dialoguer_error, spinner};
use console::style;
use dialoguer::{Confirm, Select};
use semver::Version;
use serde::Deserialize;
use std::process::Command;

#[derive(Deserialize)]
struct RegistryPackage {
    version: String,
}

#[derive(Debug)]
struct PackageUpgradeInfo {
    package_name: String,
    current_version: String,
    latest_version: String,
    need_to_upgrade: bool,
}

pub fn upgrade_command() -> Result<()> {
    let detection_spinner = spinner(messages().detecting_upgrade.as_str());
    let info = query_package_upgrade_info(env!("CARGO_PKG_VERSION"))?;
    detection_spinner.finish_with_message(
        style(messages().detected_successfully.as_str())
            .green()
            .to_string(),
    );

    println!();
    if !info.need_to_upgrade {
        println!("  {}\n", messages().already_latest.as_str());
        return Ok(());
    }

    println!(
        "  {}",
        format_message(
            messages().current_version.as_str(),
            &[("version", &style(&info.current_version).cyan().to_string())],
        )
    );
    println!(
        "  {}",
        format_message(
            messages().latest_version.as_str(),
            &[("version", &style(&info.latest_version).cyan().to_string())],
        )
    );
    if !Confirm::new()
        .with_prompt(messages().confirm_upgrade.as_str())
        .default(true)
        .interact()
        .map_err(dialoguer_error)?
    {
        return Ok(());
    }

    let managers = [
        PackageManager::Npm,
        PackageManager::Yarn,
        PackageManager::Pnpm,
        PackageManager::Bun,
    ];
    let labels: Vec<&str> = managers.iter().map(PackageManager::as_str).collect();
    let selected = Select::new()
        .with_prompt(messages().select_package_manager.as_str())
        .items(&labels)
        .default(0)
        .interact()
        .map_err(dialoguer_error)?;

    let manager = managers[selected];
    let mut command = Command::new(manager.as_str());
    match manager {
        PackageManager::Npm => command.args([
            "install",
            "--global",
            &format!("{}@latest", info.package_name),
        ]),
        PackageManager::Yarn => {
            command.args(["global", "add", &format!("{}@latest", info.package_name)])
        }
        PackageManager::Pnpm => command.args([
            "install",
            "--global",
            &format!("{}@latest", info.package_name),
        ]),
        PackageManager::Bun => {
            command.args(["add", "--global", &format!("{}@latest", info.package_name)])
        }
    };

    let upgrade_spinner = spinner(messages().upgrading.as_str());
    let status = command.status().map_err(|error| {
        PresetError::IoError(format!("Failed to execute {}: {}", manager.as_str(), error))
    })?;
    if !status.success() {
        upgrade_spinner
            .abandon_with_message(style(messages().upgrade_failed.as_str()).red().to_string());
        return Err(PresetError::IoError(format!(
            "{} exited with {}",
            manager.as_str(),
            status
        )));
    }
    upgrade_spinner.finish_with_message(
        style(messages().upgraded_successfully.as_str())
            .green()
            .to_string(),
    );
    Ok(())
}

fn query_package_upgrade_info(current_version: &str) -> Result<PackageUpgradeInfo> {
    let url = format!("https://registry.npmjs.org/{}/latest", PACKAGE_NAME);
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()?;
    let response = client.get(url).send()?;
    if !response.status().is_success() {
        return Err(PresetError::NetworkError(format!(
            "npm registry returned {}",
            response.status()
        )));
    }
    let latest = response.json::<RegistryPackage>()?.version;
    package_upgrade_info(current_version, &latest)
}

fn package_upgrade_info(current_version: &str, latest: &str) -> Result<PackageUpgradeInfo> {
    let current = Version::parse(current_version).map_err(|error| {
        PresetError::ConfigError(format!(
            "Invalid current version {}: {}",
            current_version, error
        ))
    })?;
    let latest_version = Version::parse(latest).map_err(|error| {
        PresetError::ConfigError(format!("Invalid registry version {}: {}", latest, error))
    })?;

    Ok(PackageUpgradeInfo {
        package_name: PACKAGE_NAME.to_string(),
        current_version: current_version.to_string(),
        latest_version: latest.to_string(),
        need_to_upgrade: current < latest_version,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn compares_semantic_versions() {
        assert!(
            package_upgrade_info("1.0.0", "1.1.0")
                .unwrap()
                .need_to_upgrade
        );
        assert!(
            !package_upgrade_info("1.1.0", "1.1.0")
                .unwrap()
                .need_to_upgrade
        );
        assert!(
            !package_upgrade_info("2.0.0", "1.9.9")
                .unwrap()
                .need_to_upgrade
        );
        assert!(
            package_upgrade_info("1.0.0-beta.1", "1.0.0")
                .unwrap()
                .need_to_upgrade
        );
    }
}

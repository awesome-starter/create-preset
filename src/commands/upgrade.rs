use crate::constants::PACKAGE_NAME;
use crate::error::{PresetError, Result};
use crate::types::{PackageManager, PackageUpgradeInfo};
use console::style;
use dialoguer::{Confirm, Select};
use indicatif::{ProgressBar, ProgressStyle};
use semver::Version;
use serde::Deserialize;
use std::process::Command;

#[derive(Deserialize)]
struct RegistryPackage {
    version: String,
}

pub fn upgrade_command() -> Result<()> {
    let detection_spinner = spinner("Detecting upgrade information...");
    let info = query_package_upgrade_info(env!("CARGO_PKG_VERSION"))?;
    detection_spinner.finish_with_message(style("Detected successfully.").green().to_string());

    println!();
    if !info.need_to_upgrade {
        println!("  The current version is already the latest version, no need to upgrade.\n");
        return Ok(());
    }

    println!(
        "  The current version: {}",
        style(&info.current_version).cyan()
    );
    println!(
        "  The latest version: {}",
        style(&info.latest_version).cyan()
    );
    if !Confirm::new()
        .with_prompt("Found a new version, do you need to upgrade?")
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
        .with_prompt("Please select your package manager for global installation")
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

    let upgrade_spinner = spinner("Upgrading...");
    let status = command.status().map_err(|error| {
        PresetError::IoError(format!("Failed to execute {}: {}", manager.as_str(), error))
    })?;
    if !status.success() {
        upgrade_spinner.abandon_with_message(style("Upgrade failed.").red().to_string());
        return Err(PresetError::IoError(format!(
            "{} exited with {}",
            manager.as_str(),
            status
        )));
    }
    upgrade_spinner.finish_with_message(style("Upgraded successfully.").green().to_string());
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

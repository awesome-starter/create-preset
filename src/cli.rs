use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "preset")]
#[command(args_conflicts_with_subcommands = true)]
#[command(author, version, disable_version_flag = true, about = "Create projects with official generators and declarative presets.", long_about = None)]
pub struct Cli {
    /// Output the version number
    #[arg(short = 'v', long = "version", action = clap::ArgAction::Version)]
    pub version: Option<bool>,

    /// List registered official generators and private presets
    #[arg(long)]
    pub list: bool,

    #[command(subcommand)]
    pub command: Option<Commands>,
}

#[derive(Subcommand)]
pub enum Commands {
    /// Create a project from an official generator or preset source
    Init {
        /// Project name
        app_name: Option<String>,

        /// Create from a registered name, preset.json URL, or local preset.json
        #[arg(long = "from", conflicts_with = "template")]
        source: Option<String>,

        /// Legacy alias for --from
        #[arg(long, hide = true)]
        template: Option<String>,

        /// Package manager used to run official generators
        #[arg(long, value_enum)]
        package_manager: Option<crate::types::PackageManager>,

        /// Show the creation plan without running a generator or modifying files
        #[arg(long)]
        dry_run: bool,

        /// Replace existing target files without asking for confirmation
        #[arg(long)]
        yes: bool,
    },

    /// Manage the private preset configuration
    Config {
        #[command(subcommand)]
        action: ConfigAction,
    },

    /// Update the global installation to the latest version
    Upgrade,
}

#[derive(Subcommand)]
pub enum ConfigAction {
    /// Output the local config file path
    Get,

    /// Save the local config file path
    Set {
        /// Local config file path
        file_path: String,
    },

    /// Remove the local config file path
    Remove,
}

#[cfg(test)]
mod tests {
    use super::*;
    use clap::Parser;

    #[test]
    fn accepts_legacy_short_version_flag() {
        match Cli::try_parse_from(["preset", "-v"]) {
            Err(error) => assert_eq!(error.kind(), clap::error::ErrorKind::DisplayVersion),
            Ok(_) => panic!("version action should stop parsing"),
        }
    }

    #[test]
    fn rejects_removed_tech_config_flag() {
        assert!(Cli::try_parse_from(["preset", "config", "--tech", "get"]).is_err());
        assert!(Cli::try_parse_from(["preset", "config", "get", "--tech"]).is_err());
    }

    #[test]
    fn rejects_removed_proxy_commands() {
        assert!(Cli::try_parse_from(["preset", "proxy", "on"]).is_err());
        assert!(Cli::try_parse_from(["preset", "p", "on"]).is_err());
    }

    #[test]
    fn rejects_removed_command_aliases() {
        assert!(Cli::try_parse_from(["preset", "i"]).is_err());
        assert!(Cli::try_parse_from(["preset", "c", "get"]).is_err());
        assert!(Cli::try_parse_from(["preset", "u"]).is_err());
    }

    #[test]
    fn accepts_a_registered_source_and_package_manager() {
        assert!(Cli::try_parse_from([
            "preset",
            "init",
            "demo",
            "--from",
            "vue",
            "--package-manager",
            "pnpm",
        ])
        .is_ok());
    }

    #[test]
    fn accepts_json_sources_and_rejects_removed_init_options() {
        assert!(
            Cli::try_parse_from(["preset", "init", "demo", "--from", "./preset.json",]).is_ok()
        );
        assert!(Cli::try_parse_from(["preset", "init", "demo", "--preset", "vue"]).is_err());
        assert!(
            Cli::try_parse_from(["preset", "init", "demo", "--config", "./preset.json"]).is_err()
        );
        assert!(Cli::try_parse_from(["preset", "init", "demo", "-c", "./preset.json"]).is_err());
        assert!(Cli::try_parse_from(["preset", "init", "demo", "-p", "vue"]).is_err());
        assert!(Cli::try_parse_from(["preset", "init", "demo", "-t", "vue"]).is_err());
    }
}

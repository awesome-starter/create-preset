use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "preset")]
#[command(author, version, disable_version_flag = true, about = "Provides the ability to quickly create preset projects.", long_about = None)]
pub struct Cli {
    /// Output the version number
    #[arg(short = 'v', long = "version", action = clap::ArgAction::Version)]
    pub version: Option<bool>,

    #[command(subcommand)]
    pub command: Option<Commands>,
}

#[derive(Subcommand)]
pub enum Commands {
    /// Generate a project from a preset template
    #[command(alias = "i")]
    Init {
        /// Project name
        app_name: Option<String>,

        /// Specify a template name
        #[arg(short, long)]
        template: Option<String>,
    },

    /// Use the local preset config
    #[command(alias = "c")]
    Config {
        #[command(subcommand)]
        action: ConfigAction,

        /// Configure the local technology stack
        #[arg(short, long, global = true)]
        tech: bool,
    },

    /// Use proxy to download template
    #[command(alias = "p")]
    Proxy {
        #[command(subcommand)]
        action: ProxyAction,
    },

    /// Update to the latest version
    #[command(alias = "u")]
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

#[derive(Subcommand)]
pub enum ProxyAction {
    /// Turn on proxy
    On,

    /// Turn off proxy
    Off,
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
    fn accepts_tech_flag_before_and_after_subcommand() {
        assert!(Cli::try_parse_from(["preset", "config", "--tech", "get"]).is_ok());
        assert!(Cli::try_parse_from(["preset", "config", "get", "--tech"]).is_ok());
    }
}

mod cli;
mod commands;
mod config;
mod constants;
mod download;
mod error;
mod generator;
mod types;
mod utils;

use clap::Parser;
use cli::{Cli, Commands};
use console::style;
use error::Result;

fn main() {
    if let Err(error) = run() {
        eprintln!("{} {}", style("Error:").red().bold(), error);
        std::process::exit(1);
    }
}

fn run() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Some(Commands::Init { app_name, template }) => {
            commands::init_command(app_name, template)?;
        }
        Some(Commands::Config { action, tech }) => {
            commands::config_command(action, tech)?;
        }
        Some(Commands::Proxy { action }) => {
            commands::proxy_command(action)?;
        }
        Some(Commands::Upgrade) => {
            commands::upgrade_command()?;
        }
        None => {
            // Default to init command
            commands::init_command(None, None)?;
        }
    }

    Ok(())
}

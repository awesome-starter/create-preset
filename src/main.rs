mod catalog;
mod cli;
mod commands;
mod config;
mod constants;
mod download;
mod error;
mod generator;
mod i18n;
mod preset;
mod process;
mod target;
mod types;
mod ui;
mod utils;

use clap::Parser;
use cli::{Cli, Commands};
use console::style;
use error::Result;
use i18n::messages;

fn main() {
    if let Err(error) = run() {
        eprintln!(
            "{} {}",
            style(messages().error_label.as_str()).red().bold(),
            error
        );
        std::process::exit(1);
    }
}

fn run() -> Result<()> {
    let cli = Cli::parse();

    if cli.list {
        return commands::init::list_command();
    }

    match cli.command {
        Some(Commands::Init {
            app_name,
            source,
            template,
            package_manager,
            dry_run,
            yes,
        }) => {
            commands::init_command(app_name, source, template, package_manager, dry_run, yes)?;
        }
        Some(Commands::Config { action }) => {
            commands::config_command(action)?;
        }
        Some(Commands::Upgrade) => {
            commands::upgrade_command()?;
        }
        None => {
            // Default to init command
            commands::init_command(None, None, None, None, false, false)?;
        }
    }

    Ok(())
}

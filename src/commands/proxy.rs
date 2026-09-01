use crate::cli::ProxyAction;
use crate::config::RuntimeConfigManager;
use crate::error::Result;
use console::style;

pub fn proxy_command(action: ProxyAction) -> Result<()> {
    let config_manager = RuntimeConfigManager::new()?;

    match action {
        ProxyAction::On => {
            config_manager.set_proxy(true)?;
            println!();
            println!("  {}", style("Turn on proxy successfully.").green());
            println!();
        }
        ProxyAction::Off => {
            config_manager.set_proxy(false)?;
            println!();
            println!("  {}", style("Turn off proxy successfully.").green());
            println!();
        }
    }

    Ok(())
}

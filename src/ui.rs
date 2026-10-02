use crate::error::PresetError;
use indicatif::{ProgressBar, ProgressStyle};

pub fn spinner(message: &str) -> ProgressBar {
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(ProgressStyle::with_template("{spinner} {msg}").unwrap());
    spinner.set_message(message.to_string());
    spinner.enable_steady_tick(std::time::Duration::from_millis(80));
    spinner
}

pub fn dialoguer_error(error: dialoguer::Error) -> PresetError {
    if matches!(error, dialoguer::Error::IO(ref io) if io.kind() == std::io::ErrorKind::Interrupted)
    {
        PresetError::UserCancelled
    } else {
        PresetError::IoError(error.to_string())
    }
}

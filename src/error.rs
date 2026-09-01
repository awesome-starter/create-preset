use std::fmt;

#[derive(Debug)]
pub enum PresetError {
    ConfigError(String),
    NetworkError(String),
    IoError(String),
    ValidationError(String),
    DownloadError(String),
    GeneratorError(String),
    UserCancelled,
}

impl fmt::Display for PresetError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            PresetError::ConfigError(msg) => write!(f, "Config error: {}", msg),
            PresetError::NetworkError(msg) => write!(f, "Network error: {}", msg),
            PresetError::IoError(msg) => write!(f, "IO error: {}", msg),
            PresetError::ValidationError(msg) => write!(f, "Validation error: {}", msg),
            PresetError::DownloadError(msg) => write!(f, "Download error: {}", msg),
            PresetError::GeneratorError(msg) => write!(f, "Generator error: {}", msg),
            PresetError::UserCancelled => write!(f, "Operation cancelled"),
        }
    }
}

impl std::error::Error for PresetError {}

impl From<std::io::Error> for PresetError {
    fn from(err: std::io::Error) -> Self {
        PresetError::IoError(err.to_string())
    }
}

impl From<reqwest::Error> for PresetError {
    fn from(err: reqwest::Error) -> Self {
        PresetError::NetworkError(err.to_string())
    }
}

impl From<serde_json::Error> for PresetError {
    fn from(err: serde_json::Error) -> Self {
        PresetError::ConfigError(err.to_string())
    }
}

pub type Result<T> = std::result::Result<T, PresetError>;

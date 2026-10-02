use serde::Deserialize;
use std::sync::OnceLock;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Locale {
    EnUs,
    ZhHans,
    ZhHant,
    JaJp,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Messages {
    pub app_description: String,
    pub error_label: String,
    pub config_error: String,
    pub network_error: String,
    pub io_error: String,
    pub validation_error: String,
    pub download_error: String,
    pub generator_error: String,
    pub operation_cancelled: String,
    pub bound_presets_warning: String,
    pub clear_saved_path: String,
    pub template_deprecated: String,
    pub project_name: String,
    pub project_name_empty: String,
    pub unknown_preset: String,
    pub no_presets: String,
    pub select_tech_stack: String,
    pub select_preset: String,
    pub official_vue_starter: String,
    pub official_vite_cli: String,
    pub official_next_starter: String,
    pub official_react_router: String,
    pub official_astro_starter: String,
    pub official_expo_app: String,
    pub official_sveltekit_starter: String,
    pub current_directory: String,
    pub target_directory: String,
    pub overwrite_directory: String,
    pub creating_project: String,
    pub downloading_private_preset: String,
    pub created_successfully: String,
    pub creation_failed: String,
    pub http_config_warning: String,
    pub loading_preset_config: String,
    pub http_source_warning: String,
    pub applying_preset_config: String,
    pub package_name: String,
    pub invalid_package_name: String,
    pub running_generator: String,
    pub saved_private_config: String,
    pub removed_private_config: String,
    pub private_config: String,
    pub no_private_config: String,
    pub bind_private_config: String,
    pub detecting_upgrade: String,
    pub detected_successfully: String,
    pub already_latest: String,
    pub current_version: String,
    pub latest_version: String,
    pub confirm_upgrade: String,
    pub select_package_manager: String,
    pub upgrading: String,
    pub upgrade_failed: String,
    pub upgraded_successfully: String,
}

static MESSAGES: OnceLock<Messages> = OnceLock::new();

pub fn messages() -> &'static Messages {
    MESSAGES.get_or_init(|| load_messages(detect_locale()))
}

pub fn format_message(template: &str, values: &[(&str, &str)]) -> String {
    values
        .iter()
        .fold(template.to_string(), |message, (key, value)| {
            message.replace(&format!("{{{}}}", key), value)
        })
}

pub fn generator_name<'a>(id: &str, fallback: &'a str) -> &'a str {
    match id {
        "vue" => messages().official_vue_starter.as_str(),
        "vite" => messages().official_vite_cli.as_str(),
        "next-app" => messages().official_next_starter.as_str(),
        "react-router" => messages().official_react_router.as_str(),
        "astro" => messages().official_astro_starter.as_str(),
        "expo-app" => messages().official_expo_app.as_str(),
        "svelte" => messages().official_sveltekit_starter.as_str(),
        _ => fallback,
    }
}

fn detect_locale() -> Locale {
    let locale = std::env::var("PRESET_LANG")
        .ok()
        .filter(|value| !value.trim().is_empty())
        .or_else(|| std::env::var("LC_ALL").ok())
        .or_else(|| std::env::var("LC_MESSAGES").ok())
        .or_else(|| std::env::var("LANG").ok())
        .or_else(sys_locale::get_locale)
        .unwrap_or_else(|| "en-US".to_string());
    resolve_locale(&locale)
}

fn resolve_locale(locale: &str) -> Locale {
    let normalized = locale
        .split(['.', '@'])
        .next()
        .unwrap_or(locale)
        .replace('_', "-")
        .to_ascii_lowercase();
    if normalized == "c" || normalized == "posix" {
        return Locale::EnUs;
    }
    if normalized == "zh"
        || normalized.starts_with("zh-hans")
        || normalized.starts_with("zh-cn")
        || normalized.starts_with("zh-sg")
    {
        return Locale::ZhHans;
    }
    if normalized.starts_with("zh-hant")
        || normalized.starts_with("zh-tw")
        || normalized.starts_with("zh-hk")
        || normalized.starts_with("zh-mo")
    {
        return Locale::ZhHant;
    }
    if normalized == "ja" || normalized.starts_with("ja-") {
        return Locale::JaJp;
    }
    Locale::EnUs
}

fn load_messages(locale: Locale) -> Messages {
    let content = match locale {
        Locale::EnUs => include_str!("locales/en-US.json"),
        Locale::ZhHans => include_str!("locales/zh-Hans.json"),
        Locale::ZhHant => include_str!("locales/zh-Hant.json"),
        Locale::JaJp => include_str!("locales/ja-JP.json"),
    };
    serde_json::from_str(content).expect("bundled locale files must match the message schema")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_supported_system_locales() {
        for locale in ["zh", "zh_CN.UTF-8", "zh-SG", "zh-Hans-CN"] {
            assert_eq!(resolve_locale(locale), Locale::ZhHans);
        }
        for locale in ["zh_TW.UTF-8", "zh-HK", "zh-MO", "zh-Hant-TW"] {
            assert_eq!(resolve_locale(locale), Locale::ZhHant);
        }
        for locale in ["ja", "ja-JP", "ja_JP.UTF-8"] {
            assert_eq!(resolve_locale(locale), Locale::JaJp);
        }
        for locale in ["C", "C.UTF-8", "POSIX", "fr-FR"] {
            assert_eq!(resolve_locale(locale), Locale::EnUs);
        }
    }

    #[test]
    fn loads_every_bundled_locale_with_the_same_schema() {
        for locale in [Locale::EnUs, Locale::ZhHans, Locale::ZhHant, Locale::JaJp] {
            let messages = load_messages(locale);
            assert!(!messages.project_name.is_empty());
            assert!(!messages.select_tech_stack.is_empty());
            assert!(!messages.operation_cancelled.is_empty());
        }
    }

    #[test]
    fn formats_named_placeholders() {
        assert_eq!(
            format_message(
                "Running {name} via {manager}",
                &[("name", "Vue"), ("manager", "pnpm")]
            ),
            "Running Vue via pnpm"
        );
    }
}

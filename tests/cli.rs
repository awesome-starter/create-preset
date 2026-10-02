use serde_json::{json, Value};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};
use tempfile::TempDir;

struct Fixture {
    temp: TempDir,
    cwd: PathBuf,
}

impl Fixture {
    fn new() -> Self {
        let temp = tempfile::tempdir().unwrap();
        let cwd = temp.path().join("project-dir");
        fs::create_dir(&cwd).unwrap();
        Self { temp, cwd }
    }

    fn command(&self) -> Command {
        let mut command = Command::new(env!("CARGO_BIN_EXE_preset"));
        command
            .current_dir(&self.cwd)
            .env("HOME", self.temp.path())
            .env("PRESET_LANG", "en-US")
            .env_remove("npm_config_user_agent")
            .env(
                "GIT_CONFIG_GLOBAL",
                self.temp.path().join("missing-gitconfig"),
            )
            .env("GIT_CONFIG_NOSYSTEM", "1");
        command
    }

    fn plan(&self, extra: Value) -> PathBuf {
        let repo = self.temp.path().join("source");
        fs::create_dir(&repo).unwrap();
        fs::write(
            repo.join("package.json"),
            r#"{"name":"old","version":"1.2.3","dependencies":{"example":"workspace:*"}}"#,
        )
        .unwrap();
        fs::write(repo.join("README.md"), "hello starter").unwrap();
        fs::write(repo.join("pnpm-lock.yaml"), "keep lockfile").unwrap();
        fs::create_dir(repo.join(".github")).unwrap();
        fs::write(repo.join(".github/config"), "keep workflow").unwrap();
        for args in [
            vec!["init", "--quiet"],
            vec!["add", "."],
            vec![
                "-c",
                "user.name=Fixture",
                "-c",
                "user.email=fixture@example.com",
                "commit",
                "--quiet",
                "-m",
                "fixture",
            ],
        ] {
            let output = Command::new("git")
                .args(args)
                .current_dir(&repo)
                .env(
                    "GIT_CONFIG_GLOBAL",
                    self.temp.path().join("missing-gitconfig"),
                )
                .env("GIT_CONFIG_NOSYSTEM", "1")
                .output()
                .unwrap();
            success(&output);
        }
        let mut plan = json!({"version":1,"source":{"repo":reqwest::Url::from_file_path(repo).unwrap().to_string()}});
        plan.as_object_mut()
            .unwrap()
            .extend(extra.as_object().unwrap().clone());
        let path = self.cwd.join("preset.json");
        fs::write(&path, serde_json::to_vec(&plan).unwrap()).unwrap();
        path
    }

    fn mock_managers(&self, command: &mut Command) -> PathBuf {
        let directory = self.temp.path().join("manager shims with spaces");
        fs::create_dir(&directory).unwrap();
        let script = r#"const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
fs.writeFileSync(process.env.PRESET_TEST_LOG, JSON.stringify(args));
if (args[0] === 'view') {
  console.log(JSON.stringify('1.2.3'));
} else {
  if (process.env.PRESET_TEST_CANCEL) process.exit(0);
  const project = args[args.length - 1];
  fs.mkdirSync(project, { recursive: true });
  fs.writeFileSync(path.join(project, 'partial.txt'), 'generated');
  process.exit(process.env.PRESET_TEST_FAIL ? 23 : 0);
}
"#;
        fs::write(directory.join("manager.js"), script).unwrap();
        for manager in ["npm", "pnpm", "yarn", "bun"] {
            #[cfg(windows)]
            fs::write(
                directory.join(format!("{}.cmd", manager)),
                "@echo off\r\nnode \"%~dp0manager.js\" %*\r\n",
            )
            .unwrap();
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let path = directory.join(manager);
                fs::write(&path, format!("#!/usr/bin/env node\n{}", script)).unwrap();
                fs::set_permissions(path, fs::Permissions::from_mode(0o755)).unwrap();
            }
        }
        let paths = std::iter::once(directory)
            .chain(std::env::split_paths(&std::env::var_os("PATH").unwrap()))
            .collect::<Vec<_>>();
        let log = self.temp.path().join("manager-log.json");
        command
            .env("PATH", std::env::join_paths(paths).unwrap())
            .env("PRESET_TEST_LOG", &log);
        log
    }
}

fn success(output: &Output) {
    assert!(
        output.status.success(),
        "stdout: {}\nstderr: {}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
}

fn read_json(path: &Path) -> Value {
    serde_json::from_slice(&fs::read(path).unwrap()).unwrap()
}

#[test]
fn explicit_unknown_source_fails_before_any_prompt_or_target_change() {
    let fixture = Fixture::new();
    let output = fixture
        .command()
        .args(["init", "--from", "does-not-exist"])
        .output()
        .unwrap();
    assert!(!output.status.success());
    assert!(String::from_utf8_lossy(&output.stderr).contains("preset --list"));
    assert_eq!(fs::read_dir(&fixture.cwd).unwrap().count(), 0);
}

#[test]
fn lists_registered_generators_without_creating_files() {
    let fixture = Fixture::new();
    let output = fixture.command().arg("--list").output().unwrap();
    success(&output);
    let text = String::from_utf8_lossy(&output.stdout);
    for id in [
        "vue",
        "vite",
        "next-app",
        "react-router",
        "astro",
        "expo-app",
        "svelte",
    ] {
        assert!(text.contains(id));
    }
    assert_eq!(fs::read_dir(&fixture.cwd).unwrap().count(), 0);
}

#[test]
fn dry_run_previews_all_config_operations_without_running_external_commands() {
    let fixture = Fixture::new();
    let config = fixture.cwd.join("preset.json");
    fs::write(
        &config,
        serde_json::to_vec(&json!({
            "version":1,"source":{"repo":"https://example.invalid/repo"},
            "exclude":["cache"],"write":[{"path":"README.md","lines":["hello"]}],
            "replace":[{"path":"file","from":"old","to":"new"}],
            "json":[{"path":"package.json","value":{"private":true}}],
            "packageJson":{"resolveWorkspace":true,"workspaceVersions":{"example":"1.2.3"}}
        }))
        .unwrap(),
    )
    .unwrap();
    let mut command = fixture.command();
    command.env("PATH", fixture.temp.path().join("no-executables"));
    let output = command
        .args([
            "init",
            "missing/target",
            "--from",
            config.to_str().unwrap(),
            "--dry-run",
            "--yes",
        ])
        .output()
        .unwrap();
    success(&output);
    let preview: Value = serde_json::from_slice(&output.stdout).unwrap();
    assert_eq!(preview["source"]["plan"]["write"][0]["lines"][0], "hello");
    assert_eq!(
        preview["source"]["plan"]["packageJson"]["workspaceVersions"]["example"],
        "1.2.3"
    );
    assert!(!fixture.cwd.join("missing").exists());
}

#[test]
fn dry_run_previews_the_official_command_without_executing_it() {
    let fixture = Fixture::new();
    let output = fixture
        .command()
        .args([
            "init",
            "demo",
            "--from",
            "vite",
            "--package-manager",
            "npm",
            "--dry-run",
        ])
        .output()
        .unwrap();
    success(&output);
    let preview: Value = serde_json::from_slice(&output.stdout).unwrap();
    assert_eq!(
        preview["source"]["command"]["args"],
        json!(["create", "vite@latest", "demo"])
    );
    assert_eq!(preview["cleanup"], json!([]));
    assert_eq!(preview["resetPackageName"], false);
    assert!(!fixture.cwd.join("demo").exists());
}

#[test]
fn invalid_config_preserves_existing_files_even_with_overwrite_enabled() {
    let fixture = Fixture::new();
    let config = fixture.cwd.join("preset.json");
    fs::write(
        &config,
        r#"{"version":2,"source":{"repo":"https://example.com/repo"}}"#,
    )
    .unwrap();
    fs::write(fixture.cwd.join("original"), "original").unwrap();
    let output = fixture
        .command()
        .args(["init", ".", "--from", "./preset.json", "--yes"])
        .output()
        .unwrap();
    assert!(!output.status.success());
    assert!(String::from_utf8_lossy(&output.stderr).contains("Unsupported preset config version"));
    assert!(config.exists());
    assert_eq!(
        fs::read_to_string(fixture.cwd.join("original")).unwrap(),
        "original"
    );
}

#[test]
fn creates_in_current_directory_from_its_own_config_and_keeps_pinned_versions() {
    let fixture = Fixture::new();
    fixture.plan(json!({
        "replace":[{"path":"README.md","from":"starter","to":"project"}],
        "write":[{"path":"hello.txt","lines":["hello"]}],
        "json":[{"path":"package.json","value":{"private":true}}],
        "packageJson":{"resolveWorkspace":true,"workspaceVersions":{"example":"1.2.3"}}
    }));
    fs::write(fixture.cwd.join("old.txt"), "old").unwrap();
    let output = fixture
        .command()
        .args(["init", ".", "--from", "./preset.json", "--yes"])
        .output()
        .unwrap();
    success(&output);
    let package = read_json(&fixture.cwd.join("package.json"));
    assert_eq!(package["name"], "project-dir");
    assert_eq!(package["dependencies"]["example"], "1.2.3");
    assert_eq!(package["version"], "1.2.3");
    assert_eq!(
        fs::read_to_string(fixture.cwd.join("README.md")).unwrap(),
        "hello project"
    );
    assert!(!fixture.cwd.join("old.txt").exists());
    assert!(!fixture.cwd.join(".git").exists());
    assert!(fixture.cwd.join(".github/config").exists());
    assert!(fixture.cwd.join("pnpm-lock.yaml").exists());
}

#[test]
fn failed_config_transformations_preserve_originals_and_remove_new_staging() {
    let fixture = Fixture::new();
    let config = fixture.plan(json!({"replace":[{"path":"missing.txt","from":"old","to":"new"}]}));
    let target = fixture.cwd.join("existing");
    fs::create_dir(&target).unwrap();
    fs::write(target.join("original"), "original").unwrap();
    let output = fixture
        .command()
        .args([
            "init",
            "existing",
            "--from",
            config.to_str().unwrap(),
            "--yes",
        ])
        .output()
        .unwrap();
    assert!(!output.status.success());
    assert!(String::from_utf8_lossy(&output.stderr).contains("replacement file does not exist"));
    assert_eq!(
        fs::read_to_string(target.join("original")).unwrap(),
        "original"
    );
    assert_eq!(fs::read_dir(target).unwrap().count(), 1);
    assert!(!fs::read_dir(&fixture.cwd).unwrap().any(|entry| entry
        .unwrap()
        .file_name()
        .to_string_lossy()
        .starts_with(".preset-")));
}

#[test]
fn official_failure_restores_existing_and_current_directories_and_removes_new_targets() {
    for target in ["existing", ".", "new"] {
        let fixture = Fixture::new();
        let root = fixture.cwd.join(target);
        if target != "new" {
            fs::create_dir_all(root.join(".git")).unwrap();
            fs::write(root.join(".git/config"), "original git metadata").unwrap();
            fs::write(root.join("original"), "original").unwrap();
        }
        let mut command = fixture.command();
        fixture.mock_managers(&mut command);
        let output = command
            .env("PRESET_TEST_FAIL", "1")
            .args([
                "init",
                target,
                "--from",
                "vite",
                "--package-manager",
                "npm",
                "--yes",
            ])
            .output()
            .unwrap();
        assert!(!output.status.success());
        assert!(String::from_utf8_lossy(&output.stderr).contains("exited with"));
        if target == "new" {
            assert!(!root.exists());
        } else {
            assert_eq!(
                fs::read_to_string(root.join("original")).unwrap(),
                "original"
            );
            assert_eq!(
                fs::read_to_string(root.join(".git/config")).unwrap(),
                "original git metadata"
            );
            assert!(!root.join("partial.txt").exists());
        }
    }
}

#[test]
fn delegates_each_package_manager_and_preserves_project_arguments() {
    for manager in ["npm", "pnpm", "yarn", "bun"] {
        let fixture = Fixture::new();
        let mut command = fixture.command();
        let log = fixture.mock_managers(&mut command);
        let output = command
            .args([
                "init",
                "name with spaces & symbols",
                "--from",
                "vite",
                "--package-manager",
                manager,
            ])
            .output()
            .unwrap();
        success(&output);
        assert_eq!(read_json(&log)[2], "name with spaces & symbols");
        assert!(fixture
            .cwd
            .join("name with spaces & symbols/partial.txt")
            .exists());
    }
}

#[test]
fn resolves_workspace_versions_using_the_package_manager_shim() {
    let fixture = Fixture::new();
    let config = fixture.plan(json!({"packageJson":{"resolveWorkspace":true}}));
    let mut command = fixture.command();
    let log = fixture.mock_managers(&mut command);
    let output = command
        .args(["init", "demo", "--from", config.to_str().unwrap()])
        .output()
        .unwrap();
    success(&output);
    assert_eq!(
        read_json(&log),
        json!(["view", "example", "version", "--json"])
    );
    assert_eq!(
        read_json(&fixture.cwd.join("demo/package.json"))["dependencies"]["example"],
        "^1.2.3"
    );
}

#[test]
fn successful_exit_without_generated_files_restores_the_original_target() {
    let fixture = Fixture::new();
    fs::write(fixture.cwd.join("original"), "original").unwrap();
    let mut command = fixture.command();
    fixture.mock_managers(&mut command);
    let output = command
        .env("PRESET_TEST_CANCEL", "1")
        .args([
            "init",
            ".",
            "--from",
            "vite",
            "--package-manager",
            "npm",
            "--yes",
        ])
        .output()
        .unwrap();
    assert!(!output.status.success());
    assert!(String::from_utf8_lossy(&output.stderr).contains("without creating a project"));
    assert_eq!(
        fs::read_to_string(fixture.cwd.join("original")).unwrap(),
        "original"
    );
}

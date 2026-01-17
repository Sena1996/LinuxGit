use std::sync::Mutex;
use crate::ai::AiConfig;

pub struct AppState {
    pub repo_path: Mutex<Option<String>>,
    pub ai_config: Mutex<AiConfig>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            repo_path: Mutex::new(None),
            ai_config: Mutex::new(AiConfig::default()),
        }
    }
}

pub trait RepositoryStateExt {
    fn get_repo_path(&self) -> Result<String, String>;
}

impl RepositoryStateExt for tauri::State<'_, AppState> {
    fn get_repo_path(&self) -> Result<String, String> {
        self.repo_path
            .lock()
            .unwrap()
            .clone()
            .ok_or_else(|| "No repository open".to_string())
    }
}

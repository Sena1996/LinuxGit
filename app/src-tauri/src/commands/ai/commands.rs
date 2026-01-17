use serde::Serialize;
use tauri::State;
use crate::git;
use crate::ai::{self, AiConfig};
use crate::commands::state::AppState;

#[derive(Debug, Serialize)]
pub struct OllamaStatus {
    pub available: bool,
    pub models: Vec<String>,
}

#[tauri::command]
pub async fn generate_commit_message(state: State<'_, AppState>) -> Result<String, String> {
    let repo_path = {
        let path_guard = state.repo_path.lock().unwrap();
        path_guard
            .as_ref()
            .ok_or("No repository open")?
            .clone()
    };

    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    let diff = git::get_staged_diff_text(&repo).map_err(|e| e.to_string())?;

    if diff.is_empty() {
        return Err("No staged changes to generate commit message from".to_string());
    }

    let config = state.ai_config.lock().unwrap().clone();
    ai::generate_commit_message(&diff, &config)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_ai_config(state: State<AppState>) -> Result<AiConfig, String> {
    let config = state.ai_config.lock().unwrap().clone();
    Ok(config)
}

#[tauri::command]
pub fn set_ai_config(config: AiConfig, state: State<AppState>) -> Result<(), String> {
    *state.ai_config.lock().unwrap() = config;
    Ok(())
}

#[tauri::command]
pub async fn check_ollama_status(state: State<'_, AppState>) -> Result<OllamaStatus, String> {
    let config = state.ai_config.lock().unwrap().clone();
    let available = ai::ollama::is_available(&config.ollama_url).await;

    let models = if available {
        ai::ollama::list_models(&config.ollama_url)
            .await
            .unwrap_or_default()
    } else {
        vec![]
    };

    Ok(OllamaStatus { available, models })
}

#[tauri::command]
pub async fn validate_openai_key(api_key: String) -> Result<bool, String> {
    Ok(ai::openai::validate_api_key(&api_key).await)
}

#[tauri::command]
pub async fn list_ollama_models(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let config = state.ai_config.lock().unwrap().clone();
    ai::ollama::list_models(&config.ollama_url)
        .await
        .map_err(|e| e.to_string())
}

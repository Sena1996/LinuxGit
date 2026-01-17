use tauri::State;
use crate::git::{self, StatusInfo};
use crate::commands::state::AppState;

#[tauri::command]
pub fn get_status(state: State<AppState>) -> Result<StatusInfo, String> {
    let path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();
    let repo = git::open_repo(&path).map_err(|e| e.to_string())?;
    git::get_repo_status(&repo).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn stage_files(paths: Vec<String>, state: State<AppState>) -> Result<(), String> {
    let repo_path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();
    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::stage_files(&repo, &paths).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn unstage_files(paths: Vec<String>, state: State<AppState>) -> Result<(), String> {
    let repo_path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();
    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::unstage_files(&repo, &paths).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn discard_changes(paths: Vec<String>, state: State<AppState>) -> Result<(), String> {
    let repo_path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();
    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::discard_changes(&repo, &paths).map_err(|e| e.to_string())
}

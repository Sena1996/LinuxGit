use tauri::State;
use crate::git::{self, RepoInfo, SyncStatus};
use crate::commands::state::AppState;

#[tauri::command]
pub fn open_repository(path: String, state: State<AppState>) -> Result<RepoInfo, String> {
    let repo = git::open_repo(&path).map_err(|e| e.to_string())?;
    let info = git::get_repo_info(&repo).map_err(|e| e.to_string())?;
    *state.repo_path.lock().unwrap() = Some(path);
    Ok(info)
}

#[tauri::command]
pub fn init_repository(path: String, state: State<AppState>) -> Result<RepoInfo, String> {
    let repo = git::init_repo(&path).map_err(|e| e.to_string())?;
    let info = git::get_repo_info(&repo).map_err(|e| e.to_string())?;
    *state.repo_path.lock().unwrap() = Some(path);
    Ok(info)
}

#[tauri::command]
pub fn get_repository_info(state: State<AppState>) -> Result<RepoInfo, String> {
    let path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();
    let repo = git::open_repo(&path).map_err(|e| e.to_string())?;
    git::get_repo_info(&repo).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn clone_repository(url: String, path: String) -> Result<RepoInfo, String> {
    git::clone_repository(&url, &path, None).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn scan_for_repos(path: String, max_depth: Option<usize>) -> Result<Vec<RepoInfo>, String> {
    git::scan_for_repositories(&path, max_depth.unwrap_or(3)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_repo_sync_status(state: State<AppState>) -> Result<SyncStatus, String> {
    let path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();
    let repo = git::open_repo(&path).map_err(|e| e.to_string())?;
    git::get_sync_status(&repo).map_err(|e| e.to_string())
}

use tauri::State;
use crate::git::{self, RemoteInfo, FetchResult, PullResult, PushResult};
use crate::commands::state::AppState;

#[tauri::command]
pub fn get_remotes(state: State<AppState>) -> Result<Vec<RemoteInfo>, String> {
    let repo_path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();
    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::get_remotes(&repo).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_remote(name: String, url: String, state: State<AppState>) -> Result<RemoteInfo, String> {
    let repo_path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();
    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::add_remote(&repo, &name, &url).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_remote(name: String, state: State<AppState>) -> Result<(), String> {
    let repo_path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();
    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::remove_remote(&repo, &name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn fetch_remote(remote_name: String, state: State<AppState>) -> Result<FetchResult, String> {
    let repo_path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();
    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::fetch(&repo, &remote_name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn fetch_all_remotes(state: State<AppState>) -> Result<Vec<FetchResult>, String> {
    let repo_path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();
    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::fetch_all(&repo).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn pull_remote(state: State<AppState>) -> Result<PullResult, String> {
    let repo_path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();

    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    let remote_name = git::get_default_remote(&repo).map_err(|e| e.to_string())?;
    let head = repo.head().map_err(|e| e.to_string())?;
    let branch_name = head.shorthand().unwrap_or("main").to_string();

    git::pull(&repo, &remote_name, &branch_name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn push_remote(state: State<AppState>) -> Result<PushResult, String> {
    let repo_path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();

    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    let remote_name = git::get_default_remote(&repo).map_err(|e| e.to_string())?;
    let head = repo.head().map_err(|e| e.to_string())?;
    let branch_name = head.shorthand().unwrap_or("main").to_string();

    git::push(&repo, &remote_name, &branch_name).map_err(|e| e.to_string())
}

use tauri::State;
use crate::git::{self, BranchInfo};
use crate::commands::state::AppState;

#[tauri::command]
pub fn get_branches(state: State<AppState>) -> Result<Vec<BranchInfo>, String> {
    let repo_path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();
    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::get_branches(&repo).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_branch(
    name: String,
    from_sha: Option<String>,
    state: State<AppState>,
) -> Result<BranchInfo, String> {
    let repo_path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();
    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::create_branch(&repo, &name, from_sha.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn checkout_branch(name: String, state: State<AppState>) -> Result<(), String> {
    let repo_path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();
    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::checkout_branch(&repo, &name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_branch(
    name: String,
    force: Option<bool>,
    state: State<AppState>,
) -> Result<(), String> {
    let repo_path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();
    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::delete_branch(&repo, &name, force.unwrap_or(false)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn merge_branch(name: String, state: State<AppState>) -> Result<(), String> {
    let repo_path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();
    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::merge_branch(&repo, &name).map_err(|e| e.to_string())
}

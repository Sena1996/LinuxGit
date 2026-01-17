use tauri::State;
use crate::git::{self, FileDiff};
use crate::commands::state::AppState;

#[tauri::command]
pub fn get_file_diff(path: String, staged: bool, state: State<AppState>) -> Result<FileDiff, String> {
    let repo_path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();
    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::get_file_diff(&repo, &path, staged).map_err(|e| e.to_string())
}

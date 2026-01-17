use tauri::State;
use crate::git::{self, CommitInfo, FileDiff, ResetType};
use crate::commands::state::AppState;

// Helper to get repo path from state
fn get_repo_path(state: &State<AppState>) -> Result<String, String> {
    state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open".to_string())
        .map(|p| p.clone())
}

#[tauri::command]
pub fn create_commit(message: String, state: State<AppState>) -> Result<CommitInfo, String> {
    let repo_path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();
    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::create_commit(&repo, &message).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_commits(
    limit: Option<usize>,
    skip: Option<usize>,
    state: State<AppState>,
) -> Result<Vec<CommitInfo>, String> {
    let repo_path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();
    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::get_commit_history(&repo, limit.unwrap_or(100), skip.unwrap_or(0))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_commit_detail(sha: String, state: State<AppState>) -> Result<CommitInfo, String> {
    let repo_path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();
    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::get_commit_detail(&repo, &sha).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cherry_pick_commit(sha: String, state: State<AppState>) -> Result<CommitInfo, String> {
    let repo_path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();
    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::cherry_pick_commit(&repo, &sha).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn revert_commit(sha: String, state: State<AppState>) -> Result<CommitInfo, String> {
    let repo_path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();
    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::revert_commit(&repo, &sha).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn reset_to_commit(
    sha: String,
    reset_type: String,
    state: State<AppState>,
) -> Result<(), String> {
    let repo_path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();

    let reset = match reset_type.as_str() {
        "soft" => ResetType::Soft,
        "mixed" => ResetType::Mixed,
        "hard" => ResetType::Hard,
        _ => return Err("Invalid reset type. Use 'soft', 'mixed', or 'hard'".to_string()),
    };

    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::reset_to_commit(&repo, &sha, reset).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn checkout_commit(sha: String, state: State<AppState>) -> Result<(), String> {
    let repo_path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();
    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::checkout_commit(&repo, &sha).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_tag(
    sha: String,
    tag_name: String,
    message: Option<String>,
    state: State<AppState>,
) -> Result<String, String> {
    let repo_path = state.repo_path.lock().unwrap()
        .as_ref()
        .ok_or("No repository open")?
        .clone();
    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::create_tag(&repo, &sha, &tag_name, message.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_commit_diff(sha: String, state: State<AppState>) -> Result<Vec<FileDiff>, String> {
    let repo_path = get_repo_path(&state)?;
    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::get_commit_diff(&repo, &sha).map_err(|e| e.to_string())
}

// ============== NEW COMMANDS ==============

#[tauri::command]
pub fn merge_commit(sha: String, state: State<AppState>) -> Result<CommitInfo, String> {
    let repo_path = get_repo_path(&state)?;
    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::merge_commit(&repo, &sha).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn rebase_onto(sha: String, state: State<AppState>) -> Result<(), String> {
    let repo_path = get_repo_path(&state)?;
    git::rebase_onto(&repo_path, &sha).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn interactive_rebase(sha: String, state: State<AppState>) -> Result<(), String> {
    let repo_path = get_repo_path(&state)?;
    git::interactive_rebase(&repo_path, &sha).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_tag(tag_name: String, state: State<AppState>) -> Result<(), String> {
    let repo_path = get_repo_path(&state)?;
    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::delete_tag(&repo, &tag_name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn squash_commits(sha: String, state: State<AppState>) -> Result<(), String> {
    let repo_path = get_repo_path(&state)?;
    git::squash_commits(&repo_path, &sha).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn amend_commit_message(sha: String, message: String, state: State<AppState>) -> Result<CommitInfo, String> {
    let repo_path = get_repo_path(&state)?;
    let repo = git::open_repo(&repo_path).map_err(|e| e.to_string())?;
    git::amend_commit_message(&repo, &repo_path, &sha, &message).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn drop_commit(sha: String, state: State<AppState>) -> Result<(), String> {
    let repo_path = get_repo_path(&state)?;
    git::drop_commit(&repo_path, &sha).map_err(|e| e.to_string())
}

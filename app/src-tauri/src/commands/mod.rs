use std::sync::Mutex;
use tauri::State;

use crate::git::{self, BranchInfo, CommitInfo, FileDiff, RepoInfo, StatusInfo};
use crate::ai::{self, AiConfig};

/// Global state for the current repository
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

// ============================================================================
// Repository Commands
// ============================================================================

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
    let path_guard = state.repo_path.lock().unwrap();
    let path = path_guard
        .as_ref()
        .ok_or("No repository open")?;

    let repo = git::open_repo(path).map_err(|e| e.to_string())?;
    git::get_repo_info(&repo).map_err(|e| e.to_string())
}

// ============================================================================
// Status Commands
// ============================================================================

#[tauri::command]
pub fn get_status(state: State<AppState>) -> Result<StatusInfo, String> {
    let path_guard = state.repo_path.lock().unwrap();
    let path = path_guard
        .as_ref()
        .ok_or("No repository open")?;

    let repo = git::open_repo(path).map_err(|e| e.to_string())?;
    git::get_repo_status(&repo).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn stage_files(paths: Vec<String>, state: State<AppState>) -> Result<(), String> {
    let path_guard = state.repo_path.lock().unwrap();
    let repo_path = path_guard
        .as_ref()
        .ok_or("No repository open")?;

    let repo = git::open_repo(repo_path).map_err(|e| e.to_string())?;
    git::stage_files(&repo, &paths).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn unstage_files(paths: Vec<String>, state: State<AppState>) -> Result<(), String> {
    let path_guard = state.repo_path.lock().unwrap();
    let repo_path = path_guard
        .as_ref()
        .ok_or("No repository open")?;

    let repo = git::open_repo(repo_path).map_err(|e| e.to_string())?;
    git::unstage_files(&repo, &paths).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn discard_changes(paths: Vec<String>, state: State<AppState>) -> Result<(), String> {
    let path_guard = state.repo_path.lock().unwrap();
    let repo_path = path_guard
        .as_ref()
        .ok_or("No repository open")?;

    let repo = git::open_repo(repo_path).map_err(|e| e.to_string())?;
    git::discard_changes(&repo, &paths).map_err(|e| e.to_string())
}

// ============================================================================
// Commit Commands
// ============================================================================

#[tauri::command]
pub fn create_commit(message: String, state: State<AppState>) -> Result<CommitInfo, String> {
    let path_guard = state.repo_path.lock().unwrap();
    let repo_path = path_guard
        .as_ref()
        .ok_or("No repository open")?;

    let repo = git::open_repo(repo_path).map_err(|e| e.to_string())?;
    git::create_commit(&repo, &message).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_commits(limit: Option<usize>, skip: Option<usize>, state: State<AppState>) -> Result<Vec<CommitInfo>, String> {
    let path_guard = state.repo_path.lock().unwrap();
    let repo_path = path_guard
        .as_ref()
        .ok_or("No repository open")?;

    let repo = git::open_repo(repo_path).map_err(|e| e.to_string())?;
    git::get_commit_history(&repo, limit.unwrap_or(100), skip.unwrap_or(0)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_commit_detail(sha: String, state: State<AppState>) -> Result<CommitInfo, String> {
    let path_guard = state.repo_path.lock().unwrap();
    let repo_path = path_guard
        .as_ref()
        .ok_or("No repository open")?;

    let repo = git::open_repo(repo_path).map_err(|e| e.to_string())?;
    git::get_commit_detail(&repo, &sha).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cherry_pick_commit(sha: String, state: State<AppState>) -> Result<CommitInfo, String> {
    let path_guard = state.repo_path.lock().unwrap();
    let repo_path = path_guard
        .as_ref()
        .ok_or("No repository open")?;

    let repo = git::open_repo(repo_path).map_err(|e| e.to_string())?;
    git::cherry_pick_commit(&repo, &sha).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn revert_commit(sha: String, state: State<AppState>) -> Result<CommitInfo, String> {
    let path_guard = state.repo_path.lock().unwrap();
    let repo_path = path_guard
        .as_ref()
        .ok_or("No repository open")?;

    let repo = git::open_repo(repo_path).map_err(|e| e.to_string())?;
    git::revert_commit(&repo, &sha).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn reset_to_commit(sha: String, reset_type: String, state: State<AppState>) -> Result<(), String> {
    let path_guard = state.repo_path.lock().unwrap();
    let repo_path = path_guard
        .as_ref()
        .ok_or("No repository open")?;

    let reset = match reset_type.as_str() {
        "soft" => git::ResetType::Soft,
        "mixed" => git::ResetType::Mixed,
        "hard" => git::ResetType::Hard,
        _ => return Err("Invalid reset type. Use 'soft', 'mixed', or 'hard'".to_string()),
    };

    let repo = git::open_repo(repo_path).map_err(|e| e.to_string())?;
    git::reset_to_commit(&repo, &sha, reset).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn checkout_commit(sha: String, state: State<AppState>) -> Result<(), String> {
    let path_guard = state.repo_path.lock().unwrap();
    let repo_path = path_guard
        .as_ref()
        .ok_or("No repository open")?;

    let repo = git::open_repo(repo_path).map_err(|e| e.to_string())?;
    git::checkout_commit(&repo, &sha).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_tag(sha: String, tag_name: String, message: Option<String>, state: State<AppState>) -> Result<String, String> {
    let path_guard = state.repo_path.lock().unwrap();
    let repo_path = path_guard
        .as_ref()
        .ok_or("No repository open")?;

    let repo = git::open_repo(repo_path).map_err(|e| e.to_string())?;
    git::create_tag(&repo, &sha, &tag_name, message.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_commit_diff(sha: String, state: State<AppState>) -> Result<Vec<FileDiff>, String> {
    let path_guard = state.repo_path.lock().unwrap();
    let repo_path = path_guard
        .as_ref()
        .ok_or("No repository open")?;

    let repo = git::open_repo(repo_path).map_err(|e| e.to_string())?;
    git::get_commit_diff(&repo, &sha).map_err(|e| e.to_string())
}

// ============================================================================
// Branch Commands
// ============================================================================

#[tauri::command]
pub fn get_branches(state: State<AppState>) -> Result<Vec<BranchInfo>, String> {
    let path_guard = state.repo_path.lock().unwrap();
    let repo_path = path_guard
        .as_ref()
        .ok_or("No repository open")?;

    let repo = git::open_repo(repo_path).map_err(|e| e.to_string())?;
    git::get_branches(&repo).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_branch(name: String, from_sha: Option<String>, state: State<AppState>) -> Result<BranchInfo, String> {
    let path_guard = state.repo_path.lock().unwrap();
    let repo_path = path_guard
        .as_ref()
        .ok_or("No repository open")?;

    let repo = git::open_repo(repo_path).map_err(|e| e.to_string())?;
    git::create_branch(&repo, &name, from_sha.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn checkout_branch(name: String, state: State<AppState>) -> Result<(), String> {
    let path_guard = state.repo_path.lock().unwrap();
    let repo_path = path_guard
        .as_ref()
        .ok_or("No repository open")?;

    let repo = git::open_repo(repo_path).map_err(|e| e.to_string())?;
    git::checkout_branch(&repo, &name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_branch(name: String, force: Option<bool>, state: State<AppState>) -> Result<(), String> {
    let path_guard = state.repo_path.lock().unwrap();
    let repo_path = path_guard
        .as_ref()
        .ok_or("No repository open")?;

    let repo = git::open_repo(repo_path).map_err(|e| e.to_string())?;
    git::delete_branch(&repo, &name, force.unwrap_or(false)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn merge_branch(name: String, state: State<AppState>) -> Result<(), String> {
    let path_guard = state.repo_path.lock().unwrap();
    let repo_path = path_guard
        .as_ref()
        .ok_or("No repository open")?;

    let repo = git::open_repo(repo_path).map_err(|e| e.to_string())?;
    git::merge_branch(&repo, &name).map_err(|e| e.to_string())
}

// ============================================================================
// Diff Commands
// ============================================================================

#[tauri::command]
pub fn get_file_diff(path: String, staged: bool, state: State<AppState>) -> Result<FileDiff, String> {
    let path_guard = state.repo_path.lock().unwrap();
    let repo_path = path_guard
        .as_ref()
        .ok_or("No repository open")?;

    let repo = git::open_repo(repo_path).map_err(|e| e.to_string())?;
    git::get_file_diff(&repo, &path, staged).map_err(|e| e.to_string())
}

// ============================================================================
// AI Commands
// ============================================================================

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

use git2::{build::RepoBuilder, FetchOptions, RemoteCallbacks, Progress};
use serde::{Deserialize, Serialize};
use std::path::Path;

use super::{GitError, GitResult, RepoInfo};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloneProgress {
    pub stage: String,
    pub current: u32,
    pub total: u32,
    pub bytes_received: u64,
    pub message: String,
}

impl CloneProgress {
    pub fn new(stage: &str, current: u32, total: u32, bytes_received: u64, message: &str) -> Self {
        Self {
            stage: stage.to_string(),
            current,
            total,
            bytes_received,
            message: message.to_string(),
        }
    }
}

/// Clone a repository from a URL to a local path
/// Returns the RepoInfo of the cloned repository
pub fn clone_repository(
    url: &str,
    path: &str,
    progress_callback: Option<Box<dyn Fn(CloneProgress) + Send>>,
) -> GitResult<RepoInfo> {
    let target_path = Path::new(path);

    // Check if directory exists and is not empty
    if target_path.exists() {
        if target_path.is_file() {
            return Err(GitError::OperationFailed(format!(
                "Target path '{}' is a file, not a directory",
                path
            )));
        }
        if target_path.read_dir()?.next().is_some() {
            return Err(GitError::OperationFailed(format!(
                "Target directory '{}' is not empty",
                path
            )));
        }
    }

    // Set up callbacks for progress reporting
    let mut callbacks = RemoteCallbacks::new();

    if let Some(callback) = progress_callback {
        callbacks.transfer_progress(move |stats: Progress<'_>| {
            let stage = if stats.received_objects() < stats.total_objects() {
                "receiving"
            } else if stats.indexed_deltas() < stats.total_deltas() {
                "indexing"
            } else {
                "complete"
            };

            let current = if stats.received_objects() < stats.total_objects() {
                stats.received_objects() as u32
            } else {
                stats.indexed_deltas() as u32
            };

            let total = if stats.received_objects() < stats.total_objects() {
                stats.total_objects() as u32
            } else {
                stats.total_deltas() as u32
            };

            let message = format!(
                "Objects: {}/{}, Deltas: {}/{}",
                stats.received_objects(),
                stats.total_objects(),
                stats.indexed_deltas(),
                stats.total_deltas()
            );

            callback(CloneProgress::new(
                stage,
                current,
                total,
                stats.received_bytes() as u64,
                &message,
            ));

            true
        });
    }

    // Set up SSH authentication
    callbacks.credentials(|_url, username_from_url, allowed_types| {
        if allowed_types.is_ssh_key() {
            // Try to use SSH key from the default location
            let username = username_from_url.unwrap_or("git");
            git2::Cred::ssh_key_from_agent(username)
        } else if allowed_types.is_user_pass_plaintext() {
            // For HTTPS, we might need to prompt for credentials
            // For now, just fail - in the future, we can integrate with credential storage
            Err(git2::Error::from_str("HTTPS authentication not supported yet"))
        } else {
            Err(git2::Error::from_str("Unsupported credential type"))
        }
    });

    // Set up fetch options
    let mut fetch_options = FetchOptions::new();
    fetch_options.remote_callbacks(callbacks);

    // Build and clone
    let repo = RepoBuilder::new()
        .fetch_options(fetch_options)
        .clone(url, target_path)?;

    // Get repo info
    let name = target_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    let head = repo.head().ok();
    let head_branch = head.as_ref().and_then(|h| h.shorthand()).map(String::from);
    let head_sha = head.as_ref().and_then(|h| h.target()).map(|oid| oid.to_string());
    let is_detached = repo.head_detached().unwrap_or(false);

    Ok(RepoInfo {
        path: target_path.to_string_lossy().to_string(),
        name,
        is_bare: repo.is_bare(),
        head_branch,
        head_sha,
        is_detached,
    })
}

/// Scan a directory for Git repositories
pub fn scan_for_repositories(path: &str, max_depth: usize) -> GitResult<Vec<RepoInfo>> {
    let root_path = Path::new(path);
    let mut repos = Vec::new();

    if !root_path.exists() || !root_path.is_dir() {
        return Err(GitError::OperationFailed(format!(
            "Path '{}' is not a valid directory",
            path
        )));
    }

    scan_directory(root_path, &mut repos, 0, max_depth)?;

    Ok(repos)
}

fn scan_directory(
    path: &Path,
    repos: &mut Vec<RepoInfo>,
    current_depth: usize,
    max_depth: usize,
) -> GitResult<()> {
    if current_depth > max_depth {
        return Ok(());
    }

    // Check if this directory is a Git repository
    let git_dir = path.join(".git");
    if git_dir.exists() {
        if let Ok(repo) = git2::Repository::open(path) {
            let name = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string();

            let head = repo.head().ok();
            let head_branch = head.as_ref().and_then(|h| h.shorthand()).map(String::from);
            let head_sha = head.as_ref().and_then(|h| h.target()).map(|oid| oid.to_string());
            let is_detached = repo.head_detached().unwrap_or(false);

            repos.push(RepoInfo {
                path: path.to_string_lossy().to_string(),
                name,
                is_bare: repo.is_bare(),
                head_branch,
                head_sha,
                is_detached,
            });
        }
        // Don't recurse into git repositories
        return Ok(());
    }

    // Scan subdirectories
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            let entry_path = entry.path();
            if entry_path.is_dir() {
                // Skip hidden directories (except .git which we already checked)
                if let Some(name) = entry_path.file_name().and_then(|n| n.to_str()) {
                    if !name.starts_with('.') {
                        scan_directory(&entry_path, repos, current_depth + 1, max_depth)?;
                    }
                }
            }
        }
    }

    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncStatus {
    pub ahead: u32,
    pub behind: u32,
    pub remote_name: Option<String>,
    pub upstream_branch: Option<String>,
}

/// Get sync status (ahead/behind) for the current branch
pub fn get_sync_status(repo: &git2::Repository) -> GitResult<SyncStatus> {
    let head = repo.head().map_err(|e| GitError::OperationFailed(e.to_string()))?;

    if !head.is_branch() {
        return Ok(SyncStatus {
            ahead: 0,
            behind: 0,
            remote_name: None,
            upstream_branch: None,
        });
    }

    let branch_name = head.shorthand().unwrap_or("HEAD");
    let local_branch = repo.find_branch(branch_name, git2::BranchType::Local)?;

    // Try to get upstream
    let upstream = match local_branch.upstream() {
        Ok(upstream) => upstream,
        Err(_) => {
            // No upstream configured
            return Ok(SyncStatus {
                ahead: 0,
                behind: 0,
                remote_name: None,
                upstream_branch: None,
            });
        }
    };

    let upstream_name = upstream.name()?.unwrap_or("").to_string();
    let remote_name = upstream_name.split('/').next().map(String::from);

    // Get the OIDs for comparison
    let local_oid = head.target().ok_or_else(|| {
        GitError::OperationFailed("Could not get local branch HEAD".to_string())
    })?;

    let upstream_oid = upstream.get().target().ok_or_else(|| {
        GitError::OperationFailed("Could not get upstream branch HEAD".to_string())
    })?;

    // Count ahead/behind
    let (ahead, behind) = repo.graph_ahead_behind(local_oid, upstream_oid)?;

    Ok(SyncStatus {
        ahead: ahead as u32,
        behind: behind as u32,
        remote_name,
        upstream_branch: Some(upstream_name),
    })
}

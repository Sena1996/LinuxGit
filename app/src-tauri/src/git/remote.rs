use git2::{Repository, FetchOptions, PushOptions, RemoteCallbacks, Cred, CredentialType};
use serde::{Deserialize, Serialize};

use super::{GitError, GitResult};
use crate::github;

/// Get GitHub token if available
fn get_github_token() -> Option<String> {
    github::get_stored_token().ok()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemoteInfo {
    pub name: String,
    pub url: String,
    pub push_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FetchResult {
    pub remote: String,
    pub updated_refs: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PullResult {
    pub fast_forward: bool,
    pub conflicts: bool,
    pub updated_files: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PushResult {
    pub remote: String,
    pub pushed_refs: Vec<String>,
}

/// Get list of remotes
pub fn get_remotes(repo: &Repository) -> GitResult<Vec<RemoteInfo>> {
    let remotes = repo.remotes()?;
    let mut result = Vec::new();

    for remote_name in remotes.iter().flatten() {
        if let Ok(remote) = repo.find_remote(remote_name) {
            result.push(RemoteInfo {
                name: remote_name.to_string(),
                url: remote.url().unwrap_or("").to_string(),
                push_url: remote.pushurl().map(|s| s.to_string()),
            });
        }
    }

    Ok(result)
}

/// Add a new remote
pub fn add_remote(repo: &Repository, name: &str, url: &str) -> GitResult<RemoteInfo> {
    let remote = repo.remote(name, url)?;
    Ok(RemoteInfo {
        name: name.to_string(),
        url: remote.url().unwrap_or("").to_string(),
        push_url: remote.pushurl().map(|s| s.to_string()),
    })
}

/// Remove a remote
pub fn remove_remote(repo: &Repository, name: &str) -> GitResult<()> {
    repo.remote_delete(name)?;
    Ok(())
}

/// Create callbacks for authentication
fn create_callbacks<'a>() -> RemoteCallbacks<'a> {
    let mut callbacks = RemoteCallbacks::new();

    callbacks.credentials(|url, username_from_url, allowed_types| {
        // For HTTPS URLs, try GitHub token first
        if allowed_types.contains(CredentialType::USER_PASS_PLAINTEXT) {
            // Check if this is a GitHub URL
            if url.contains("github.com") {
                if let Some(token) = get_github_token() {
                    // Use token as password with "x-access-token" as username
                    return Cred::userpass_plaintext("x-access-token", &token);
                }
            }
        }

        // Try SSH agent first
        if allowed_types.contains(CredentialType::SSH_KEY) {
            if let Some(username) = username_from_url {
                // Try SSH agent
                if let Ok(cred) = Cred::ssh_key_from_agent(username) {
                    return Ok(cred);
                }
                // Try default SSH key locations
                let home = std::env::var("HOME").unwrap_or_default();
                let key_paths = [
                    format!("{}/.ssh/id_ed25519", home),
                    format!("{}/.ssh/id_rsa", home),
                ];
                for key_path in &key_paths {
                    if std::path::Path::new(key_path).exists() {
                        if let Ok(cred) = Cred::ssh_key(
                            username,
                            None,
                            std::path::Path::new(key_path),
                            None,
                        ) {
                            return Ok(cred);
                        }
                    }
                }
            }
        }

        // Try default credentials
        if allowed_types.contains(CredentialType::DEFAULT) {
            return Cred::default();
        }

        Err(git2::Error::from_str("No valid credentials found"))
    });

    callbacks.push_update_reference(|_refname, status| {
        if let Some(msg) = status {
            eprintln!("Push rejected: {}", msg);
        }
        Ok(())
    });

    callbacks
}

/// Fetch from a remote
pub fn fetch(repo: &Repository, remote_name: &str) -> GitResult<FetchResult> {
    let mut remote = repo.find_remote(remote_name)
        .map_err(|_| GitError::OperationFailed(format!("Remote '{}' not found", remote_name)))?;

    let callbacks = create_callbacks();
    let mut fetch_options = FetchOptions::new();
    fetch_options.remote_callbacks(callbacks);

    // Fetch all branches
    let refspecs: Vec<String> = remote.fetch_refspecs()?
        .iter()
        .flatten()
        .map(|s| s.to_string())
        .collect();

    let refspec_strs: Vec<&str> = if refspecs.is_empty() {
        vec![]
    } else {
        refspecs.iter().map(|s| s.as_str()).collect()
    };

    remote.fetch(&refspec_strs, Some(&mut fetch_options), None)?;

    Ok(FetchResult {
        remote: remote_name.to_string(),
        updated_refs: refspec_strs.iter().map(|s| s.to_string()).collect(),
    })
}

/// Fetch from all remotes
pub fn fetch_all(repo: &Repository) -> GitResult<Vec<FetchResult>> {
    let remotes = repo.remotes()?;
    let mut results = Vec::new();

    for remote_name in remotes.iter().flatten() {
        match fetch(repo, remote_name) {
            Ok(result) => results.push(result),
            Err(e) => eprintln!("Failed to fetch from {}: {}", remote_name, e),
        }
    }

    Ok(results)
}

/// Pull from remote (fetch + merge)
pub fn pull(repo: &Repository, remote_name: &str, branch_name: &str) -> GitResult<PullResult> {
    // First fetch
    fetch(repo, remote_name)?;

    // Get the fetch head
    let fetch_head = repo.find_reference("FETCH_HEAD")?;
    let fetch_commit = repo.reference_to_annotated_commit(&fetch_head)?;

    // Do merge analysis
    let (analysis, _preference) = repo.merge_analysis(&[&fetch_commit])?;

    if analysis.is_up_to_date() {
        return Ok(PullResult {
            fast_forward: false,
            conflicts: false,
            updated_files: 0,
        });
    }

    if analysis.is_fast_forward() {
        // Fast-forward merge
        let refname = format!("refs/heads/{}", branch_name);
        let mut reference = repo.find_reference(&refname)?;
        reference.set_target(fetch_commit.id(), "Fast-forward pull")?;
        repo.set_head(&refname)?;
        repo.checkout_head(Some(git2::build::CheckoutBuilder::default().force()))?;

        return Ok(PullResult {
            fast_forward: true,
            conflicts: false,
            updated_files: 1, // Simplified - actual count would require diff
        });
    }

    if analysis.is_normal() {
        // Normal merge
        repo.merge(&[&fetch_commit], None, None)?;

        // Check for conflicts
        let mut index = repo.index()?;
        if index.has_conflicts() {
            return Ok(PullResult {
                fast_forward: false,
                conflicts: true,
                updated_files: 0,
            });
        }

        // Create merge commit
        let signature = repo.signature()?;
        let head_commit = repo.head()?.peel_to_commit()?;
        let fetch_commit_obj = repo.find_commit(fetch_commit.id())?;
        let tree_id = index.write_tree()?;
        let tree = repo.find_tree(tree_id)?;

        let message = format!("Merge branch '{}' of {}", branch_name, remote_name);
        repo.commit(
            Some("HEAD"),
            &signature,
            &signature,
            &message,
            &tree,
            &[&head_commit, &fetch_commit_obj],
        )?;

        repo.cleanup_state()?;

        return Ok(PullResult {
            fast_forward: false,
            conflicts: false,
            updated_files: 1,
        });
    }

    Err(GitError::OperationFailed("Cannot pull: merge not possible".to_string()))
}

/// Push to remote
pub fn push(repo: &Repository, remote_name: &str, branch_name: &str) -> GitResult<PushResult> {
    let mut remote = repo.find_remote(remote_name)
        .map_err(|_| GitError::OperationFailed(format!("Remote '{}' not found", remote_name)))?;

    let callbacks = create_callbacks();
    let mut push_options = PushOptions::new();
    push_options.remote_callbacks(callbacks);

    let refspec = format!("refs/heads/{}:refs/heads/{}", branch_name, branch_name);

    remote.push(&[&refspec], Some(&mut push_options))?;

    Ok(PushResult {
        remote: remote_name.to_string(),
        pushed_refs: vec![branch_name.to_string()],
    })
}

/// Get the default remote for a branch (usually "origin")
pub fn get_default_remote(repo: &Repository) -> GitResult<String> {
    // Try to get the upstream remote for the current branch
    if let Ok(head) = repo.head() {
        if let Some(branch_name) = head.shorthand() {
            if let Ok(branch) = repo.find_branch(branch_name, git2::BranchType::Local) {
                if let Ok(upstream) = branch.upstream() {
                    if let Some(name) = upstream.name()? {
                        // Extract remote name from "origin/branch"
                        if let Some(remote_name) = name.split('/').next() {
                            return Ok(remote_name.to_string());
                        }
                    }
                }
            }
        }
    }

    // Fall back to "origin" if it exists
    if repo.find_remote("origin").is_ok() {
        return Ok("origin".to_string());
    }

    // Return first remote if any
    let remotes = repo.remotes()?;
    remotes.iter()
        .flatten()
        .next()
        .map(|s| s.to_string())
        .ok_or_else(|| GitError::OperationFailed("No remotes configured".to_string()))
}

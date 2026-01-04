use chrono::Utc;
use git2::{Oid, Repository};

use super::{CommitInfo, GitError, GitResult};

/// Creates a new commit with the staged changes
pub fn create_commit(repo: &Repository, message: &str) -> GitResult<CommitInfo> {
    let mut index = repo.index()?;
    let tree_oid = index.write_tree()?;
    let tree = repo.find_tree(tree_oid)?;

    let sig = repo.signature()?;

    let parent_commit = match repo.head() {
        Ok(head) => Some(head.peel_to_commit()?),
        Err(_) => None,
    };

    let parents: Vec<&git2::Commit> = parent_commit.iter().collect();

    let oid = repo.commit(
        Some("HEAD"),
        &sig,
        &sig,
        message,
        &tree,
        &parents,
    )?;

    let commit = repo.find_commit(oid)?;
    Ok(commit_to_info(&commit))
}

/// Gets the commit history
pub fn get_commit_history(repo: &Repository, limit: usize, skip: usize) -> GitResult<Vec<CommitInfo>> {
    let mut revwalk = repo.revwalk()?;
    revwalk.push_head()?;
    revwalk.set_sorting(git2::Sort::TIME)?;

    let commits: Vec<CommitInfo> = revwalk
        .skip(skip)
        .take(limit)
        .filter_map(|oid| oid.ok())
        .filter_map(|oid| repo.find_commit(oid).ok())
        .map(|commit| commit_to_info(&commit))
        .collect();

    Ok(commits)
}

/// Gets details for a specific commit
pub fn get_commit_detail(repo: &Repository, sha: &str) -> GitResult<CommitInfo> {
    let oid = Oid::from_str(sha).map_err(|_| GitError::CommitNotFound(sha.to_string()))?;
    let commit = repo.find_commit(oid).map_err(|_| GitError::CommitNotFound(sha.to_string()))?;
    Ok(commit_to_info(&commit))
}

/// Converts a git2::Commit to our CommitInfo struct
fn commit_to_info(commit: &git2::Commit) -> CommitInfo {
    let sha = commit.id().to_string();
    let short_sha = sha.chars().take(7).collect();

    let message = commit.message().unwrap_or("").to_string();
    let author = commit.author();
    let author_name = author.name().unwrap_or("Unknown").to_string();
    let email = author.email().unwrap_or("").to_string();

    let timestamp = commit.time().seconds();
    let date = format_relative_time(timestamp);

    let parents: Vec<String> = commit
        .parent_ids()
        .map(|oid| oid.to_string().chars().take(7).collect())
        .collect();

    CommitInfo {
        sha,
        short_sha,
        message,
        author: author_name,
        email,
        date,
        timestamp,
        parents,
    }
}

/// Cherry-picks a commit onto the current branch
pub fn cherry_pick_commit(repo: &Repository, sha: &str) -> GitResult<CommitInfo> {
    let oid = git2::Oid::from_str(sha).map_err(|_| GitError::CommitNotFound(sha.to_string()))?;
    let commit = repo.find_commit(oid).map_err(|_| GitError::CommitNotFound(sha.to_string()))?;

    // Perform the cherry-pick
    let mut cherrypick_opts = git2::CherrypickOptions::new();
    repo.cherrypick(&commit, Some(&mut cherrypick_opts))?;

    // Check for conflicts
    let index = repo.index()?;
    if index.has_conflicts() {
        return Err(GitError::MergeConflict);
    }

    // Create the commit
    let mut index = repo.index()?;
    let tree_oid = index.write_tree()?;
    let tree = repo.find_tree(tree_oid)?;

    let sig = repo.signature()?;
    let head = repo.head()?.peel_to_commit()?;

    let new_oid = repo.commit(
        Some("HEAD"),
        &sig,
        &commit.author(),
        commit.message().unwrap_or(""),
        &tree,
        &[&head],
    )?;

    // Clean up cherry-pick state
    repo.cleanup_state()?;

    let new_commit = repo.find_commit(new_oid)?;
    Ok(commit_to_info(&new_commit))
}

/// Reverts a commit by creating a new commit that undoes its changes
pub fn revert_commit(repo: &Repository, sha: &str) -> GitResult<CommitInfo> {
    let oid = git2::Oid::from_str(sha).map_err(|_| GitError::CommitNotFound(sha.to_string()))?;
    let commit = repo.find_commit(oid).map_err(|_| GitError::CommitNotFound(sha.to_string()))?;

    // Perform the revert
    let mut revert_opts = git2::RevertOptions::new();
    repo.revert(&commit, Some(&mut revert_opts))?;

    // Check for conflicts
    let index = repo.index()?;
    if index.has_conflicts() {
        return Err(GitError::MergeConflict);
    }

    // Create the revert commit
    let mut index = repo.index()?;
    let tree_oid = index.write_tree()?;
    let tree = repo.find_tree(tree_oid)?;

    let sig = repo.signature()?;
    let head = repo.head()?.peel_to_commit()?;

    let revert_message = format!("Revert \"{}\"\n\nThis reverts commit {}.",
        commit.message().unwrap_or("").lines().next().unwrap_or(""),
        sha
    );

    let new_oid = repo.commit(
        Some("HEAD"),
        &sig,
        &sig,
        &revert_message,
        &tree,
        &[&head],
    )?;

    // Clean up revert state
    repo.cleanup_state()?;

    let new_commit = repo.find_commit(new_oid)?;
    Ok(commit_to_info(&new_commit))
}

#[derive(Debug, Clone, Copy)]
pub enum ResetType {
    Soft,
    Mixed,
    Hard,
}

/// Resets the current branch to a specific commit
pub fn reset_to_commit(repo: &Repository, sha: &str, reset_type: ResetType) -> GitResult<()> {
    let oid = git2::Oid::from_str(sha).map_err(|_| GitError::CommitNotFound(sha.to_string()))?;
    let commit = repo.find_commit(oid).map_err(|_| GitError::CommitNotFound(sha.to_string()))?;
    let obj = commit.as_object();

    let git_reset_type = match reset_type {
        ResetType::Soft => git2::ResetType::Soft,
        ResetType::Mixed => git2::ResetType::Mixed,
        ResetType::Hard => git2::ResetType::Hard,
    };

    repo.reset(obj, git_reset_type, None)?;
    Ok(())
}

/// Checks out a specific commit (creates a detached HEAD)
pub fn checkout_commit(repo: &Repository, sha: &str) -> GitResult<()> {
    let oid = git2::Oid::from_str(sha).map_err(|_| GitError::CommitNotFound(sha.to_string()))?;
    let commit = repo.find_commit(oid).map_err(|_| GitError::CommitNotFound(sha.to_string()))?;
    let obj = commit.as_object();

    repo.set_head_detached(oid)?;
    repo.checkout_tree(obj, None)?;

    Ok(())
}

/// Creates a tag at a specific commit
pub fn create_tag(repo: &Repository, sha: &str, tag_name: &str, message: Option<&str>) -> GitResult<String> {
    let oid = git2::Oid::from_str(sha).map_err(|_| GitError::CommitNotFound(sha.to_string()))?;
    let commit = repo.find_commit(oid).map_err(|_| GitError::CommitNotFound(sha.to_string()))?;
    let obj = commit.as_object();

    let tag_oid = if let Some(msg) = message {
        // Annotated tag
        let sig = repo.signature()?;
        repo.tag(tag_name, obj, &sig, msg, false)?
    } else {
        // Lightweight tag
        repo.tag_lightweight(tag_name, obj, false)?
    };

    Ok(tag_oid.to_string())
}

/// Gets the diff for a specific commit
pub fn get_commit_diff(repo: &Repository, sha: &str) -> GitResult<Vec<super::FileDiff>> {
    let oid = git2::Oid::from_str(sha).map_err(|_| GitError::CommitNotFound(sha.to_string()))?;
    let commit = repo.find_commit(oid).map_err(|_| GitError::CommitNotFound(sha.to_string()))?;

    let tree = commit.tree()?;

    // Get parent tree (or empty tree for initial commit)
    let parent_tree = if commit.parent_count() > 0 {
        Some(commit.parent(0)?.tree()?)
    } else {
        None
    };

    let diff = repo.diff_tree_to_tree(parent_tree.as_ref(), Some(&tree), None)?;

    let mut file_diffs = Vec::new();

    for delta in diff.deltas() {
        let path = delta.new_file().path()
            .or_else(|| delta.old_file().path())
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();

        let old_path = if delta.status() == git2::Delta::Renamed {
            delta.old_file().path().map(|p| p.to_string_lossy().to_string())
        } else {
            None
        };

        let status = match delta.status() {
            git2::Delta::Added | git2::Delta::Untracked => super::FileStatusType::Added,
            git2::Delta::Deleted => super::FileStatusType::Deleted,
            git2::Delta::Modified => super::FileStatusType::Modified,
            git2::Delta::Renamed => super::FileStatusType::Renamed,
            git2::Delta::Conflicted => super::FileStatusType::Conflict,
            _ => super::FileStatusType::Modified,
        };

        let is_binary = delta.new_file().is_binary() || delta.old_file().is_binary();

        file_diffs.push(super::FileDiff {
            path,
            old_path,
            status,
            hunks: Vec::new(), // Hunks can be filled in if needed
            is_binary,
            additions: 0,
            deletions: 0,
        });
    }

    // Get stats
    let stats = diff.stats()?;
    if !file_diffs.is_empty() {
        // Distribute stats (simplified)
        let total_files = file_diffs.len();
        let additions_per_file = stats.insertions() / total_files;
        let deletions_per_file = stats.deletions() / total_files;

        for fd in &mut file_diffs {
            fd.additions = additions_per_file as u32;
            fd.deletions = deletions_per_file as u32;
        }
    }

    Ok(file_diffs)
}

/// Formats a Unix timestamp as a relative time string
fn format_relative_time(timestamp: i64) -> String {
    let now = Utc::now().timestamp();
    let diff = now - timestamp;

    if diff < 60 {
        "just now".to_string()
    } else if diff < 3600 {
        let minutes = diff / 60;
        if minutes == 1 {
            "1 minute ago".to_string()
        } else {
            format!("{} minutes ago", minutes)
        }
    } else if diff < 86400 {
        let hours = diff / 3600;
        if hours == 1 {
            "1 hour ago".to_string()
        } else {
            format!("{} hours ago", hours)
        }
    } else if diff < 604800 {
        let days = diff / 86400;
        if days == 1 {
            "1 day ago".to_string()
        } else {
            format!("{} days ago", days)
        }
    } else if diff < 2629746 {
        let weeks = diff / 604800;
        if weeks == 1 {
            "1 week ago".to_string()
        } else {
            format!("{} weeks ago", weeks)
        }
    } else if diff < 31556952 {
        let months = diff / 2629746;
        if months == 1 {
            "1 month ago".to_string()
        } else {
            format!("{} months ago", months)
        }
    } else {
        let years = diff / 31556952;
        if years == 1 {
            "1 year ago".to_string()
        } else {
            format!("{} years ago", years)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_relative_time() {
        let now = Utc::now().timestamp();

        assert_eq!(format_relative_time(now), "just now");
        assert_eq!(format_relative_time(now - 120), "2 minutes ago");
        assert_eq!(format_relative_time(now - 7200), "2 hours ago");
        assert_eq!(format_relative_time(now - 172800), "2 days ago");
    }
}

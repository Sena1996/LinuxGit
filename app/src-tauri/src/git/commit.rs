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

use git2::Repository;
use std::path::Path;

use super::{GitError, GitResult, RepoInfo};

/// Opens an existing Git repository at the given path
pub fn open_repo(path: &str) -> GitResult<Repository> {
    let path = Path::new(path);

    if !path.exists() {
        return Err(GitError::RepoNotFound(path.display().to_string()));
    }

    Repository::open(path).map_err(|e| {
        if e.code() == git2::ErrorCode::NotFound {
            GitError::NotARepo(path.display().to_string())
        } else {
            GitError::Git2(e)
        }
    })
}

/// Initializes a new Git repository at the given path
pub fn init_repo(path: &str) -> GitResult<Repository> {
    let path = Path::new(path);
    Repository::init(path).map_err(GitError::Git2)
}

/// Gets information about the repository
pub fn get_repo_info(repo: &Repository) -> GitResult<RepoInfo> {
    let path = repo
        .workdir()
        .or_else(|| repo.path().parent())
        .map(|p| p.display().to_string())
        .unwrap_or_default();

    let name = Path::new(&path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "Unknown".to_string());

    let is_bare = repo.is_bare();

    let (head_branch, head_sha, is_detached) = match repo.head() {
        Ok(head) => {
            let sha = head.target().map(|oid| oid.to_string());
            if head.is_branch() {
                let branch_name = head
                    .shorthand()
                    .map(|s| s.to_string());
                (branch_name, sha, false)
            } else {
                (None, sha, true)
            }
        }
        Err(_) => (None, None, false),
    };

    Ok(RepoInfo {
        path,
        name,
        is_bare,
        head_branch,
        head_sha,
        is_detached,
    })
}

/// Validates that a path contains a valid Git repository
pub fn validate_repo(path: &str) -> bool {
    Repository::open(path).is_ok()
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_init_and_open_repo() {
        let dir = tempdir().unwrap();
        let path = dir.path().to_str().unwrap();

        // Init should succeed
        let repo = init_repo(path).unwrap();
        assert!(!repo.is_bare());

        // Open should succeed
        let repo2 = open_repo(path).unwrap();
        assert!(!repo2.is_bare());
    }

    #[test]
    fn test_open_nonexistent() {
        let result = open_repo("/nonexistent/path");
        assert!(matches!(result, Err(GitError::RepoNotFound(_))));
    }
}

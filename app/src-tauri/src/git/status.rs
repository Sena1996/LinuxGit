use git2::{Repository, StatusOptions};

use super::{FileStatus, FileStatusType, GitResult, StatusInfo};

/// Gets the current status of the repository
pub fn get_repo_status(repo: &Repository) -> GitResult<StatusInfo> {
    let mut opts = StatusOptions::new();
    opts.include_untracked(true)
        .recurse_untracked_dirs(true)
        .include_ignored(false)
        .include_unmodified(false);

    let statuses = repo.statuses(Some(&mut opts))?;

    let mut staged = Vec::new();
    let mut unstaged = Vec::new();
    let mut untracked = Vec::new();
    let mut conflicts = Vec::new();

    for entry in statuses.iter() {
        let path = entry.path().unwrap_or("").to_string();
        let status = entry.status();

        // Check for conflicts first
        if status.is_conflicted() {
            conflicts.push(FileStatus {
                path: path.clone(),
                status: FileStatusType::Conflict,
                staged: false,
                old_path: None,
            });
            continue;
        }

        // Check staged changes (index)
        if status.is_index_new() {
            staged.push(FileStatus {
                path: path.clone(),
                status: FileStatusType::Added,
                staged: true,
                old_path: None,
            });
        } else if status.is_index_modified() {
            staged.push(FileStatus {
                path: path.clone(),
                status: FileStatusType::Modified,
                staged: true,
                old_path: None,
            });
        } else if status.is_index_deleted() {
            staged.push(FileStatus {
                path: path.clone(),
                status: FileStatusType::Deleted,
                staged: true,
                old_path: None,
            });
        } else if status.is_index_renamed() {
            staged.push(FileStatus {
                path: path.clone(),
                status: FileStatusType::Renamed,
                staged: true,
                old_path: entry.head_to_index().and_then(|d| d.old_file().path()).map(|p| p.to_string_lossy().to_string()),
            });
        }

        // Check worktree changes (unstaged)
        if status.is_wt_new() {
            untracked.push(FileStatus {
                path: path.clone(),
                status: FileStatusType::Untracked,
                staged: false,
                old_path: None,
            });
        } else if status.is_wt_modified() {
            unstaged.push(FileStatus {
                path: path.clone(),
                status: FileStatusType::Modified,
                staged: false,
                old_path: None,
            });
        } else if status.is_wt_deleted() {
            unstaged.push(FileStatus {
                path: path.clone(),
                status: FileStatusType::Deleted,
                staged: false,
                old_path: None,
            });
        } else if status.is_wt_renamed() {
            unstaged.push(FileStatus {
                path: path.clone(),
                status: FileStatusType::Renamed,
                staged: false,
                old_path: entry.index_to_workdir().and_then(|d| d.old_file().path()).map(|p| p.to_string_lossy().to_string()),
            });
        }
    }

    Ok(StatusInfo {
        staged,
        unstaged,
        untracked,
        conflicts,
    })
}

/// Stages files for commit
pub fn stage_files(repo: &Repository, paths: &[String]) -> GitResult<()> {
    let mut index = repo.index()?;

    for path in paths {
        index.add_path(std::path::Path::new(path))?;
    }

    index.write()?;
    Ok(())
}

/// Unstages files from the index
pub fn unstage_files(repo: &Repository, paths: &[String]) -> GitResult<()> {
    let head = repo.head()?.peel_to_commit()?;
    let head_tree = head.tree()?;
    let head_object = head.into_object();

    for path in paths {
        let path = std::path::Path::new(path);

        // Check if file exists in HEAD
        if head_tree.get_path(path).is_ok() {
            // File exists in HEAD, reset to HEAD version
            repo.reset_default(Some(&head_object), [path])?;
        } else {
            // File doesn't exist in HEAD (new file), remove from index
            let mut index = repo.index()?;
            index.remove_path(path)?;
            index.write()?;
        }
    }

    Ok(())
}

/// Discards changes in the working directory
pub fn discard_changes(repo: &Repository, paths: &[String]) -> GitResult<()> {
    let mut checkout_builder = git2::build::CheckoutBuilder::new();
    checkout_builder.force();

    for path in paths {
        checkout_builder.path(path);
    }

    repo.checkout_head(Some(&mut checkout_builder))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn test_get_status_empty_repo() {
        let dir = tempdir().unwrap();
        let repo = Repository::init(dir.path()).unwrap();

        let status = get_repo_status(&repo).unwrap();
        assert!(status.staged.is_empty());
        assert!(status.unstaged.is_empty());
        assert!(status.untracked.is_empty());
    }

    #[test]
    fn test_stage_and_unstage() {
        let dir = tempdir().unwrap();
        let repo = Repository::init(dir.path()).unwrap();

        // Create a file
        fs::write(dir.path().join("test.txt"), "hello").unwrap();

        // Stage it
        stage_files(&repo, &["test.txt".to_string()]).unwrap();

        let status = get_repo_status(&repo).unwrap();
        assert_eq!(status.staged.len(), 1);
    }
}

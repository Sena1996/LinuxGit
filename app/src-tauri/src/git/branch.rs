use git2::{BranchType, Repository};

use super::{BranchInfo, GitError, GitResult};

/// Gets all branches (local and remote)
pub fn get_branches(repo: &Repository) -> GitResult<Vec<BranchInfo>> {
    let mut branches = Vec::new();

    // Get current branch name
    let current_branch = repo
        .head()
        .ok()
        .and_then(|h| h.shorthand().map(|s| s.to_string()));

    // Local branches
    for branch_result in repo.branches(Some(BranchType::Local))? {
        let (branch, _branch_type) = branch_result?;
        let name = branch
            .name()?
            .unwrap_or("unknown")
            .to_string();

        let is_current = current_branch.as_ref() == Some(&name);

        let (upstream, ahead, behind) = get_tracking_info(&branch);

        branches.push(BranchInfo {
            name,
            is_remote: false,
            is_current,
            upstream,
            ahead,
            behind,
        });
    }

    // Remote branches
    for branch_result in repo.branches(Some(BranchType::Remote))? {
        let (branch, _branch_type) = branch_result?;
        let name = branch
            .name()?
            .unwrap_or("unknown")
            .to_string();

        branches.push(BranchInfo {
            name,
            is_remote: true,
            is_current: false,
            upstream: None,
            ahead: 0,
            behind: 0,
        });
    }

    Ok(branches)
}

/// Gets tracking information for a branch
fn get_tracking_info(branch: &git2::Branch) -> (Option<String>, u32, u32) {
    let upstream = branch
        .upstream()
        .ok()
        .and_then(|u| u.name().ok().flatten().map(|s| s.to_string()));

    // Get ahead/behind counts
    if let (Some(local_oid), Ok(upstream_branch)) = (
        branch.get().target(),
        branch.upstream(),
    ) {
        if let Some(upstream_oid) = upstream_branch.get().target() {
            if let Ok(repo) = git2::Repository::open_from_env() {
                if let Ok((ahead, behind)) = repo.graph_ahead_behind(local_oid, upstream_oid) {
                    return (upstream.clone(), ahead as u32, behind as u32);
                }
            }
        }
    }

    (upstream, 0, 0)
}

/// Creates a new branch from HEAD or a specific commit
pub fn create_branch(repo: &Repository, name: &str, from_sha: Option<&str>) -> GitResult<BranchInfo> {
    let commit = match from_sha {
        Some(sha) => {
            let oid = git2::Oid::from_str(sha)
                .map_err(|_| GitError::CommitNotFound(sha.to_string()))?;
            repo.find_commit(oid)
                .map_err(|_| GitError::CommitNotFound(sha.to_string()))?
        }
        None => repo.head()?.peel_to_commit()?,
    };

    let branch = repo.branch(name, &commit, false)?;
    let branch_name = branch.name()?.unwrap_or(name).to_string();

    Ok(BranchInfo {
        name: branch_name,
        is_remote: false,
        is_current: false,
        upstream: None,
        ahead: 0,
        behind: 0,
    })
}

/// Checks out a branch
pub fn checkout_branch(repo: &Repository, name: &str) -> GitResult<()> {
    let branch = repo
        .find_branch(name, BranchType::Local)
        .map_err(|_| GitError::BranchNotFound(name.to_string()))?;

    let reference = branch.into_reference();
    let tree = reference.peel_to_tree()?;

    repo.checkout_tree(tree.as_object(), None)?;
    repo.set_head(reference.name().unwrap_or(""))?;

    Ok(())
}

/// Deletes a local branch
pub fn delete_branch(repo: &Repository, name: &str, force: bool) -> GitResult<()> {
    // Can't delete current branch
    if let Ok(head) = repo.head() {
        if head.shorthand() == Some(name) {
            return Err(GitError::OperationFailed(
                "Cannot delete the current branch".to_string(),
            ));
        }
    }

    let mut branch = repo
        .find_branch(name, BranchType::Local)
        .map_err(|_| GitError::BranchNotFound(name.to_string()))?;

    // Check if branch is fully merged (unless force)
    if !force {
        if !branch.is_head() {
            // Basic check: is branch merged into HEAD?
            if let (Ok(head), Ok(branch_commit)) = (
                repo.head().and_then(|h| h.peel_to_commit()),
                branch.get().peel_to_commit(),
            ) {
                if repo.merge_base(head.id(), branch_commit.id()).is_err() {
                    return Err(GitError::OperationFailed(
                        format!("Branch '{}' is not fully merged. Use force to delete.", name),
                    ));
                }
            }
        }
    }

    branch.delete()?;
    Ok(())
}

/// Merges a branch into the current branch
pub fn merge_branch(repo: &Repository, name: &str) -> GitResult<()> {
    let branch = repo
        .find_branch(name, BranchType::Local)
        .map_err(|_| GitError::BranchNotFound(name.to_string()))?;

    let branch_ref = branch.into_reference();
    let annotated_commit = repo.reference_to_annotated_commit(&branch_ref)?;

    let (analysis, _) = repo.merge_analysis(&[&annotated_commit])?;

    if analysis.is_up_to_date() {
        return Ok(()); // Already up to date
    }

    if analysis.is_fast_forward() {
        // Fast-forward merge
        let target_oid = annotated_commit.id();
        let target_commit = repo.find_commit(target_oid)?;

        repo.checkout_tree(target_commit.tree()?.as_object(), None)?;

        let mut head_ref = repo.head()?;
        head_ref.set_target(target_oid, "Fast-forward merge")?;

        return Ok(());
    }

    if analysis.is_normal() {
        // Normal merge
        repo.merge(&[&annotated_commit], None, None)?;

        // Check for conflicts
        let mut index = repo.index()?;
        if index.has_conflicts() {
            return Err(GitError::MergeConflict);
        }

        // Create merge commit
        let tree_oid = index.write_tree()?;
        let tree = repo.find_tree(tree_oid)?;
        let sig = repo.signature()?;
        let head_commit = repo.head()?.peel_to_commit()?;
        let merge_commit = repo.find_commit(annotated_commit.id())?;

        repo.commit(
            Some("HEAD"),
            &sig,
            &sig,
            &format!("Merge branch '{}'", name),
            &tree,
            &[&head_commit, &merge_commit],
        )?;

        repo.cleanup_state()?;
        return Ok(());
    }

    Err(GitError::OperationFailed("Merge failed".to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn test_create_branch() {
        let dir = tempdir().unwrap();
        let repo = Repository::init(dir.path()).unwrap();

        // Need at least one commit
        fs::write(dir.path().join("test.txt"), "hello").unwrap();
        let mut index = repo.index().unwrap();
        index.add_path(std::path::Path::new("test.txt")).unwrap();
        index.write().unwrap();

        let tree_oid = index.write_tree().unwrap();
        let tree = repo.find_tree(tree_oid).unwrap();
        let sig = git2::Signature::now("Test", "test@test.com").unwrap();
        repo.commit(Some("HEAD"), &sig, &sig, "Initial commit", &tree, &[]).unwrap();

        // Now create a branch
        let branch = create_branch(&repo, "test-branch", None).unwrap();
        assert_eq!(branch.name, "test-branch");
        assert!(!branch.is_remote);
    }
}

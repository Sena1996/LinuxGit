use git2::{DiffOptions, Repository};

use super::{DiffHunk, DiffLine, DiffLineType, FileDiff, FileStatusType, GitResult};

/// Gets the diff for a specific file
pub fn get_file_diff(repo: &Repository, path: &str, staged: bool) -> GitResult<FileDiff> {
    let mut diff_opts = DiffOptions::new();
    diff_opts.pathspec(path);
    diff_opts.context_lines(3);

    let diff = if staged {
        // Staged changes: compare HEAD to index
        let head_tree = repo.head().ok().and_then(|h| h.peel_to_tree().ok());
        repo.diff_tree_to_index(head_tree.as_ref(), None, Some(&mut diff_opts))?
    } else {
        // Unstaged changes: compare index to workdir
        repo.diff_index_to_workdir(None, Some(&mut diff_opts))?
    };

    let mut file_diff = FileDiff {
        path: path.to_string(),
        old_path: None,
        status: FileStatusType::Modified,
        hunks: Vec::new(),
        is_binary: false,
        additions: 0,
        deletions: 0,
    };

    // Process the diff
    diff.foreach(
        &mut |delta, _| {
            // File callback
            file_diff.is_binary = delta.flags().is_binary();

            file_diff.status = match delta.status() {
                git2::Delta::Added | git2::Delta::Untracked => FileStatusType::Added,
                git2::Delta::Deleted => FileStatusType::Deleted,
                git2::Delta::Modified => FileStatusType::Modified,
                git2::Delta::Renamed | git2::Delta::Copied => FileStatusType::Renamed,
                _ => FileStatusType::Modified,
            };

            if let Some(old_file) = delta.old_file().path() {
                if old_file.to_string_lossy() != path {
                    file_diff.old_path = Some(old_file.to_string_lossy().to_string());
                }
            }

            true
        },
        None, // Binary callback
        Some(&mut |_delta, hunk| {
            // Hunk callback
            file_diff.hunks.push(DiffHunk {
                header: String::from_utf8_lossy(hunk.header()).to_string(),
                old_start: hunk.old_start(),
                old_lines: hunk.old_lines(),
                new_start: hunk.new_start(),
                new_lines: hunk.new_lines(),
                lines: Vec::new(),
            });
            true
        }),
        Some(&mut |_delta, _hunk, line| {
            // Line callback
            if let Some(current_hunk) = file_diff.hunks.last_mut() {
                let line_type = match line.origin() {
                    '+' => {
                        file_diff.additions += 1;
                        DiffLineType::Addition
                    }
                    '-' => {
                        file_diff.deletions += 1;
                        DiffLineType::Deletion
                    }
                    ' ' => DiffLineType::Context,
                    _ => DiffLineType::Header,
                };

                let content = String::from_utf8_lossy(line.content()).to_string();

                current_hunk.lines.push(DiffLine {
                    line_type,
                    content,
                    old_line: line.old_lineno(),
                    new_line: line.new_lineno(),
                });
            }
            true
        }),
    )?;

    Ok(file_diff)
}

/// Gets the full diff text for staged changes (for AI commit message generation)
pub fn get_staged_diff_text(repo: &Repository) -> GitResult<String> {
    let head_tree = repo.head().ok().and_then(|h| h.peel_to_tree().ok());
    let diff = repo.diff_tree_to_index(head_tree.as_ref(), None, None)?;

    let mut diff_text = String::new();

    diff.print(git2::DiffFormat::Patch, |_delta, _hunk, line| {
        let prefix = match line.origin() {
            '+' => "+",
            '-' => "-",
            ' ' => " ",
            'F' => "", // File header
            'H' => "", // Hunk header
            _ => "",
        };

        let content = String::from_utf8_lossy(line.content());
        diff_text.push_str(&format!("{}{}", prefix, content));

        true
    })?;

    Ok(diff_text)
}

/// Gets diff statistics for staged changes
pub fn get_staged_diff_stats(repo: &Repository) -> GitResult<(u32, u32, u32)> {
    let head_tree = repo.head().ok().and_then(|h| h.peel_to_tree().ok());
    let diff = repo.diff_tree_to_index(head_tree.as_ref(), None, None)?;

    let stats = diff.stats()?;

    Ok((
        stats.files_changed(),
        stats.insertions(),
        stats.deletions(),
    ))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn test_get_file_diff() {
        let dir = tempdir().unwrap();
        let repo = Repository::init(dir.path()).unwrap();

        // Create initial commit
        let file_path = dir.path().join("test.txt");
        fs::write(&file_path, "line1\nline2\n").unwrap();

        let mut index = repo.index().unwrap();
        index.add_path(std::path::Path::new("test.txt")).unwrap();
        index.write().unwrap();

        let tree_oid = index.write_tree().unwrap();
        let tree = repo.find_tree(tree_oid).unwrap();
        let sig = git2::Signature::now("Test", "test@test.com").unwrap();
        repo.commit(Some("HEAD"), &sig, &sig, "Initial", &tree, &[]).unwrap();

        // Modify file
        fs::write(&file_path, "line1\nmodified\nline3\n").unwrap();

        // Get unstaged diff
        let diff = get_file_diff(&repo, "test.txt", false).unwrap();
        assert!(!diff.is_binary);
        assert!(diff.additions > 0 || diff.deletions > 0);
    }
}

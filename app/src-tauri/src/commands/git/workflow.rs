use std::fs;
use std::path::Path;
use walkdir::{DirEntry, WalkDir};

fn is_hidden_or_excluded(entry: &DirEntry) -> bool {
    let name = entry.file_name().to_string_lossy();
    name.starts_with('.')
        || name == "node_modules"
        || name == "target"
        || name == "dist"
        || name == "build"
        || name == "__pycache__"
}

/// List files in a repository up to a certain depth
/// Used for project type detection (package.json, Cargo.toml, etc.)
#[tauri::command]
pub fn list_repository_files(repo_path: String, max_depth: Option<usize>) -> Result<Vec<String>, String> {
    let path = Path::new(&repo_path);
    if !path.exists() {
        return Err("Repository path does not exist".to_string());
    }

    let depth = max_depth.unwrap_or(2);
    let mut files = Vec::new();

    let walker = WalkDir::new(path)
        .max_depth(depth)
        .into_iter()
        .filter_entry(|e| !is_hidden_or_excluded(e));

    for entry in walker.filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            if let Ok(relative) = entry.path().strip_prefix(path) {
                files.push(relative.to_string_lossy().to_string());
            }
        }
    }

    Ok(files)
}

/// List workflow files in .github/workflows directory
#[tauri::command]
pub fn list_workflow_files(repo_path: String) -> Result<Vec<String>, String> {
    let workflows_dir = Path::new(&repo_path).join(".github").join("workflows");

    if !workflows_dir.exists() {
        return Ok(Vec::new());
    }

    let mut workflows = Vec::new();

    if let Ok(entries) = fs::read_dir(&workflows_dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if let Some(ext) = path.extension() {
                if ext == "yml" || ext == "yaml" {
                    if let Some(name) = path.file_name() {
                        workflows.push(name.to_string_lossy().to_string());
                    }
                }
            }
        }
    }

    Ok(workflows)
}

/// Create a workflow file in .github/workflows directory
#[tauri::command]
pub fn create_workflow_file(
    repo_path: String,
    workflow_path: String,
    content: String,
) -> Result<(), String> {
    let full_path = Path::new(&repo_path).join(&workflow_path);

    // Create parent directories if they don't exist
    if let Some(parent) = full_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directories: {}", e))?;
    }

    // Write the workflow file
    fs::write(&full_path, content)
        .map_err(|e| format!("Failed to write workflow file: {}", e))?;

    Ok(())
}

/// Read a workflow file
#[tauri::command]
pub fn read_workflow_file(repo_path: String, workflow_name: String) -> Result<String, String> {
    let workflow_path = Path::new(&repo_path)
        .join(".github")
        .join("workflows")
        .join(&workflow_name);

    fs::read_to_string(&workflow_path)
        .map_err(|e| format!("Failed to read workflow file: {}", e))
}

/// Delete a workflow file
#[tauri::command]
pub fn delete_workflow_file(repo_path: String, workflow_name: String) -> Result<(), String> {
    let workflow_path = Path::new(&repo_path)
        .join(".github")
        .join("workflows")
        .join(&workflow_name);

    if !workflow_path.exists() {
        return Err("Workflow file does not exist".to_string());
    }

    fs::remove_file(&workflow_path)
        .map_err(|e| format!("Failed to delete workflow file: {}", e))
}

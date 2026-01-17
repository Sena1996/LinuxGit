use crate::github::actions::{Workflow, WorkflowRun, WorkflowJob, Artifact};

#[tauri::command]
pub async fn github_list_workflows(owner: String, repo: String) -> Result<Vec<Workflow>, String> {
    crate::github::actions::list_workflows(&owner, &repo)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_list_workflow_runs(
    owner: String,
    repo: String,
    workflow_id: Option<i64>,
    branch: Option<String>,
    status: Option<String>,
    per_page: Option<u32>,
) -> Result<Vec<WorkflowRun>, String> {
    crate::github::actions::list_workflow_runs(
        &owner,
        &repo,
        workflow_id,
        branch.as_deref(),
        status.as_deref(),
        per_page,
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_workflow_run(
    owner: String,
    repo: String,
    run_id: i64,
) -> Result<WorkflowRun, String> {
    crate::github::actions::get_workflow_run(&owner, &repo, run_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_workflow_run_jobs(
    owner: String,
    repo: String,
    run_id: i64,
) -> Result<Vec<WorkflowJob>, String> {
    crate::github::actions::get_workflow_run_jobs(&owner, &repo, run_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_workflow_run_logs(
    owner: String,
    repo: String,
    run_id: i64,
) -> Result<String, String> {
    crate::github::actions::get_workflow_run_logs(&owner, &repo, run_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_trigger_workflow(
    owner: String,
    repo: String,
    workflow_id: i64,
    ref_name: String,
    inputs: Option<serde_json::Value>,
) -> Result<(), String> {
    crate::github::actions::trigger_workflow(&owner, &repo, workflow_id, &ref_name, inputs)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_cancel_workflow_run(
    owner: String,
    repo: String,
    run_id: i64,
) -> Result<(), String> {
    crate::github::actions::cancel_workflow_run(&owner, &repo, run_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_rerun_workflow(
    owner: String,
    repo: String,
    run_id: i64,
) -> Result<(), String> {
    crate::github::actions::rerun_workflow(&owner, &repo, run_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_rerun_failed_jobs(
    owner: String,
    repo: String,
    run_id: i64,
) -> Result<(), String> {
    crate::github::actions::rerun_failed_jobs(&owner, &repo, run_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_list_run_artifacts(
    owner: String,
    repo: String,
    run_id: i64,
) -> Result<Vec<Artifact>, String> {
    crate::github::actions::list_run_artifacts(&owner, &repo, run_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_list_repo_artifacts(owner: String, repo: String) -> Result<Vec<Artifact>, String> {
    crate::github::actions::list_repo_artifacts(&owner, &repo)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_artifact_download_url(
    owner: String,
    repo: String,
    artifact_id: i64,
) -> Result<String, String> {
    crate::github::actions::get_artifact_download_url(&owner, &repo, artifact_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_delete_artifact(
    owner: String,
    repo: String,
    artifact_id: i64,
) -> Result<(), String> {
    crate::github::actions::delete_artifact(&owner, &repo, artifact_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_delete_workflow_run(
    owner: String,
    repo: String,
    run_id: i64,
) -> Result<(), String> {
    crate::github::actions::delete_workflow_run(&owner, &repo, run_id)
        .await
        .map_err(|e| e.to_string())
}

use crate::github::deployments::{
    Deployment, DeploymentStatus, DeploymentSummary,
    CreateDeploymentRequest, CreateDeploymentStatusRequest,
};

#[tauri::command]
pub async fn github_list_deployments(
    owner: String,
    repo: String,
    environment: Option<String>,
    per_page: Option<u32>,
    page: Option<u32>,
) -> Result<Vec<Deployment>, String> {
    crate::github::deployments::list_deployments(
        &owner,
        &repo,
        environment.as_deref(),
        per_page,
        page,
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_deployment(
    owner: String,
    repo: String,
    deployment_id: i64,
) -> Result<Deployment, String> {
    crate::github::deployments::get_deployment(&owner, &repo, deployment_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_create_deployment(
    owner: String,
    repo: String,
    ref_name: String,
    environment: String,
    description: Option<String>,
    auto_merge: Option<bool>,
    required_contexts: Option<Vec<String>>,
    transient_environment: Option<bool>,
    production_environment: Option<bool>,
) -> Result<Deployment, String> {
    let request = CreateDeploymentRequest {
        ref_name,
        environment,
        description,
        auto_merge,
        required_contexts,
        transient_environment,
        production_environment,
    };
    crate::github::deployments::create_deployment(&owner, &repo, request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_delete_deployment(
    owner: String,
    repo: String,
    deployment_id: i64,
) -> Result<(), String> {
    crate::github::deployments::delete_deployment(&owner, &repo, deployment_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_list_deployment_statuses(
    owner: String,
    repo: String,
    deployment_id: i64,
    per_page: Option<u32>,
) -> Result<Vec<DeploymentStatus>, String> {
    crate::github::deployments::list_deployment_statuses(&owner, &repo, deployment_id, per_page)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_create_deployment_status(
    owner: String,
    repo: String,
    deployment_id: i64,
    state: String,
    description: Option<String>,
    environment_url: Option<String>,
    log_url: Option<String>,
    auto_inactive: Option<bool>,
) -> Result<DeploymentStatus, String> {
    let request = CreateDeploymentStatusRequest {
        state,
        description,
        environment_url,
        log_url,
        auto_inactive,
    };
    crate::github::deployments::create_deployment_status(&owner, &repo, deployment_id, request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_deployment_summary(
    owner: String,
    repo: String,
) -> Result<DeploymentSummary, String> {
    crate::github::deployments::get_deployment_summary(&owner, &repo)
        .await
        .map_err(|e| e.to_string())
}

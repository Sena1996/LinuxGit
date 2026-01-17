use crate::github::environments::{
    Environment, EnvironmentsResponse, CreateEnvironmentRequest,
    EnvironmentSecretsResponse, EnvironmentVariablesResponse,
    BranchPolicy, BranchPoliciesResponse, ReviewerRequest, DeploymentBranchPolicy,
};

#[tauri::command]
pub async fn github_list_environments(
    owner: String,
    repo: String,
    per_page: Option<u32>,
    page: Option<u32>,
) -> Result<EnvironmentsResponse, String> {
    crate::github::environments::list_environments(&owner, &repo, per_page, page)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_environment(
    owner: String,
    repo: String,
    environment_name: String,
) -> Result<Environment, String> {
    crate::github::environments::get_environment(&owner, &repo, &environment_name)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_create_environment(
    owner: String,
    repo: String,
    environment_name: String,
    wait_timer: Option<i32>,
    prevent_self_review: Option<bool>,
    reviewers: Option<Vec<ReviewerRequest>>,
    protected_branches: Option<bool>,
    custom_branch_policies: Option<bool>,
) -> Result<Environment, String> {
    let deployment_branch_policy = if protected_branches.is_some() || custom_branch_policies.is_some() {
        Some(DeploymentBranchPolicy {
            protected_branches: protected_branches.unwrap_or(false),
            custom_branch_policies: custom_branch_policies.unwrap_or(false),
        })
    } else {
        None
    };

    let request = if wait_timer.is_some() || prevent_self_review.is_some() || reviewers.is_some() || deployment_branch_policy.is_some() {
        Some(CreateEnvironmentRequest {
            wait_timer,
            prevent_self_review,
            reviewers,
            deployment_branch_policy,
        })
    } else {
        None
    };

    crate::github::environments::create_or_update_environment(&owner, &repo, &environment_name, request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_update_environment(
    owner: String,
    repo: String,
    environment_name: String,
    wait_timer: Option<i32>,
    prevent_self_review: Option<bool>,
    reviewers: Option<Vec<ReviewerRequest>>,
    protected_branches: Option<bool>,
    custom_branch_policies: Option<bool>,
) -> Result<Environment, String> {
    let deployment_branch_policy = if protected_branches.is_some() || custom_branch_policies.is_some() {
        Some(DeploymentBranchPolicy {
            protected_branches: protected_branches.unwrap_or(false),
            custom_branch_policies: custom_branch_policies.unwrap_or(false),
        })
    } else {
        None
    };

    let request = Some(CreateEnvironmentRequest {
        wait_timer,
        prevent_self_review,
        reviewers,
        deployment_branch_policy,
    });

    crate::github::environments::create_or_update_environment(&owner, &repo, &environment_name, request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_delete_environment(
    owner: String,
    repo: String,
    environment_name: String,
) -> Result<(), String> {
    crate::github::environments::delete_environment(&owner, &repo, &environment_name)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_list_environment_secrets(
    owner: String,
    repo: String,
    environment_name: String,
) -> Result<EnvironmentSecretsResponse, String> {
    crate::github::environments::list_environment_secrets(&owner, &repo, &environment_name)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_list_environment_variables(
    owner: String,
    repo: String,
    environment_name: String,
) -> Result<EnvironmentVariablesResponse, String> {
    crate::github::environments::list_environment_variables(&owner, &repo, &environment_name)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_list_branch_policies(
    owner: String,
    repo: String,
    environment_name: String,
) -> Result<BranchPoliciesResponse, String> {
    crate::github::environments::list_deployment_branch_policies(&owner, &repo, &environment_name)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_create_branch_policy(
    owner: String,
    repo: String,
    environment_name: String,
    name: String,
    policy_type: Option<String>,
) -> Result<BranchPolicy, String> {
    crate::github::environments::create_deployment_branch_policy(
        &owner,
        &repo,
        &environment_name,
        &name,
        policy_type.as_deref(),
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_delete_branch_policy(
    owner: String,
    repo: String,
    environment_name: String,
    branch_policy_id: i64,
) -> Result<(), String> {
    crate::github::environments::delete_deployment_branch_policy(
        &owner,
        &repo,
        &environment_name,
        branch_policy_id,
    )
    .await
    .map_err(|e| e.to_string())
}

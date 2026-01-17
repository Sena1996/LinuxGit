use crate::github::pages::{PagesInfo, PagesBuild, DeploymentStatus};

#[tauri::command]
pub async fn github_get_pages_info(owner: String, repo: String) -> Result<PagesInfo, String> {
    crate::github::pages::get_pages_info(&owner, &repo)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_enable_pages(
    owner: String,
    repo: String,
    branch: String,
    path: String,
) -> Result<PagesInfo, String> {
    crate::github::pages::enable_pages(&owner, &repo, &branch, &path)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_update_pages(
    owner: String,
    repo: String,
    cname: Option<String>,
    https_enforced: Option<bool>,
    build_type: Option<String>,
    source_branch: Option<String>,
    source_path: Option<String>,
) -> Result<(), String> {
    crate::github::pages::update_pages(
        &owner,
        &repo,
        cname.as_deref(),
        https_enforced,
        build_type.as_deref(),
        source_branch.as_deref(),
        source_path.as_deref(),
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_disable_pages(owner: String, repo: String) -> Result<(), String> {
    crate::github::pages::disable_pages(&owner, &repo)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_list_pages_builds(
    owner: String,
    repo: String,
    per_page: Option<u32>,
    page: Option<u32>,
) -> Result<Vec<PagesBuild>, String> {
    crate::github::pages::list_pages_builds(&owner, &repo, per_page, page)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_latest_pages_build(owner: String, repo: String) -> Result<PagesBuild, String> {
    crate::github::pages::get_latest_pages_build(&owner, &repo)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_request_pages_build(owner: String, repo: String) -> Result<PagesBuild, String> {
    crate::github::pages::request_pages_build(&owner, &repo)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_deployment_status(
    owner: String,
    repo: String,
    deployment_id: i64,
) -> Result<DeploymentStatus, String> {
    crate::github::pages::get_deployment_status(&owner, &repo, deployment_id)
        .await
        .map_err(|e| e.to_string())
}

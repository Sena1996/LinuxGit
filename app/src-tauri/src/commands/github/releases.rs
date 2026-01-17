use crate::github::releases::{Release, ReleaseAsset, Tag, CreateReleaseRequest, UpdateReleaseRequest};

#[tauri::command]
pub async fn github_list_releases(
    owner: String,
    repo: String,
    per_page: Option<u32>,
    page: Option<u32>,
) -> Result<Vec<Release>, String> {
    crate::github::releases::list_releases(&owner, &repo, per_page, page)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_release(
    owner: String,
    repo: String,
    release_id: i64,
) -> Result<Release, String> {
    crate::github::releases::get_release(&owner, &repo, release_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_latest_release(owner: String, repo: String) -> Result<Release, String> {
    crate::github::releases::get_latest_release(&owner, &repo)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_release_by_tag(
    owner: String,
    repo: String,
    tag: String,
) -> Result<Release, String> {
    crate::github::releases::get_release_by_tag(&owner, &repo, &tag)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_create_release(
    owner: String,
    repo: String,
    tag_name: String,
    target_commitish: Option<String>,
    name: Option<String>,
    body: Option<String>,
    draft: Option<bool>,
    prerelease: Option<bool>,
    generate_release_notes: Option<bool>,
) -> Result<Release, String> {
    let request = CreateReleaseRequest {
        tag_name,
        target_commitish,
        name,
        body,
        draft,
        prerelease,
        generate_release_notes,
    };
    crate::github::releases::create_release(&owner, &repo, request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_update_release(
    owner: String,
    repo: String,
    release_id: i64,
    tag_name: Option<String>,
    target_commitish: Option<String>,
    name: Option<String>,
    body: Option<String>,
    draft: Option<bool>,
    prerelease: Option<bool>,
) -> Result<Release, String> {
    let request = UpdateReleaseRequest {
        tag_name,
        target_commitish,
        name,
        body,
        draft,
        prerelease,
    };
    crate::github::releases::update_release(&owner, &repo, release_id, request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_delete_release(
    owner: String,
    repo: String,
    release_id: i64,
) -> Result<(), String> {
    crate::github::releases::delete_release(&owner, &repo, release_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_generate_release_notes(
    owner: String,
    repo: String,
    tag_name: String,
    target_commitish: Option<String>,
    previous_tag_name: Option<String>,
) -> Result<String, String> {
    crate::github::releases::generate_release_notes(
        &owner,
        &repo,
        &tag_name,
        target_commitish.as_deref(),
        previous_tag_name.as_deref(),
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_list_release_assets(
    owner: String,
    repo: String,
    release_id: i64,
) -> Result<Vec<ReleaseAsset>, String> {
    crate::github::releases::list_release_assets(&owner, &repo, release_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_delete_release_asset(
    owner: String,
    repo: String,
    asset_id: i64,
) -> Result<(), String> {
    crate::github::releases::delete_release_asset(&owner, &repo, asset_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_list_tags(
    owner: String,
    repo: String,
    per_page: Option<u32>,
    page: Option<u32>,
) -> Result<Vec<Tag>, String> {
    crate::github::releases::list_tags(&owner, &repo, per_page, page)
        .await
        .map_err(|e| e.to_string())
}

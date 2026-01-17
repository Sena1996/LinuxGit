use crate::github::pull_requests::{PullRequest, PullRequestReview, PullRequestComment};

#[tauri::command]
pub async fn github_list_pull_requests(
    owner: String,
    repo: String,
    state: String,
    sort: Option<String>,
    direction: Option<String>,
    per_page: Option<u32>,
) -> Result<Vec<PullRequest>, String> {
    crate::github::pull_requests::list_pull_requests(
        &owner,
        &repo,
        &state,
        sort.as_deref(),
        direction.as_deref(),
        per_page,
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_pull_request(
    owner: String,
    repo: String,
    pull_number: i32,
) -> Result<PullRequest, String> {
    crate::github::pull_requests::get_pull_request(&owner, &repo, pull_number)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_create_pull_request(
    owner: String,
    repo: String,
    title: String,
    body: Option<String>,
    head: String,
    base: String,
    draft: Option<bool>,
) -> Result<PullRequest, String> {
    crate::github::pull_requests::create_pull_request(
        &owner,
        &repo,
        &title,
        body.as_deref(),
        &head,
        &base,
        draft.unwrap_or(false),
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_update_pull_request(
    owner: String,
    repo: String,
    pull_number: i32,
    title: Option<String>,
    body: Option<String>,
    state: Option<String>,
    base: Option<String>,
) -> Result<PullRequest, String> {
    crate::github::pull_requests::update_pull_request(
        &owner,
        &repo,
        pull_number,
        title.as_deref(),
        body.as_deref(),
        state.as_deref(),
        base.as_deref(),
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_merge_pull_request(
    owner: String,
    repo: String,
    pull_number: i32,
    merge_method: Option<String>,
    commit_title: Option<String>,
    commit_message: Option<String>,
) -> Result<(), String> {
    crate::github::pull_requests::merge_pull_request(
        &owner,
        &repo,
        pull_number,
        &merge_method.unwrap_or_else(|| "merge".to_string()),
        commit_title.as_deref(),
        commit_message.as_deref(),
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_list_pr_reviews(
    owner: String,
    repo: String,
    pull_number: i32,
) -> Result<Vec<PullRequestReview>, String> {
    crate::github::pull_requests::list_pr_reviews(&owner, &repo, pull_number)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_list_pr_comments(
    owner: String,
    repo: String,
    pull_number: i32,
) -> Result<Vec<PullRequestComment>, String> {
    crate::github::pull_requests::list_pr_comments(&owner, &repo, pull_number)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_request_reviewers(
    owner: String,
    repo: String,
    pull_number: i32,
    reviewers: Vec<String>,
) -> Result<(), String> {
    crate::github::pull_requests::request_reviewers(&owner, &repo, pull_number, reviewers)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_create_review(
    owner: String,
    repo: String,
    pull_number: i32,
    body: Option<String>,
    event: String,
) -> Result<PullRequestReview, String> {
    crate::github::pull_requests::create_review(
        &owner,
        &repo,
        pull_number,
        body.as_deref(),
        &event,
    )
    .await
    .map_err(|e| e.to_string())
}

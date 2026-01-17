use crate::github::issues::{Issue, IssueComment, Label as IssueLabel, Milestone};

#[tauri::command]
pub async fn github_list_issues(
    owner: String,
    repo: String,
    state: String,
    sort: Option<String>,
    direction: Option<String>,
    per_page: Option<u32>,
) -> Result<Vec<Issue>, String> {
    crate::github::issues::list_issues(
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
pub async fn github_get_issue(
    owner: String,
    repo: String,
    issue_number: i32,
) -> Result<Issue, String> {
    crate::github::issues::get_issue(&owner, &repo, issue_number)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_create_issue(
    owner: String,
    repo: String,
    title: String,
    body: Option<String>,
    labels: Option<Vec<String>>,
    assignees: Option<Vec<String>>,
    milestone: Option<i32>,
) -> Result<Issue, String> {
    crate::github::issues::create_issue(
        &owner,
        &repo,
        &title,
        body.as_deref(),
        labels,
        assignees,
        milestone,
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_update_issue(
    owner: String,
    repo: String,
    issue_number: i32,
    title: Option<String>,
    body: Option<String>,
    state: Option<String>,
    state_reason: Option<String>,
    labels: Option<Vec<String>>,
    assignees: Option<Vec<String>>,
    milestone: Option<i32>,
) -> Result<Issue, String> {
    crate::github::issues::update_issue(
        &owner,
        &repo,
        issue_number,
        title.as_deref(),
        body.as_deref(),
        state.as_deref(),
        state_reason.as_deref(),
        labels,
        assignees,
        milestone,
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_list_issue_comments(
    owner: String,
    repo: String,
    issue_number: i32,
    per_page: Option<u32>,
) -> Result<Vec<IssueComment>, String> {
    crate::github::issues::list_issue_comments(&owner, &repo, issue_number, per_page)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_create_issue_comment(
    owner: String,
    repo: String,
    issue_number: i32,
    body: String,
) -> Result<IssueComment, String> {
    crate::github::issues::create_issue_comment(&owner, &repo, issue_number, &body)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_list_labels(
    owner: String,
    repo: String,
    per_page: Option<u32>,
) -> Result<Vec<IssueLabel>, String> {
    crate::github::issues::list_labels(&owner, &repo, per_page)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_list_milestones(
    owner: String,
    repo: String,
    state: Option<String>,
    per_page: Option<u32>,
) -> Result<Vec<Milestone>, String> {
    crate::github::issues::list_milestones(&owner, &repo, state.as_deref(), per_page)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_add_labels_to_issue(
    owner: String,
    repo: String,
    issue_number: i32,
    labels: Vec<String>,
) -> Result<Vec<IssueLabel>, String> {
    crate::github::issues::add_labels_to_issue(&owner, &repo, issue_number, labels)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_lock_issue(
    owner: String,
    repo: String,
    issue_number: i32,
    lock_reason: Option<String>,
) -> Result<(), String> {
    crate::github::issues::lock_issue(&owner, &repo, issue_number, lock_reason.as_deref())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_unlock_issue(
    owner: String,
    repo: String,
    issue_number: i32,
) -> Result<(), String> {
    crate::github::issues::unlock_issue(&owner, &repo, issue_number)
        .await
        .map_err(|e| e.to_string())
}

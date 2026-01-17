use crate::github::notifications::{Notification, ThreadSubscription};

#[tauri::command]
pub async fn github_list_notifications(
    all: Option<bool>,
    participating: Option<bool>,
    since: Option<String>,
    before: Option<String>,
    per_page: Option<u32>,
    page: Option<u32>,
) -> Result<Vec<Notification>, String> {
    crate::github::notifications::list_notifications(
        all,
        participating,
        since.as_deref(),
        before.as_deref(),
        per_page,
        page,
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_list_repo_notifications(
    owner: String,
    repo: String,
    all: Option<bool>,
    participating: Option<bool>,
    since: Option<String>,
    before: Option<String>,
    per_page: Option<u32>,
    page: Option<u32>,
) -> Result<Vec<Notification>, String> {
    crate::github::notifications::list_repo_notifications(
        &owner,
        &repo,
        all,
        participating,
        since.as_deref(),
        before.as_deref(),
        per_page,
        page,
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_mark_all_notifications_read(
    last_read_at: Option<String>,
    read: Option<bool>,
) -> Result<(), String> {
    crate::github::notifications::mark_all_notifications_read(last_read_at.as_deref(), read)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_mark_repo_notifications_read(
    owner: String,
    repo: String,
    last_read_at: Option<String>,
) -> Result<(), String> {
    crate::github::notifications::mark_repo_notifications_read(
        &owner,
        &repo,
        last_read_at.as_deref(),
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_thread(thread_id: String) -> Result<Notification, String> {
    crate::github::notifications::get_thread(&thread_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_mark_thread_read(thread_id: String) -> Result<(), String> {
    crate::github::notifications::mark_thread_read(&thread_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_mark_thread_done(thread_id: String) -> Result<(), String> {
    crate::github::notifications::mark_thread_done(&thread_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_thread_subscription(thread_id: String) -> Result<ThreadSubscription, String> {
    crate::github::notifications::get_thread_subscription(&thread_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_set_thread_subscription(
    thread_id: String,
    ignored: bool,
) -> Result<ThreadSubscription, String> {
    crate::github::notifications::set_thread_subscription(&thread_id, ignored)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_delete_thread_subscription(thread_id: String) -> Result<(), String> {
    crate::github::notifications::delete_thread_subscription(&thread_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_unread_count() -> Result<u32, String> {
    crate::github::notifications::get_unread_count()
        .await
        .map_err(|e| e.to_string())
}

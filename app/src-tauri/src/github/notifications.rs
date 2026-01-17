//! GitHub Notifications API module
//!
//! Provides access to GitHub notifications.

use serde::{Deserialize, Serialize};
use reqwest::Client;

use super::get_stored_token;

/// GitHub Notification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Notification {
    pub id: String,
    pub unread: bool,
    pub reason: String,
    pub updated_at: String,
    pub last_read_at: Option<String>,
    pub subject: NotificationSubject,
    pub repository: NotificationRepository,
    pub url: String,
    pub subscription_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationSubject {
    pub title: String,
    #[serde(rename = "type")]
    pub subject_type: String,
    pub url: Option<String>,
    pub latest_comment_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationRepository {
    pub id: i64,
    pub name: String,
    pub full_name: String,
    pub owner: NotificationOwner,
    pub html_url: String,
    pub description: Option<String>,
    pub private: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationOwner {
    pub login: String,
    pub avatar_url: String,
}

/// Thread subscription
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThreadSubscription {
    pub subscribed: bool,
    pub ignored: bool,
    pub reason: Option<String>,
    pub created_at: Option<String>,
    pub url: String,
    pub thread_url: String,
}

/// Error type for notifications API
#[derive(Debug)]
pub struct NotificationsError(pub String);

impl std::fmt::Display for NotificationsError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl std::error::Error for NotificationsError {}

pub type NotificationsResult<T> = Result<T, NotificationsError>;

fn get_client() -> NotificationsResult<(Client, String)> {
    let token = get_stored_token().map_err(|e| NotificationsError(e.to_string()))?;
    let client = Client::new();
    Ok((client, token))
}

/// List notifications for the authenticated user
pub async fn list_notifications(
    all: Option<bool>,
    participating: Option<bool>,
    since: Option<&str>,
    before: Option<&str>,
    per_page: Option<u32>,
    page: Option<u32>,
) -> NotificationsResult<Vec<Notification>> {
    let (client, token) = get_client()?;

    let url = "https://api.github.com/notifications";

    let mut request = client
        .get(url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28");

    if let Some(a) = all {
        request = request.query(&[("all", a.to_string())]);
    }
    if let Some(p) = participating {
        request = request.query(&[("participating", p.to_string())]);
    }
    if let Some(s) = since {
        request = request.query(&[("since", s)]);
    }
    if let Some(b) = before {
        request = request.query(&[("before", b)]);
    }
    if let Some(pp) = per_page {
        request = request.query(&[("per_page", pp.to_string())]);
    }
    if let Some(p) = page {
        request = request.query(&[("page", p.to_string())]);
    }

    let response = request
        .send()
        .await
        .map_err(|e| NotificationsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(NotificationsError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| NotificationsError(format!("Failed to parse response: {}", e)))
}

/// List notifications for a repository
pub async fn list_repo_notifications(
    owner: &str,
    repo: &str,
    all: Option<bool>,
    participating: Option<bool>,
    since: Option<&str>,
    before: Option<&str>,
    per_page: Option<u32>,
    page: Option<u32>,
) -> NotificationsResult<Vec<Notification>> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/notifications",
        owner, repo
    );

    let mut request = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28");

    if let Some(a) = all {
        request = request.query(&[("all", a.to_string())]);
    }
    if let Some(p) = participating {
        request = request.query(&[("participating", p.to_string())]);
    }
    if let Some(s) = since {
        request = request.query(&[("since", s)]);
    }
    if let Some(b) = before {
        request = request.query(&[("before", b)]);
    }
    if let Some(pp) = per_page {
        request = request.query(&[("per_page", pp.to_string())]);
    }
    if let Some(p) = page {
        request = request.query(&[("page", p.to_string())]);
    }

    let response = request
        .send()
        .await
        .map_err(|e| NotificationsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(NotificationsError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| NotificationsError(format!("Failed to parse response: {}", e)))
}

/// Mark all notifications as read
pub async fn mark_all_notifications_read(
    last_read_at: Option<&str>,
    read: Option<bool>,
) -> NotificationsResult<()> {
    let (client, token) = get_client()?;

    let url = "https://api.github.com/notifications";

    let mut body = serde_json::json!({});
    if let Some(lr) = last_read_at {
        body["last_read_at"] = serde_json::json!(lr);
    }
    if let Some(r) = read {
        body["read"] = serde_json::json!(r);
    }

    let response = client
        .put(url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .json(&body)
        .send()
        .await
        .map_err(|e| NotificationsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(NotificationsError(format!("GitHub API error ({}): {}", status, text)));
    }

    Ok(())
}

/// Mark repository notifications as read
pub async fn mark_repo_notifications_read(
    owner: &str,
    repo: &str,
    last_read_at: Option<&str>,
) -> NotificationsResult<()> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/notifications",
        owner, repo
    );

    let mut body = serde_json::json!({});
    if let Some(lr) = last_read_at {
        body["last_read_at"] = serde_json::json!(lr);
    }

    let response = client
        .put(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .json(&body)
        .send()
        .await
        .map_err(|e| NotificationsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(NotificationsError(format!("GitHub API error ({}): {}", status, text)));
    }

    Ok(())
}

/// Get a notification thread
pub async fn get_thread(thread_id: &str) -> NotificationsResult<Notification> {
    let (client, token) = get_client()?;

    let url = format!("https://api.github.com/notifications/threads/{}", thread_id);

    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| NotificationsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(NotificationsError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| NotificationsError(format!("Failed to parse response: {}", e)))
}

/// Mark a thread as read
pub async fn mark_thread_read(thread_id: &str) -> NotificationsResult<()> {
    let (client, token) = get_client()?;

    let url = format!("https://api.github.com/notifications/threads/{}", thread_id);

    let response = client
        .patch(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| NotificationsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(NotificationsError(format!("GitHub API error ({}): {}", status, text)));
    }

    Ok(())
}

/// Mark a thread as done
pub async fn mark_thread_done(thread_id: &str) -> NotificationsResult<()> {
    let (client, token) = get_client()?;

    let url = format!("https://api.github.com/notifications/threads/{}", thread_id);

    let response = client
        .delete(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| NotificationsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(NotificationsError(format!("GitHub API error ({}): {}", status, text)));
    }

    Ok(())
}

/// Get thread subscription
pub async fn get_thread_subscription(thread_id: &str) -> NotificationsResult<ThreadSubscription> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/notifications/threads/{}/subscription",
        thread_id
    );

    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| NotificationsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(NotificationsError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| NotificationsError(format!("Failed to parse response: {}", e)))
}

/// Set thread subscription
pub async fn set_thread_subscription(
    thread_id: &str,
    ignored: bool,
) -> NotificationsResult<ThreadSubscription> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/notifications/threads/{}/subscription",
        thread_id
    );

    let body = serde_json::json!({
        "ignored": ignored
    });

    let response = client
        .put(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .json(&body)
        .send()
        .await
        .map_err(|e| NotificationsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(NotificationsError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| NotificationsError(format!("Failed to parse response: {}", e)))
}

/// Delete thread subscription
pub async fn delete_thread_subscription(thread_id: &str) -> NotificationsResult<()> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/notifications/threads/{}/subscription",
        thread_id
    );

    let response = client
        .delete(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| NotificationsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(NotificationsError(format!("GitHub API error ({}): {}", status, text)));
    }

    Ok(())
}

/// Get the count of unread notifications
pub async fn get_unread_count() -> NotificationsResult<u32> {
    let notifications = list_notifications(
        Some(false), // only unread
        None,
        None,
        None,
        Some(1), // we only need the count
        None,
    )
    .await?;

    Ok(notifications.len() as u32)
}

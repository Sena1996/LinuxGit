//! GitHub Pull Requests API module
//!
//! Provides access to GitHub Pull Requests, reviews, and comments.

use serde::{Deserialize, Serialize};
use reqwest::Client;

use super::get_stored_token;

/// GitHub Label
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Label {
    pub id: i64,
    pub name: String,
    pub color: String,
    pub description: Option<String>,
}

/// GitHub User (simplified)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PullRequestUser {
    pub login: String,
    pub avatar_url: String,
}

/// GitHub Pull Request Branch
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PullRequestBranch {
    #[serde(rename = "ref")]
    pub ref_name: String,
    pub sha: String,
    pub label: String,
}

/// GitHub Pull Request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PullRequest {
    pub id: i64,
    pub number: i32,
    pub title: String,
    pub body: Option<String>,
    pub state: String,
    pub draft: bool,
    pub merged: bool,
    pub mergeable: Option<bool>,
    pub mergeable_state: Option<String>,
    pub html_url: String,
    pub diff_url: String,
    pub patch_url: String,
    pub created_at: String,
    pub updated_at: String,
    pub closed_at: Option<String>,
    pub merged_at: Option<String>,
    pub head: PullRequestBranch,
    pub base: PullRequestBranch,
    pub user: PullRequestUser,
    #[serde(default)]
    pub assignees: Vec<PullRequestUser>,
    #[serde(default)]
    pub requested_reviewers: Vec<PullRequestUser>,
    #[serde(default)]
    pub labels: Vec<Label>,
    #[serde(default)]
    pub comments: i32,
    #[serde(default)]
    pub review_comments: i32,
    #[serde(default)]
    pub commits: i32,
    #[serde(default)]
    pub additions: i32,
    #[serde(default)]
    pub deletions: i32,
    #[serde(default)]
    pub changed_files: i32,
}

/// GitHub Pull Request Review
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PullRequestReview {
    pub id: i64,
    pub user: PullRequestUser,
    pub body: Option<String>,
    pub state: String,
    pub html_url: String,
    pub submitted_at: String,
}

/// GitHub Pull Request Comment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PullRequestComment {
    pub id: i64,
    pub body: String,
    pub user: PullRequestUser,
    pub created_at: String,
    pub updated_at: String,
    pub html_url: String,
    pub path: Option<String>,
    pub line: Option<i32>,
}

/// Error type for Pull Requests API
#[derive(Debug)]
pub struct PullRequestsError(pub String);

impl std::fmt::Display for PullRequestsError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl std::error::Error for PullRequestsError {}

pub type PullRequestsResult<T> = Result<T, PullRequestsError>;

fn get_client() -> PullRequestsResult<(Client, String)> {
    let token = get_stored_token().map_err(|e| PullRequestsError(e.to_string()))?;
    let client = Client::new();
    Ok((client, token))
}

/// List pull requests for a repository
pub async fn list_pull_requests(
    owner: &str,
    repo: &str,
    state: &str,
    sort: Option<&str>,
    direction: Option<&str>,
    per_page: Option<u32>,
) -> PullRequestsResult<Vec<PullRequest>> {
    let (client, token) = get_client()?;

    let url = format!("https://api.github.com/repos/{}/{}/pulls", owner, repo);

    let mut request = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .query(&[("state", state)]);

    if let Some(s) = sort {
        request = request.query(&[("sort", s)]);
    }
    if let Some(d) = direction {
        request = request.query(&[("direction", d)]);
    }
    if let Some(pp) = per_page {
        request = request.query(&[("per_page", pp.to_string())]);
    }

    let response = request
        .send()
        .await
        .map_err(|e| PullRequestsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(PullRequestsError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| PullRequestsError(format!("Failed to parse response: {}", e)))
}

/// Get a specific pull request
pub async fn get_pull_request(
    owner: &str,
    repo: &str,
    pull_number: i32,
) -> PullRequestsResult<PullRequest> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/pulls/{}",
        owner, repo, pull_number
    );

    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| PullRequestsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(PullRequestsError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| PullRequestsError(format!("Failed to parse response: {}", e)))
}

/// Create a pull request
pub async fn create_pull_request(
    owner: &str,
    repo: &str,
    title: &str,
    body: Option<&str>,
    head: &str,
    base: &str,
    draft: bool,
) -> PullRequestsResult<PullRequest> {
    let (client, token) = get_client()?;

    let url = format!("https://api.github.com/repos/{}/{}/pulls", owner, repo);

    let mut payload = serde_json::json!({
        "title": title,
        "head": head,
        "base": base,
        "draft": draft
    });

    if let Some(b) = body {
        payload["body"] = serde_json::Value::String(b.to_string());
    }

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .json(&payload)
        .send()
        .await
        .map_err(|e| PullRequestsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(PullRequestsError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| PullRequestsError(format!("Failed to parse response: {}", e)))
}

/// Update a pull request
pub async fn update_pull_request(
    owner: &str,
    repo: &str,
    pull_number: i32,
    title: Option<&str>,
    body: Option<&str>,
    state: Option<&str>,
    base: Option<&str>,
) -> PullRequestsResult<PullRequest> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/pulls/{}",
        owner, repo, pull_number
    );

    let mut payload = serde_json::Map::new();
    if let Some(t) = title {
        payload.insert("title".to_string(), serde_json::Value::String(t.to_string()));
    }
    if let Some(b) = body {
        payload.insert("body".to_string(), serde_json::Value::String(b.to_string()));
    }
    if let Some(s) = state {
        payload.insert("state".to_string(), serde_json::Value::String(s.to_string()));
    }
    if let Some(base_ref) = base {
        payload.insert("base".to_string(), serde_json::Value::String(base_ref.to_string()));
    }

    let response = client
        .patch(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .json(&serde_json::Value::Object(payload))
        .send()
        .await
        .map_err(|e| PullRequestsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(PullRequestsError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| PullRequestsError(format!("Failed to parse response: {}", e)))
}

/// Merge a pull request
pub async fn merge_pull_request(
    owner: &str,
    repo: &str,
    pull_number: i32,
    merge_method: &str,
    commit_title: Option<&str>,
    commit_message: Option<&str>,
) -> PullRequestsResult<()> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/pulls/{}/merge",
        owner, repo, pull_number
    );

    let mut payload = serde_json::json!({
        "merge_method": merge_method
    });

    if let Some(t) = commit_title {
        payload["commit_title"] = serde_json::Value::String(t.to_string());
    }
    if let Some(m) = commit_message {
        payload["commit_message"] = serde_json::Value::String(m.to_string());
    }

    let response = client
        .put(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .json(&payload)
        .send()
        .await
        .map_err(|e| PullRequestsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(PullRequestsError(format!("GitHub API error ({}): {}", status, text)));
    }

    Ok(())
}

/// List reviews for a pull request
pub async fn list_pr_reviews(
    owner: &str,
    repo: &str,
    pull_number: i32,
) -> PullRequestsResult<Vec<PullRequestReview>> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/pulls/{}/reviews",
        owner, repo, pull_number
    );

    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| PullRequestsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(PullRequestsError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| PullRequestsError(format!("Failed to parse response: {}", e)))
}

/// List comments for a pull request
pub async fn list_pr_comments(
    owner: &str,
    repo: &str,
    pull_number: i32,
) -> PullRequestsResult<Vec<PullRequestComment>> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/pulls/{}/comments",
        owner, repo, pull_number
    );

    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| PullRequestsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(PullRequestsError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| PullRequestsError(format!("Failed to parse response: {}", e)))
}

/// Request reviewers for a pull request
pub async fn request_reviewers(
    owner: &str,
    repo: &str,
    pull_number: i32,
    reviewers: Vec<String>,
) -> PullRequestsResult<()> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/pulls/{}/requested_reviewers",
        owner, repo, pull_number
    );

    let payload = serde_json::json!({
        "reviewers": reviewers
    });

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .json(&payload)
        .send()
        .await
        .map_err(|e| PullRequestsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(PullRequestsError(format!("GitHub API error ({}): {}", status, text)));
    }

    Ok(())
}

/// Create a review for a pull request
pub async fn create_review(
    owner: &str,
    repo: &str,
    pull_number: i32,
    body: Option<&str>,
    event: &str,  // APPROVE, REQUEST_CHANGES, COMMENT
) -> PullRequestsResult<PullRequestReview> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/pulls/{}/reviews",
        owner, repo, pull_number
    );

    let mut payload = serde_json::json!({
        "event": event
    });

    if let Some(b) = body {
        payload["body"] = serde_json::Value::String(b.to_string());
    }

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .json(&payload)
        .send()
        .await
        .map_err(|e| PullRequestsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(PullRequestsError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| PullRequestsError(format!("Failed to parse response: {}", e)))
}

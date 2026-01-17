//! GitHub Issues API module
//!
//! Provides access to GitHub Issues, comments, labels, and milestones.

use serde::{Deserialize, Serialize};
use reqwest::Client;

use super::get_stored_token;

/// GitHub User (simplified)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IssueUser {
    pub login: String,
    pub avatar_url: String,
}

/// GitHub Label
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Label {
    pub id: i64,
    pub name: String,
    pub color: String,
    pub description: Option<String>,
    #[serde(default)]
    pub default: bool,
}

/// GitHub Milestone
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Milestone {
    pub id: i64,
    pub number: i32,
    pub title: String,
    pub description: Option<String>,
    pub state: String,
    pub open_issues: i32,
    pub closed_issues: i32,
    pub due_on: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// GitHub Issue Pull Request info (to distinguish PRs from issues)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IssuePullRequest {
    pub url: String,
}

/// GitHub Issue
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Issue {
    pub id: i64,
    pub number: i32,
    pub title: String,
    pub body: Option<String>,
    pub state: String,
    pub state_reason: Option<String>,
    pub html_url: String,
    pub created_at: String,
    pub updated_at: String,
    pub closed_at: Option<String>,
    pub user: IssueUser,
    #[serde(default)]
    pub assignees: Vec<IssueUser>,
    #[serde(default)]
    pub labels: Vec<Label>,
    pub milestone: Option<Milestone>,
    #[serde(default)]
    pub comments: i32,
    #[serde(default)]
    pub locked: bool,
    pub pull_request: Option<IssuePullRequest>,
}

/// GitHub Issue Comment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IssueComment {
    pub id: i64,
    pub body: String,
    pub user: IssueUser,
    pub created_at: String,
    pub updated_at: String,
    pub html_url: String,
}

/// Error type for Issues API
#[derive(Debug)]
pub struct IssuesError(pub String);

impl std::fmt::Display for IssuesError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl std::error::Error for IssuesError {}

pub type IssuesResult<T> = Result<T, IssuesError>;

fn get_client() -> IssuesResult<(Client, String)> {
    let token = get_stored_token().map_err(|e| IssuesError(e.to_string()))?;
    let client = Client::new();
    Ok((client, token))
}

/// List issues for a repository
pub async fn list_issues(
    owner: &str,
    repo: &str,
    state: &str,
    sort: Option<&str>,
    direction: Option<&str>,
    per_page: Option<u32>,
) -> IssuesResult<Vec<Issue>> {
    let (client, token) = get_client()?;

    let url = format!("https://api.github.com/repos/{}/{}/issues", owner, repo);

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
        .map_err(|e| IssuesError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(IssuesError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| IssuesError(format!("Failed to parse response: {}", e)))
}

/// Get a specific issue
pub async fn get_issue(
    owner: &str,
    repo: &str,
    issue_number: i32,
) -> IssuesResult<Issue> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/issues/{}",
        owner, repo, issue_number
    );

    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| IssuesError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(IssuesError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| IssuesError(format!("Failed to parse response: {}", e)))
}

/// Create an issue
pub async fn create_issue(
    owner: &str,
    repo: &str,
    title: &str,
    body: Option<&str>,
    labels: Option<Vec<String>>,
    assignees: Option<Vec<String>>,
    milestone: Option<i32>,
) -> IssuesResult<Issue> {
    let (client, token) = get_client()?;

    let url = format!("https://api.github.com/repos/{}/{}/issues", owner, repo);

    let mut payload = serde_json::json!({
        "title": title
    });

    if let Some(b) = body {
        payload["body"] = serde_json::Value::String(b.to_string());
    }
    if let Some(l) = labels {
        payload["labels"] = serde_json::json!(l);
    }
    if let Some(a) = assignees {
        payload["assignees"] = serde_json::json!(a);
    }
    if let Some(m) = milestone {
        payload["milestone"] = serde_json::Value::Number(m.into());
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
        .map_err(|e| IssuesError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(IssuesError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| IssuesError(format!("Failed to parse response: {}", e)))
}

/// Update an issue
pub async fn update_issue(
    owner: &str,
    repo: &str,
    issue_number: i32,
    title: Option<&str>,
    body: Option<&str>,
    state: Option<&str>,
    state_reason: Option<&str>,
    labels: Option<Vec<String>>,
    assignees: Option<Vec<String>>,
    milestone: Option<i32>,
) -> IssuesResult<Issue> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/issues/{}",
        owner, repo, issue_number
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
    if let Some(sr) = state_reason {
        payload.insert("state_reason".to_string(), serde_json::Value::String(sr.to_string()));
    }
    if let Some(l) = labels {
        payload.insert("labels".to_string(), serde_json::json!(l));
    }
    if let Some(a) = assignees {
        payload.insert("assignees".to_string(), serde_json::json!(a));
    }
    if let Some(m) = milestone {
        payload.insert("milestone".to_string(), serde_json::Value::Number(m.into()));
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
        .map_err(|e| IssuesError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(IssuesError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| IssuesError(format!("Failed to parse response: {}", e)))
}

/// List comments for an issue
pub async fn list_issue_comments(
    owner: &str,
    repo: &str,
    issue_number: i32,
    per_page: Option<u32>,
) -> IssuesResult<Vec<IssueComment>> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/issues/{}/comments",
        owner, repo, issue_number
    );

    let mut request = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28");

    if let Some(pp) = per_page {
        request = request.query(&[("per_page", pp.to_string())]);
    }

    let response = request
        .send()
        .await
        .map_err(|e| IssuesError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(IssuesError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| IssuesError(format!("Failed to parse response: {}", e)))
}

/// Create a comment on an issue
pub async fn create_issue_comment(
    owner: &str,
    repo: &str,
    issue_number: i32,
    body: &str,
) -> IssuesResult<IssueComment> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/issues/{}/comments",
        owner, repo, issue_number
    );

    let payload = serde_json::json!({
        "body": body
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
        .map_err(|e| IssuesError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(IssuesError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| IssuesError(format!("Failed to parse response: {}", e)))
}

/// List labels for a repository
pub async fn list_labels(
    owner: &str,
    repo: &str,
    per_page: Option<u32>,
) -> IssuesResult<Vec<Label>> {
    let (client, token) = get_client()?;

    let url = format!("https://api.github.com/repos/{}/{}/labels", owner, repo);

    let mut request = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28");

    if let Some(pp) = per_page {
        request = request.query(&[("per_page", pp.to_string())]);
    }

    let response = request
        .send()
        .await
        .map_err(|e| IssuesError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(IssuesError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| IssuesError(format!("Failed to parse response: {}", e)))
}

/// List milestones for a repository
pub async fn list_milestones(
    owner: &str,
    repo: &str,
    state: Option<&str>,
    per_page: Option<u32>,
) -> IssuesResult<Vec<Milestone>> {
    let (client, token) = get_client()?;

    let url = format!("https://api.github.com/repos/{}/{}/milestones", owner, repo);

    let mut request = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28");

    if let Some(s) = state {
        request = request.query(&[("state", s)]);
    }
    if let Some(pp) = per_page {
        request = request.query(&[("per_page", pp.to_string())]);
    }

    let response = request
        .send()
        .await
        .map_err(|e| IssuesError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(IssuesError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| IssuesError(format!("Failed to parse response: {}", e)))
}

/// Add labels to an issue
pub async fn add_labels_to_issue(
    owner: &str,
    repo: &str,
    issue_number: i32,
    labels: Vec<String>,
) -> IssuesResult<Vec<Label>> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/issues/{}/labels",
        owner, repo, issue_number
    );

    let payload = serde_json::json!({
        "labels": labels
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
        .map_err(|e| IssuesError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(IssuesError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| IssuesError(format!("Failed to parse response: {}", e)))
}

/// Lock an issue
pub async fn lock_issue(
    owner: &str,
    repo: &str,
    issue_number: i32,
    lock_reason: Option<&str>,
) -> IssuesResult<()> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/issues/{}/lock",
        owner, repo, issue_number
    );

    let mut request = client
        .put(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28");

    if let Some(reason) = lock_reason {
        let payload = serde_json::json!({ "lock_reason": reason });
        request = request.json(&payload);
    }

    let response = request
        .send()
        .await
        .map_err(|e| IssuesError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(IssuesError(format!("GitHub API error ({}): {}", status, text)));
    }

    Ok(())
}

/// Unlock an issue
pub async fn unlock_issue(
    owner: &str,
    repo: &str,
    issue_number: i32,
) -> IssuesResult<()> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/issues/{}/lock",
        owner, repo, issue_number
    );

    let response = client
        .delete(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| IssuesError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(IssuesError(format!("GitHub API error ({}): {}", status, text)));
    }

    Ok(())
}

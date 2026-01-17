//! GitHub API client
//!
//! Provides functions for interacting with the GitHub REST API.

use reqwest::Client;
use serde::{Deserialize, Serialize};
use thiserror::Error;

const GITHUB_API_URL: &str = "https://api.github.com";

#[derive(Debug, Error)]
pub enum GitHubApiError {
    #[error("Network error: {0}")]
    NetworkError(String),
    #[error("API error: {0}")]
    ApiError(String),
    #[error("Unauthorized - token may be invalid or expired")]
    Unauthorized,
    #[error("Rate limited - please try again later")]
    RateLimited,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubUser {
    pub login: String,
    pub id: u64,
    pub avatar_url: String,
    pub name: Option<String>,
    pub email: Option<String>,
    pub bio: Option<String>,
    pub public_repos: u32,
    pub followers: u32,
    pub following: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubEmail {
    pub email: String,
    pub primary: bool,
    pub verified: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubRepo {
    pub id: u64,
    pub name: String,
    pub full_name: String,
    pub description: Option<String>,
    pub private: bool,
    pub html_url: String,
    pub clone_url: String,
    pub ssh_url: String,
    pub default_branch: String,
    pub stargazers_count: u32,
    pub forks_count: u32,
    pub updated_at: String,
}

/// Create a configured HTTP client with auth token
fn create_client(token: &str) -> Client {
    Client::builder()
        .user_agent("LinuxGit/1.0")
        .default_headers({
            let mut headers = reqwest::header::HeaderMap::new();
            headers.insert(
                reqwest::header::AUTHORIZATION,
                format!("Bearer {}", token).parse().unwrap(),
            );
            headers.insert(
                reqwest::header::ACCEPT,
                "application/vnd.github+json".parse().unwrap(),
            );
            headers.insert(
                "X-GitHub-Api-Version",
                "2022-11-28".parse().unwrap(),
            );
            headers
        })
        .build()
        .unwrap()
}

/// Handle API response errors
async fn handle_response<T: for<'de> Deserialize<'de>>(
    response: reqwest::Response,
) -> Result<T, GitHubApiError> {
    let status = response.status();

    if status == reqwest::StatusCode::UNAUTHORIZED {
        return Err(GitHubApiError::Unauthorized);
    }

    if status == reqwest::StatusCode::FORBIDDEN {
        // Check if rate limited
        if response.headers().contains_key("x-ratelimit-remaining") {
            let remaining = response
                .headers()
                .get("x-ratelimit-remaining")
                .and_then(|v| v.to_str().ok())
                .and_then(|v| v.parse::<u32>().ok())
                .unwrap_or(1);

            if remaining == 0 {
                return Err(GitHubApiError::RateLimited);
            }
        }
        return Err(GitHubApiError::ApiError("Access forbidden".into()));
    }

    if !status.is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(GitHubApiError::ApiError(format!(
            "Status {}: {}",
            status, error_text
        )));
    }

    response
        .json()
        .await
        .map_err(|e| GitHubApiError::ApiError(e.to_string()))
}

/// Get the authenticated user's profile
pub async fn get_current_user(token: &str) -> Result<GitHubUser, GitHubApiError> {
    let client = create_client(token);
    let url = format!("{}/user", GITHUB_API_URL);

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| GitHubApiError::NetworkError(e.to_string()))?;

    handle_response(response).await
}

/// Get the authenticated user's email addresses
pub async fn get_user_emails(token: &str) -> Result<Vec<GitHubEmail>, GitHubApiError> {
    let client = create_client(token);
    let url = format!("{}/user/emails", GITHUB_API_URL);

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| GitHubApiError::NetworkError(e.to_string()))?;

    handle_response(response).await
}

/// Get the primary email address for the user
pub async fn get_primary_email(token: &str) -> Result<Option<String>, GitHubApiError> {
    let emails = get_user_emails(token).await?;
    Ok(emails
        .into_iter()
        .find(|e| e.primary && e.verified)
        .map(|e| e.email))
}

/// Get repositories for the authenticated user
pub async fn get_user_repos(
    token: &str,
    page: u32,
    per_page: u32,
) -> Result<Vec<GitHubRepo>, GitHubApiError> {
    let client = create_client(token);
    let url = format!(
        "{}/user/repos?page={}&per_page={}&sort=updated&direction=desc",
        GITHUB_API_URL, page, per_page
    );

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| GitHubApiError::NetworkError(e.to_string()))?;

    handle_response(response).await
}

/// Validate that a token is still valid
pub async fn validate_token(token: &str) -> bool {
    get_current_user(token).await.is_ok()
}

/// Get a specific repository
pub async fn get_repo(
    token: &str,
    owner: &str,
    repo: &str,
) -> Result<GitHubRepo, GitHubApiError> {
    let client = create_client(token);
    let url = format!("{}/repos/{}/{}", GITHUB_API_URL, owner, repo);

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| GitHubApiError::NetworkError(e.to_string()))?;

    handle_response(response).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_client() {
        let client = create_client("test_token");
        // Just verify it doesn't panic
        assert!(true);
    }
}

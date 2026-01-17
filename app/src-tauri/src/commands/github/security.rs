use reqwest::Client;
use serde::{Deserialize, Serialize};
use crate::github::api::GitHubApiError;
use crate::github::oauth::get_stored_token;

const GITHUB_API_URL: &str = "https://api.github.com";

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
            headers.insert("X-GitHub-Api-Version", "2022-11-28".parse().unwrap());
            headers
        })
        .build()
        .unwrap()
}

// Dependabot Alert Types
#[derive(Debug, Serialize, Deserialize)]
pub struct DependabotAlert {
    pub number: i64,
    pub state: String,
    pub dependency: DependabotDependency,
    pub security_advisory: SecurityAdvisory,
    pub security_vulnerability: SecurityVulnerability,
    pub created_at: String,
    pub html_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DependabotDependency {
    pub package: DependabotPackage,
    pub manifest_path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DependabotPackage {
    pub name: String,
    pub ecosystem: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SecurityAdvisory {
    pub severity: String,
    pub summary: String,
    pub description: String,
    pub cve_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SecurityVulnerability {
    pub vulnerable_version_range: String,
    pub first_patched_version: Option<PatchedVersion>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PatchedVersion {
    pub identifier: String,
}

// Code Scanning Alert Types
#[derive(Debug, Serialize, Deserialize)]
pub struct CodeScanningAlert {
    pub number: i64,
    pub state: String,
    pub rule: CodeScanningRule,
    pub tool: CodeScanningTool,
    pub most_recent_instance: CodeScanningInstance,
    pub created_at: String,
    pub html_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CodeScanningRule {
    pub id: String,
    pub severity: Option<String>,
    pub description: String,
    pub security_severity_level: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CodeScanningTool {
    pub name: String,
    pub version: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CodeScanningInstance {
    pub location: CodeScanningLocation,
    pub message: CodeScanningMessage,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CodeScanningLocation {
    pub path: String,
    pub start_line: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CodeScanningMessage {
    pub text: String,
}

// Secret Scanning Alert Types
#[derive(Debug, Serialize, Deserialize)]
pub struct SecretScanningAlert {
    pub number: i64,
    pub state: String,
    pub secret_type: String,
    pub secret_type_display_name: String,
    pub locations_url: String,
    pub created_at: String,
    pub html_url: String,
}

/// List Dependabot alerts for a repository
#[tauri::command]
pub async fn github_list_dependabot_alerts(
    owner: String,
    repo: String,
) -> Result<Vec<DependabotAlert>, String> {
    let token = get_stored_token().map_err(|e| GitHubApiError::ApiError(e.to_string())).map_err(|e| e.to_string())?;
    let client = create_client(&token);
    let url = format!(
        "{}/repos/{}/{}/dependabot/alerts?state=open&per_page=100",
        GITHUB_API_URL, owner, repo
    );

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        // Dependabot may not be enabled - return empty array instead of error
        if status.as_u16() == 404 || status.as_u16() == 403 {
            return Ok(vec![]);
        }
        return Err(format!("API error {}: {}", status, text));
    }

    response
        .json()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

/// List Code Scanning alerts for a repository
#[tauri::command]
pub async fn github_list_code_scanning_alerts(
    owner: String,
    repo: String,
) -> Result<Vec<CodeScanningAlert>, String> {
    let token = get_stored_token().map_err(|e| GitHubApiError::ApiError(e.to_string())).map_err(|e| e.to_string())?;
    let client = create_client(&token);
    let url = format!(
        "{}/repos/{}/{}/code-scanning/alerts?state=open&per_page=100",
        GITHUB_API_URL, owner, repo
    );

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        // Code scanning may not be enabled - return empty array instead of error
        if status.as_u16() == 404 || status.as_u16() == 403 {
            return Ok(vec![]);
        }
        return Err(format!("API error {}: {}", status, text));
    }

    response
        .json()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

/// List Secret Scanning alerts for a repository
#[tauri::command]
pub async fn github_list_secret_scanning_alerts(
    owner: String,
    repo: String,
) -> Result<Vec<SecretScanningAlert>, String> {
    let token = get_stored_token().map_err(|e| GitHubApiError::ApiError(e.to_string())).map_err(|e| e.to_string())?;
    let client = create_client(&token);
    let url = format!(
        "{}/repos/{}/{}/secret-scanning/alerts?state=open&per_page=100",
        GITHUB_API_URL, owner, repo
    );

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        // Secret scanning may not be enabled - return empty array instead of error
        if status.as_u16() == 404 || status.as_u16() == 403 {
            return Ok(vec![]);
        }
        return Err(format!("API error {}: {}", status, text));
    }

    response
        .json()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

/// Dismiss a Dependabot alert
#[tauri::command]
pub async fn github_dismiss_dependabot_alert(
    owner: String,
    repo: String,
    alert_number: i64,
    dismissed_reason: String,
    dismissed_comment: Option<String>,
) -> Result<DependabotAlert, String> {
    let token = get_stored_token().map_err(|e| GitHubApiError::ApiError(e.to_string())).map_err(|e| e.to_string())?;
    let client = create_client(&token);
    let url = format!(
        "{}/repos/{}/{}/dependabot/alerts/{}",
        GITHUB_API_URL, owner, repo, alert_number
    );

    #[derive(Serialize)]
    struct DismissBody {
        state: String,
        dismissed_reason: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        dismissed_comment: Option<String>,
    }

    let body = DismissBody {
        state: "dismissed".to_string(),
        dismissed_reason,
        dismissed_comment,
    };

    let response = client
        .patch(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("API error {}: {}", status, text));
    }

    response
        .json()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

/// Dismiss a Code Scanning alert
#[tauri::command]
pub async fn github_dismiss_code_scanning_alert(
    owner: String,
    repo: String,
    alert_number: i64,
    dismissed_reason: String,
    dismissed_comment: Option<String>,
) -> Result<CodeScanningAlert, String> {
    let token = get_stored_token().map_err(|e| GitHubApiError::ApiError(e.to_string())).map_err(|e| e.to_string())?;
    let client = create_client(&token);
    let url = format!(
        "{}/repos/{}/{}/code-scanning/alerts/{}",
        GITHUB_API_URL, owner, repo, alert_number
    );

    #[derive(Serialize)]
    struct DismissBody {
        state: String,
        dismissed_reason: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        dismissed_comment: Option<String>,
    }

    let body = DismissBody {
        state: "dismissed".to_string(),
        dismissed_reason,
        dismissed_comment,
    };

    let response = client
        .patch(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("API error {}: {}", status, text));
    }

    response
        .json()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

/// Resolve a Secret Scanning alert
#[tauri::command]
pub async fn github_resolve_secret_scanning_alert(
    owner: String,
    repo: String,
    alert_number: i64,
    resolution: String,
    resolution_comment: Option<String>,
) -> Result<SecretScanningAlert, String> {
    let token = get_stored_token().map_err(|e| GitHubApiError::ApiError(e.to_string())).map_err(|e| e.to_string())?;
    let client = create_client(&token);
    let url = format!(
        "{}/repos/{}/{}/secret-scanning/alerts/{}",
        GITHUB_API_URL, owner, repo, alert_number
    );

    #[derive(Serialize)]
    struct ResolveBody {
        state: String,
        resolution: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        resolution_comment: Option<String>,
    }

    let body = ResolveBody {
        state: "resolved".to_string(),
        resolution,
        resolution_comment,
    };

    let response = client
        .patch(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("API error {}: {}", status, text));
    }

    response
        .json()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

use reqwest::Client;
use serde::{Deserialize, Serialize};
use super::api::GitHubApiError;
use super::oauth::get_stored_token;

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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Environment {
    pub id: i64,
    pub name: String,
    pub url: String,
    pub html_url: String,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default)]
    pub protection_rules: Vec<ProtectionRule>,
    #[serde(default)]
    pub deployment_branch_policy: Option<DeploymentBranchPolicy>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProtectionRule {
    pub id: i64,
    #[serde(rename = "type")]
    pub rule_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub wait_timer: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reviewers: Option<Vec<Reviewer>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Reviewer {
    #[serde(rename = "type")]
    pub reviewer_type: String,
    pub reviewer: ReviewerInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewerInfo {
    pub id: i64,
    pub login: Option<String>,
    pub name: Option<String>,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeploymentBranchPolicy {
    pub protected_branches: bool,
    pub custom_branch_policies: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvironmentsResponse {
    pub total_count: u32,
    pub environments: Vec<Environment>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateEnvironmentRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub wait_timer: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prevent_self_review: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reviewers: Option<Vec<ReviewerRequest>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub deployment_branch_policy: Option<DeploymentBranchPolicy>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewerRequest {
    #[serde(rename = "type")]
    pub reviewer_type: String,
    pub id: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvironmentSecret {
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvironmentSecretsResponse {
    pub total_count: u32,
    pub secrets: Vec<EnvironmentSecret>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvironmentVariable {
    pub name: String,
    pub value: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvironmentVariablesResponse {
    pub total_count: u32,
    pub variables: Vec<EnvironmentVariable>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BranchPolicy {
    pub id: i64,
    pub name: String,
    #[serde(rename = "type")]
    pub policy_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BranchPoliciesResponse {
    pub total_count: u32,
    pub branch_policies: Vec<BranchPolicy>,
}

pub async fn list_environments(
    owner: &str,
    repo: &str,
    per_page: Option<u32>,
    page: Option<u32>,
) -> Result<EnvironmentsResponse, GitHubApiError> {
    let token = get_stored_token().map_err(|e| GitHubApiError::ApiError(e.to_string()))?;
    let client = create_client(&token);

    let url = format!(
        "{}/repos/{}/{}/environments?per_page={}&page={}",
        GITHUB_API_URL,
        owner,
        repo,
        per_page.unwrap_or(30),
        page.unwrap_or(1)
    );

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| GitHubApiError::NetworkError(e.to_string()))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(GitHubApiError::ApiError(error_text));
    }

    response
        .json()
        .await
        .map_err(|e| GitHubApiError::ApiError(e.to_string()))
}

pub async fn get_environment(
    owner: &str,
    repo: &str,
    environment_name: &str,
) -> Result<Environment, GitHubApiError> {
    let token = get_stored_token().map_err(|e| GitHubApiError::ApiError(e.to_string()))?;
    let client = create_client(&token);

    let url = format!(
        "{}/repos/{}/{}/environments/{}",
        GITHUB_API_URL, owner, repo, environment_name
    );

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| GitHubApiError::NetworkError(e.to_string()))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(GitHubApiError::ApiError(error_text));
    }

    response
        .json()
        .await
        .map_err(|e| GitHubApiError::ApiError(e.to_string()))
}

pub async fn create_or_update_environment(
    owner: &str,
    repo: &str,
    environment_name: &str,
    request: Option<CreateEnvironmentRequest>,
) -> Result<Environment, GitHubApiError> {
    let token = get_stored_token().map_err(|e| GitHubApiError::ApiError(e.to_string()))?;
    let client = create_client(&token);

    let url = format!(
        "{}/repos/{}/{}/environments/{}",
        GITHUB_API_URL, owner, repo, environment_name
    );

    let mut req_builder = client.put(&url);

    if let Some(body) = request {
        req_builder = req_builder.json(&body);
    } else {
        req_builder = req_builder.json(&serde_json::json!({}));
    }

    let response = req_builder
        .send()
        .await
        .map_err(|e| GitHubApiError::NetworkError(e.to_string()))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(GitHubApiError::ApiError(error_text));
    }

    response
        .json()
        .await
        .map_err(|e| GitHubApiError::ApiError(e.to_string()))
}

pub async fn delete_environment(
    owner: &str,
    repo: &str,
    environment_name: &str,
) -> Result<(), GitHubApiError> {
    let token = get_stored_token().map_err(|e| GitHubApiError::ApiError(e.to_string()))?;
    let client = create_client(&token);

    let url = format!(
        "{}/repos/{}/{}/environments/{}",
        GITHUB_API_URL, owner, repo, environment_name
    );

    let response = client
        .delete(&url)
        .send()
        .await
        .map_err(|e| GitHubApiError::NetworkError(e.to_string()))?;

    if !response.status().is_success() && response.status() != reqwest::StatusCode::NO_CONTENT {
        let error_text = response.text().await.unwrap_or_default();
        return Err(GitHubApiError::ApiError(error_text));
    }

    Ok(())
}

pub async fn list_environment_secrets(
    owner: &str,
    repo: &str,
    environment_name: &str,
) -> Result<EnvironmentSecretsResponse, GitHubApiError> {
    let token = get_stored_token().map_err(|e| GitHubApiError::ApiError(e.to_string()))?;
    let client = create_client(&token);

    let url = format!(
        "{}/repos/{}/{}/environments/{}/secrets",
        GITHUB_API_URL, owner, repo, environment_name
    );

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| GitHubApiError::NetworkError(e.to_string()))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(GitHubApiError::ApiError(error_text));
    }

    response
        .json()
        .await
        .map_err(|e| GitHubApiError::ApiError(e.to_string()))
}

pub async fn list_environment_variables(
    owner: &str,
    repo: &str,
    environment_name: &str,
) -> Result<EnvironmentVariablesResponse, GitHubApiError> {
    let token = get_stored_token().map_err(|e| GitHubApiError::ApiError(e.to_string()))?;
    let client = create_client(&token);

    let url = format!(
        "{}/repos/{}/{}/environments/{}/variables",
        GITHUB_API_URL, owner, repo, environment_name
    );

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| GitHubApiError::NetworkError(e.to_string()))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(GitHubApiError::ApiError(error_text));
    }

    response
        .json()
        .await
        .map_err(|e| GitHubApiError::ApiError(e.to_string()))
}

pub async fn list_deployment_branch_policies(
    owner: &str,
    repo: &str,
    environment_name: &str,
) -> Result<BranchPoliciesResponse, GitHubApiError> {
    let token = get_stored_token().map_err(|e| GitHubApiError::ApiError(e.to_string()))?;
    let client = create_client(&token);

    let url = format!(
        "{}/repos/{}/{}/environments/{}/deployment-branch-policies",
        GITHUB_API_URL, owner, repo, environment_name
    );

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| GitHubApiError::NetworkError(e.to_string()))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(GitHubApiError::ApiError(error_text));
    }

    response
        .json()
        .await
        .map_err(|e| GitHubApiError::ApiError(e.to_string()))
}

pub async fn create_deployment_branch_policy(
    owner: &str,
    repo: &str,
    environment_name: &str,
    name: &str,
    policy_type: Option<&str>,
) -> Result<BranchPolicy, GitHubApiError> {
    let token = get_stored_token().map_err(|e| GitHubApiError::ApiError(e.to_string()))?;
    let client = create_client(&token);

    let url = format!(
        "{}/repos/{}/{}/environments/{}/deployment-branch-policies",
        GITHUB_API_URL, owner, repo, environment_name
    );

    let mut body = serde_json::json!({
        "name": name
    });

    if let Some(pt) = policy_type {
        body["type"] = serde_json::Value::String(pt.to_string());
    }

    let response = client
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| GitHubApiError::NetworkError(e.to_string()))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(GitHubApiError::ApiError(error_text));
    }

    response
        .json()
        .await
        .map_err(|e| GitHubApiError::ApiError(e.to_string()))
}

pub async fn delete_deployment_branch_policy(
    owner: &str,
    repo: &str,
    environment_name: &str,
    branch_policy_id: i64,
) -> Result<(), GitHubApiError> {
    let token = get_stored_token().map_err(|e| GitHubApiError::ApiError(e.to_string()))?;
    let client = create_client(&token);

    let url = format!(
        "{}/repos/{}/{}/environments/{}/deployment-branch-policies/{}",
        GITHUB_API_URL, owner, repo, environment_name, branch_policy_id
    );

    let response = client
        .delete(&url)
        .send()
        .await
        .map_err(|e| GitHubApiError::NetworkError(e.to_string()))?;

    if !response.status().is_success() && response.status() != reqwest::StatusCode::NO_CONTENT {
        let error_text = response.text().await.unwrap_or_default();
        return Err(GitHubApiError::ApiError(error_text));
    }

    Ok(())
}

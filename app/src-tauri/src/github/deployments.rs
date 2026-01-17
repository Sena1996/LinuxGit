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
pub struct DeploymentCreator {
    pub login: String,
    pub id: u64,
    pub avatar_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Deployment {
    pub id: i64,
    pub sha: String,
    #[serde(rename = "ref")]
    pub ref_name: String,
    pub task: String,
    pub environment: String,
    pub description: Option<String>,
    pub creator: Option<DeploymentCreator>,
    pub created_at: String,
    pub updated_at: String,
    pub statuses_url: String,
    pub repository_url: String,
    pub transient_environment: bool,
    pub production_environment: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeploymentStatus {
    pub id: i64,
    pub state: String,
    pub description: Option<String>,
    pub environment: Option<String>,
    pub environment_url: Option<String>,
    pub log_url: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub creator: Option<DeploymentCreator>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateDeploymentRequest {
    #[serde(rename = "ref")]
    pub ref_name: String,
    pub environment: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub auto_merge: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub required_contexts: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transient_environment: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub production_environment: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateDeploymentStatusRequest {
    pub state: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub environment_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub log_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub auto_inactive: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeploymentSummary {
    pub total_count: u32,
    pub environments: Vec<EnvironmentDeploymentStats>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvironmentDeploymentStats {
    pub environment: String,
    pub total: u32,
    pub successful: u32,
    pub failed: u32,
    pub pending: u32,
    pub latest: Option<Deployment>,
}

pub async fn list_deployments(
    owner: &str,
    repo: &str,
    environment: Option<&str>,
    per_page: Option<u32>,
    page: Option<u32>,
) -> Result<Vec<Deployment>, GitHubApiError> {
    let token = get_stored_token().map_err(|e| GitHubApiError::ApiError(e.to_string()))?;
    let client = create_client(&token);

    let mut url = format!(
        "{}/repos/{}/{}/deployments?per_page={}&page={}",
        GITHUB_API_URL,
        owner,
        repo,
        per_page.unwrap_or(30),
        page.unwrap_or(1)
    );

    if let Some(env) = environment {
        url.push_str(&format!("&environment={}", env));
    }

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

pub async fn get_deployment(
    owner: &str,
    repo: &str,
    deployment_id: i64,
) -> Result<Deployment, GitHubApiError> {
    let token = get_stored_token().map_err(|e| GitHubApiError::ApiError(e.to_string()))?;
    let client = create_client(&token);

    let url = format!(
        "{}/repos/{}/{}/deployments/{}",
        GITHUB_API_URL, owner, repo, deployment_id
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

pub async fn create_deployment(
    owner: &str,
    repo: &str,
    request: CreateDeploymentRequest,
) -> Result<Deployment, GitHubApiError> {
    let token = get_stored_token().map_err(|e| GitHubApiError::ApiError(e.to_string()))?;
    let client = create_client(&token);

    let url = format!("{}/repos/{}/{}/deployments", GITHUB_API_URL, owner, repo);

    let response = client
        .post(&url)
        .json(&request)
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

pub async fn delete_deployment(
    owner: &str,
    repo: &str,
    deployment_id: i64,
) -> Result<(), GitHubApiError> {
    let token = get_stored_token().map_err(|e| GitHubApiError::ApiError(e.to_string()))?;
    let client = create_client(&token);

    let url = format!(
        "{}/repos/{}/{}/deployments/{}",
        GITHUB_API_URL, owner, repo, deployment_id
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

pub async fn list_deployment_statuses(
    owner: &str,
    repo: &str,
    deployment_id: i64,
    per_page: Option<u32>,
) -> Result<Vec<DeploymentStatus>, GitHubApiError> {
    let token = get_stored_token().map_err(|e| GitHubApiError::ApiError(e.to_string()))?;
    let client = create_client(&token);

    let url = format!(
        "{}/repos/{}/{}/deployments/{}/statuses?per_page={}",
        GITHUB_API_URL,
        owner,
        repo,
        deployment_id,
        per_page.unwrap_or(30)
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

pub async fn create_deployment_status(
    owner: &str,
    repo: &str,
    deployment_id: i64,
    request: CreateDeploymentStatusRequest,
) -> Result<DeploymentStatus, GitHubApiError> {
    let token = get_stored_token().map_err(|e| GitHubApiError::ApiError(e.to_string()))?;
    let client = create_client(&token);

    let url = format!(
        "{}/repos/{}/{}/deployments/{}/statuses",
        GITHUB_API_URL, owner, repo, deployment_id
    );

    let response = client
        .post(&url)
        .json(&request)
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

pub async fn get_deployment_summary(
    owner: &str,
    repo: &str,
) -> Result<DeploymentSummary, GitHubApiError> {
    let deployments = list_deployments(owner, repo, None, Some(100), None).await?;

    let mut env_map: std::collections::HashMap<String, EnvironmentDeploymentStats> =
        std::collections::HashMap::new();

    for deployment in deployments {
        let env_name = deployment.environment.clone();
        let entry = env_map.entry(env_name.clone()).or_insert(EnvironmentDeploymentStats {
            environment: env_name,
            total: 0,
            successful: 0,
            failed: 0,
            pending: 0,
            latest: None,
        });

        entry.total += 1;

        if entry.latest.is_none() {
            entry.latest = Some(deployment.clone());
        }

        if let Ok(statuses) = list_deployment_statuses(owner, repo, deployment.id, Some(1)).await {
            if let Some(status) = statuses.first() {
                match status.state.as_str() {
                    "success" => entry.successful += 1,
                    "failure" | "error" => entry.failed += 1,
                    "pending" | "queued" | "in_progress" => entry.pending += 1,
                    _ => {}
                }
            }
        }
    }

    Ok(DeploymentSummary {
        total_count: env_map.values().map(|e| e.total).sum(),
        environments: env_map.into_values().collect(),
    })
}

//! GitHub Actions API module
//!
//! Provides access to GitHub Actions workflows, runs, and artifacts.

use serde::{Deserialize, Serialize};
use reqwest::Client;

use super::get_stored_token;

/// GitHub Workflow
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workflow {
    pub id: i64,
    pub name: String,
    pub path: String,
    pub state: String,
    pub created_at: String,
    pub updated_at: String,
    pub badge_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct WorkflowsResponse {
    total_count: i32,
    workflows: Vec<Workflow>,
}

/// GitHub Workflow Run
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowRun {
    pub id: i64,
    pub name: Option<String>,
    pub head_branch: Option<String>,
    pub head_sha: String,
    pub run_number: i32,
    pub event: String,
    pub status: Option<String>,
    pub conclusion: Option<String>,
    pub workflow_id: i64,
    pub created_at: String,
    pub updated_at: String,
    pub html_url: String,
    pub jobs_url: String,
    pub logs_url: String,
    pub run_started_at: Option<String>,
    pub actor: Option<GitHubActor>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubActor {
    pub login: String,
    pub avatar_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct WorkflowRunsResponse {
    total_count: i32,
    workflow_runs: Vec<WorkflowRun>,
}

/// GitHub Workflow Job
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowJob {
    pub id: i64,
    pub run_id: i64,
    pub name: String,
    pub status: String,
    pub conclusion: Option<String>,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
    pub steps: Option<Vec<WorkflowStep>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowStep {
    pub name: String,
    pub status: String,
    pub conclusion: Option<String>,
    pub number: i32,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct JobsResponse {
    total_count: i32,
    jobs: Vec<WorkflowJob>,
}

/// GitHub Artifact
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Artifact {
    pub id: i64,
    pub name: String,
    pub size_in_bytes: i64,
    pub archive_download_url: String,
    pub expired: bool,
    pub created_at: String,
    pub updated_at: String,
    pub expires_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ArtifactsResponse {
    total_count: i32,
    artifacts: Vec<Artifact>,
}

/// Error type for actions API
#[derive(Debug)]
pub struct ActionsError(pub String);

impl std::fmt::Display for ActionsError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl std::error::Error for ActionsError {}

pub type ActionsResult<T> = Result<T, ActionsError>;

fn get_client() -> ActionsResult<(Client, String)> {
    let token = get_stored_token().map_err(|e| ActionsError(e.to_string()))?;
    let client = Client::new();
    Ok((client, token))
}

/// List all workflows for a repository
pub async fn list_workflows(owner: &str, repo: &str) -> ActionsResult<Vec<Workflow>> {
    let (client, token) = get_client()?;

    let url = format!("https://api.github.com/repos/{}/{}/actions/workflows", owner, repo);

    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| ActionsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ActionsError(format!("GitHub API error ({}): {}", status, text)));
    }

    let data: WorkflowsResponse = response
        .json()
        .await
        .map_err(|e| ActionsError(format!("Failed to parse response: {}", e)))?;

    Ok(data.workflows)
}

/// List workflow runs for a repository or specific workflow
pub async fn list_workflow_runs(
    owner: &str,
    repo: &str,
    workflow_id: Option<i64>,
    branch: Option<&str>,
    status: Option<&str>,
    per_page: Option<u32>,
) -> ActionsResult<Vec<WorkflowRun>> {
    let (client, token) = get_client()?;

    let url = if let Some(wid) = workflow_id {
        format!(
            "https://api.github.com/repos/{}/{}/actions/workflows/{}/runs",
            owner, repo, wid
        )
    } else {
        format!("https://api.github.com/repos/{}/{}/actions/runs", owner, repo)
    };

    let mut request = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28");

    if let Some(b) = branch {
        request = request.query(&[("branch", b)]);
    }
    if let Some(s) = status {
        request = request.query(&[("status", s)]);
    }
    if let Some(pp) = per_page {
        request = request.query(&[("per_page", pp.to_string())]);
    }

    let response = request
        .send()
        .await
        .map_err(|e| ActionsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ActionsError(format!("GitHub API error ({}): {}", status, text)));
    }

    let data: WorkflowRunsResponse = response
        .json()
        .await
        .map_err(|e| ActionsError(format!("Failed to parse response: {}", e)))?;

    Ok(data.workflow_runs)
}

/// Get a specific workflow run
pub async fn get_workflow_run(owner: &str, repo: &str, run_id: i64) -> ActionsResult<WorkflowRun> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/actions/runs/{}",
        owner, repo, run_id
    );

    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| ActionsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ActionsError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| ActionsError(format!("Failed to parse response: {}", e)))
}

/// Get jobs for a workflow run
pub async fn get_workflow_run_jobs(
    owner: &str,
    repo: &str,
    run_id: i64,
) -> ActionsResult<Vec<WorkflowJob>> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/actions/runs/{}/jobs",
        owner, repo, run_id
    );

    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| ActionsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ActionsError(format!("GitHub API error ({}): {}", status, text)));
    }

    let data: JobsResponse = response
        .json()
        .await
        .map_err(|e| ActionsError(format!("Failed to parse response: {}", e)))?;

    Ok(data.jobs)
}

/// Get logs for a workflow run (returns download URL)
pub async fn get_workflow_run_logs(owner: &str, repo: &str, run_id: i64) -> ActionsResult<String> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/actions/runs/{}/logs",
        owner, repo, run_id
    );

    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| ActionsError(format!("Request failed: {}", e)))?;

    // GitHub returns a 302 redirect to the download URL
    if response.status().is_redirection() {
        if let Some(location) = response.headers().get("Location") {
            return location
                .to_str()
                .map(|s| s.to_string())
                .map_err(|_| ActionsError("Invalid redirect URL".to_string()));
        }
    }

    // If we followed the redirect automatically, return the final URL
    Ok(response.url().to_string())
}

/// Trigger a workflow dispatch event
pub async fn trigger_workflow(
    owner: &str,
    repo: &str,
    workflow_id: i64,
    ref_name: &str,
    inputs: Option<serde_json::Value>,
) -> ActionsResult<()> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/actions/workflows/{}/dispatches",
        owner, repo, workflow_id
    );

    let mut body = serde_json::json!({
        "ref": ref_name
    });

    if let Some(inp) = inputs {
        body["inputs"] = inp;
    }

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .json(&body)
        .send()
        .await
        .map_err(|e| ActionsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ActionsError(format!("GitHub API error ({}): {}", status, text)));
    }

    Ok(())
}

/// Cancel a workflow run
pub async fn cancel_workflow_run(owner: &str, repo: &str, run_id: i64) -> ActionsResult<()> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/actions/runs/{}/cancel",
        owner, repo, run_id
    );

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| ActionsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ActionsError(format!("GitHub API error ({}): {}", status, text)));
    }

    Ok(())
}

/// Re-run a workflow
pub async fn rerun_workflow(owner: &str, repo: &str, run_id: i64) -> ActionsResult<()> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/actions/runs/{}/rerun",
        owner, repo, run_id
    );

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| ActionsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ActionsError(format!("GitHub API error ({}): {}", status, text)));
    }

    Ok(())
}

/// Re-run failed jobs only
pub async fn rerun_failed_jobs(owner: &str, repo: &str, run_id: i64) -> ActionsResult<()> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/actions/runs/{}/rerun-failed-jobs",
        owner, repo, run_id
    );

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| ActionsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ActionsError(format!("GitHub API error ({}): {}", status, text)));
    }

    Ok(())
}

/// List artifacts for a workflow run
pub async fn list_run_artifacts(
    owner: &str,
    repo: &str,
    run_id: i64,
) -> ActionsResult<Vec<Artifact>> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/actions/runs/{}/artifacts",
        owner, repo, run_id
    );

    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| ActionsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ActionsError(format!("GitHub API error ({}): {}", status, text)));
    }

    let data: ArtifactsResponse = response
        .json()
        .await
        .map_err(|e| ActionsError(format!("Failed to parse response: {}", e)))?;

    Ok(data.artifacts)
}

/// List all artifacts for a repository
pub async fn list_repo_artifacts(owner: &str, repo: &str) -> ActionsResult<Vec<Artifact>> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/actions/artifacts",
        owner, repo
    );

    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| ActionsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ActionsError(format!("GitHub API error ({}): {}", status, text)));
    }

    let data: ArtifactsResponse = response
        .json()
        .await
        .map_err(|e| ActionsError(format!("Failed to parse response: {}", e)))?;

    Ok(data.artifacts)
}

/// Get download URL for an artifact
pub async fn get_artifact_download_url(
    owner: &str,
    repo: &str,
    artifact_id: i64,
) -> ActionsResult<String> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/actions/artifacts/{}/zip",
        owner, repo, artifact_id
    );

    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| ActionsError(format!("Request failed: {}", e)))?;

    // GitHub returns a 302 redirect to the download URL
    Ok(response.url().to_string())
}

/// Delete an artifact
pub async fn delete_artifact(owner: &str, repo: &str, artifact_id: i64) -> ActionsResult<()> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/actions/artifacts/{}",
        owner, repo, artifact_id
    );

    let response = client
        .delete(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| ActionsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ActionsError(format!("GitHub API error ({}): {}", status, text)));
    }

    Ok(())
}

/// Delete a workflow run
pub async fn delete_workflow_run(owner: &str, repo: &str, run_id: i64) -> ActionsResult<()> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/actions/runs/{}",
        owner, repo, run_id
    );

    let response = client
        .delete(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| ActionsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ActionsError(format!("GitHub API error ({}): {}", status, text)));
    }

    Ok(())
}

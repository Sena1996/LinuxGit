//! GitHub Pages API module
//!
//! Provides access to GitHub Pages configuration and deployments.

use serde::{Deserialize, Serialize};
use reqwest::Client;

use super::get_stored_token;

/// GitHub Pages information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PagesInfo {
    pub url: Option<String>,
    pub status: Option<String>,
    pub cname: Option<String>,
    pub custom_404: bool,
    pub html_url: Option<String>,
    pub build_type: Option<String>,
    pub source: Option<PagesSource>,
    pub public: bool,
    pub https_certificate: Option<HttpsCertificate>,
    pub https_enforced: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PagesSource {
    pub branch: String,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HttpsCertificate {
    pub state: String,
    pub description: String,
    pub domains: Vec<String>,
    pub expires_at: Option<String>,
}

/// GitHub Pages build
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PagesBuild {
    pub url: String,
    pub status: String,
    pub error: Option<PagesError>,
    pub pusher: Option<PagesPusher>,
    pub commit: String,
    pub duration: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PagesError {
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PagesPusher {
    pub login: String,
    pub avatar_url: String,
}

/// GitHub Pages deployment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PagesDeployment {
    pub id: i64,
    pub status_url: String,
    pub page_url: String,
}

/// Pages health check
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PagesHealthCheck {
    pub domain: Option<HealthCheckDomain>,
    pub alt_domain: Option<HealthCheckDomain>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheckDomain {
    pub host: String,
    pub uri: String,
    pub nameservers: String,
    pub dns_resolves: bool,
    pub is_proxied: Option<bool>,
    pub is_cloudflare_ip: Option<bool>,
    pub is_fastly_ip: Option<bool>,
    pub is_old_ip_address: Option<bool>,
    pub is_a_record: Option<bool>,
    pub has_cname_record: Option<bool>,
    pub has_mx_records_present: Option<bool>,
    pub is_valid_domain: bool,
    pub is_apex_domain: bool,
    pub should_be_a_record: Option<bool>,
    pub is_cname_to_github_user_domain: Option<bool>,
    pub is_cname_to_pages_dot_github_dot_com: Option<bool>,
    pub is_cname_to_fastly: Option<bool>,
    pub is_pointed_to_github_pages_ip: Option<bool>,
    pub is_non_github_pages_ip_present: Option<bool>,
    pub is_pages_domain: bool,
    pub is_served_by_pages: Option<bool>,
    pub is_valid: bool,
    pub reason: Option<String>,
    pub responds_to_https: bool,
    pub enforces_https: bool,
    pub https_error: Option<String>,
    pub is_https_eligible: Option<bool>,
    pub caa_error: Option<String>,
}

/// Error type for pages API
#[derive(Debug)]
pub struct PagesError2(pub String);

impl std::fmt::Display for PagesError2 {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl std::error::Error for PagesError2 {}

pub type PagesResult<T> = Result<T, PagesError2>;

fn get_client() -> PagesResult<(Client, String)> {
    let token = get_stored_token().map_err(|e| PagesError2(e.to_string()))?;
    let client = Client::new();
    Ok((client, token))
}

/// Get GitHub Pages information for a repository
pub async fn get_pages_info(owner: &str, repo: &str) -> PagesResult<PagesInfo> {
    let (client, token) = get_client()?;

    let url = format!("https://api.github.com/repos/{}/{}/pages", owner, repo);

    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| PagesError2(format!("Request failed: {}", e)))?;

    if response.status().as_u16() == 404 {
        return Err(PagesError2("GitHub Pages not enabled for this repository".to_string()));
    }

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(PagesError2(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| PagesError2(format!("Failed to parse response: {}", e)))
}

/// Enable GitHub Pages for a repository
pub async fn enable_pages(
    owner: &str,
    repo: &str,
    branch: &str,
    path: &str,
) -> PagesResult<PagesInfo> {
    let (client, token) = get_client()?;

    let url = format!("https://api.github.com/repos/{}/{}/pages", owner, repo);

    let body = serde_json::json!({
        "source": {
            "branch": branch,
            "path": path
        }
    });

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .json(&body)
        .send()
        .await
        .map_err(|e| PagesError2(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(PagesError2(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| PagesError2(format!("Failed to parse response: {}", e)))
}

/// Update GitHub Pages configuration
pub async fn update_pages(
    owner: &str,
    repo: &str,
    cname: Option<&str>,
    https_enforced: Option<bool>,
    build_type: Option<&str>,
    source_branch: Option<&str>,
    source_path: Option<&str>,
) -> PagesResult<()> {
    let (client, token) = get_client()?;

    let url = format!("https://api.github.com/repos/{}/{}/pages", owner, repo);

    let mut body = serde_json::json!({});

    if let Some(c) = cname {
        body["cname"] = serde_json::json!(c);
    }
    if let Some(https) = https_enforced {
        body["https_enforced"] = serde_json::json!(https);
    }
    if let Some(bt) = build_type {
        body["build_type"] = serde_json::json!(bt);
    }
    if source_branch.is_some() || source_path.is_some() {
        let mut source = serde_json::json!({});
        if let Some(sb) = source_branch {
            source["branch"] = serde_json::json!(sb);
        }
        if let Some(sp) = source_path {
            source["path"] = serde_json::json!(sp);
        }
        body["source"] = source;
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
        .map_err(|e| PagesError2(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(PagesError2(format!("GitHub API error ({}): {}", status, text)));
    }

    Ok(())
}

/// Disable GitHub Pages for a repository
pub async fn disable_pages(owner: &str, repo: &str) -> PagesResult<()> {
    let (client, token) = get_client()?;

    let url = format!("https://api.github.com/repos/{}/{}/pages", owner, repo);

    let response = client
        .delete(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| PagesError2(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(PagesError2(format!("GitHub API error ({}): {}", status, text)));
    }

    Ok(())
}

/// List GitHub Pages builds
pub async fn list_pages_builds(
    owner: &str,
    repo: &str,
    per_page: Option<u32>,
    page: Option<u32>,
) -> PagesResult<Vec<PagesBuild>> {
    let (client, token) = get_client()?;

    let url = format!("https://api.github.com/repos/{}/{}/pages/builds", owner, repo);

    let mut request = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28");

    if let Some(pp) = per_page {
        request = request.query(&[("per_page", pp.to_string())]);
    }
    if let Some(p) = page {
        request = request.query(&[("page", p.to_string())]);
    }

    let response = request
        .send()
        .await
        .map_err(|e| PagesError2(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(PagesError2(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| PagesError2(format!("Failed to parse response: {}", e)))
}

/// Get the latest GitHub Pages build
pub async fn get_latest_pages_build(owner: &str, repo: &str) -> PagesResult<PagesBuild> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/pages/builds/latest",
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
        .map_err(|e| PagesError2(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(PagesError2(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| PagesError2(format!("Failed to parse response: {}", e)))
}

/// Get a specific GitHub Pages build
pub async fn get_pages_build(owner: &str, repo: &str, build_id: i64) -> PagesResult<PagesBuild> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/pages/builds/{}",
        owner, repo, build_id
    );

    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| PagesError2(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(PagesError2(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| PagesError2(format!("Failed to parse response: {}", e)))
}

/// Request a GitHub Pages build
pub async fn request_pages_build(owner: &str, repo: &str) -> PagesResult<PagesBuild> {
    let (client, token) = get_client()?;

    let url = format!("https://api.github.com/repos/{}/{}/pages/builds", owner, repo);

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| PagesError2(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(PagesError2(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| PagesError2(format!("Failed to parse response: {}", e)))
}

/// Get a DNS health check for GitHub Pages
pub async fn get_pages_health_check(owner: &str, repo: &str) -> PagesResult<PagesHealthCheck> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/pages/health",
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
        .map_err(|e| PagesError2(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(PagesError2(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| PagesError2(format!("Failed to parse response: {}", e)))
}

/// Create a GitHub Pages deployment
pub async fn create_pages_deployment(
    owner: &str,
    repo: &str,
    artifact_id: Option<&str>,
    pages_build_version: &str,
    oidc_token: &str,
) -> PagesResult<PagesDeployment> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/pages/deployments",
        owner, repo
    );

    let mut body = serde_json::json!({
        "pages_build_version": pages_build_version,
        "oidc_token": oidc_token
    });

    if let Some(aid) = artifact_id {
        body["artifact_id"] = serde_json::json!(aid);
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
        .map_err(|e| PagesError2(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(PagesError2(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| PagesError2(format!("Failed to parse response: {}", e)))
}

/// Get deployment status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeploymentStatus {
    pub status: Option<String>,
}

pub async fn get_deployment_status(
    owner: &str,
    repo: &str,
    deployment_id: i64,
) -> PagesResult<DeploymentStatus> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/pages/deployments/{}",
        owner, repo, deployment_id
    );

    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| PagesError2(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(PagesError2(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| PagesError2(format!("Failed to parse response: {}", e)))
}

/// Cancel a pending deployment
pub async fn cancel_deployment(owner: &str, repo: &str, deployment_id: i64) -> PagesResult<()> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/pages/deployments/{}/cancel",
        owner, repo, deployment_id
    );

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| PagesError2(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(PagesError2(format!("GitHub API error ({}): {}", status, text)));
    }

    Ok(())
}

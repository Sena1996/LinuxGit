//! GitHub Releases API module
//!
//! Provides access to GitHub releases and release assets.

use serde::{Deserialize, Serialize};
use reqwest::Client;

use super::get_stored_token;

/// GitHub Release
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Release {
    pub id: i64,
    pub tag_name: String,
    pub name: Option<String>,
    pub body: Option<String>,
    pub draft: bool,
    pub prerelease: bool,
    pub created_at: String,
    pub published_at: Option<String>,
    pub html_url: String,
    pub tarball_url: Option<String>,
    pub zipball_url: Option<String>,
    pub author: Option<ReleaseAuthor>,
    pub assets: Vec<ReleaseAsset>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReleaseAuthor {
    pub login: String,
    pub avatar_url: String,
}

/// GitHub Release Asset
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReleaseAsset {
    pub id: i64,
    pub name: String,
    pub label: Option<String>,
    pub content_type: String,
    pub size: i64,
    pub download_count: i64,
    pub browser_download_url: String,
    pub created_at: String,
    pub updated_at: String,
}

/// Create release request
#[derive(Debug, Clone, Serialize)]
pub struct CreateReleaseRequest {
    pub tag_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_commitish: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub draft: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prerelease: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub generate_release_notes: Option<bool>,
}

/// Update release request
#[derive(Debug, Clone, Serialize)]
pub struct UpdateReleaseRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tag_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_commitish: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub draft: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prerelease: Option<bool>,
}

/// Error type for releases API
#[derive(Debug)]
pub struct ReleasesError(pub String);

impl std::fmt::Display for ReleasesError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl std::error::Error for ReleasesError {}

pub type ReleasesResult<T> = Result<T, ReleasesError>;

fn get_client() -> ReleasesResult<(Client, String)> {
    let token = get_stored_token().map_err(|e| ReleasesError(e.to_string()))?;
    let client = Client::new();
    Ok((client, token))
}

/// List releases for a repository
pub async fn list_releases(
    owner: &str,
    repo: &str,
    per_page: Option<u32>,
    page: Option<u32>,
) -> ReleasesResult<Vec<Release>> {
    let (client, token) = get_client()?;

    let url = format!("https://api.github.com/repos/{}/{}/releases", owner, repo);

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
        .map_err(|e| ReleasesError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ReleasesError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| ReleasesError(format!("Failed to parse response: {}", e)))
}

/// Get a specific release by ID
pub async fn get_release(owner: &str, repo: &str, release_id: i64) -> ReleasesResult<Release> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/releases/{}",
        owner, repo, release_id
    );

    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| ReleasesError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ReleasesError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| ReleasesError(format!("Failed to parse response: {}", e)))
}

/// Get the latest release
pub async fn get_latest_release(owner: &str, repo: &str) -> ReleasesResult<Release> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/releases/latest",
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
        .map_err(|e| ReleasesError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ReleasesError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| ReleasesError(format!("Failed to parse response: {}", e)))
}

/// Get a release by tag name
pub async fn get_release_by_tag(owner: &str, repo: &str, tag: &str) -> ReleasesResult<Release> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/releases/tags/{}",
        owner, repo, tag
    );

    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| ReleasesError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ReleasesError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| ReleasesError(format!("Failed to parse response: {}", e)))
}

/// Create a new release
pub async fn create_release(
    owner: &str,
    repo: &str,
    request: CreateReleaseRequest,
) -> ReleasesResult<Release> {
    let (client, token) = get_client()?;

    let url = format!("https://api.github.com/repos/{}/{}/releases", owner, repo);

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .json(&request)
        .send()
        .await
        .map_err(|e| ReleasesError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ReleasesError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| ReleasesError(format!("Failed to parse response: {}", e)))
}

/// Update a release
pub async fn update_release(
    owner: &str,
    repo: &str,
    release_id: i64,
    request: UpdateReleaseRequest,
) -> ReleasesResult<Release> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/releases/{}",
        owner, repo, release_id
    );

    let response = client
        .patch(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .json(&request)
        .send()
        .await
        .map_err(|e| ReleasesError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ReleasesError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| ReleasesError(format!("Failed to parse response: {}", e)))
}

/// Delete a release
pub async fn delete_release(owner: &str, repo: &str, release_id: i64) -> ReleasesResult<()> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/releases/{}",
        owner, repo, release_id
    );

    let response = client
        .delete(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| ReleasesError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ReleasesError(format!("GitHub API error ({}): {}", status, text)));
    }

    Ok(())
}

/// Generate release notes
pub async fn generate_release_notes(
    owner: &str,
    repo: &str,
    tag_name: &str,
    target_commitish: Option<&str>,
    previous_tag_name: Option<&str>,
) -> ReleasesResult<String> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/releases/generate-notes",
        owner, repo
    );

    let mut body = serde_json::json!({
        "tag_name": tag_name
    });

    if let Some(tc) = target_commitish {
        body["target_commitish"] = serde_json::json!(tc);
    }
    if let Some(pt) = previous_tag_name {
        body["previous_tag_name"] = serde_json::json!(pt);
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
        .map_err(|e| ReleasesError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ReleasesError(format!("GitHub API error ({}): {}", status, text)));
    }

    #[derive(Deserialize)]
    struct NotesResponse {
        #[allow(dead_code)]
        name: String,
        body: String,
    }

    let notes: NotesResponse = response
        .json()
        .await
        .map_err(|e| ReleasesError(format!("Failed to parse response: {}", e)))?;

    Ok(notes.body)
}

/// List release assets
pub async fn list_release_assets(
    owner: &str,
    repo: &str,
    release_id: i64,
) -> ReleasesResult<Vec<ReleaseAsset>> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/releases/{}/assets",
        owner, repo, release_id
    );

    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| ReleasesError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ReleasesError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| ReleasesError(format!("Failed to parse response: {}", e)))
}

/// Get a release asset
pub async fn get_release_asset(
    owner: &str,
    repo: &str,
    asset_id: i64,
) -> ReleasesResult<ReleaseAsset> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/releases/assets/{}",
        owner, repo, asset_id
    );

    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| ReleasesError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ReleasesError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| ReleasesError(format!("Failed to parse response: {}", e)))
}

/// Update a release asset
pub async fn update_release_asset(
    owner: &str,
    repo: &str,
    asset_id: i64,
    name: Option<&str>,
    label: Option<&str>,
) -> ReleasesResult<ReleaseAsset> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/releases/assets/{}",
        owner, repo, asset_id
    );

    let mut body = serde_json::json!({});
    if let Some(n) = name {
        body["name"] = serde_json::json!(n);
    }
    if let Some(l) = label {
        body["label"] = serde_json::json!(l);
    }

    let response = client
        .patch(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .json(&body)
        .send()
        .await
        .map_err(|e| ReleasesError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ReleasesError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| ReleasesError(format!("Failed to parse response: {}", e)))
}

/// Delete a release asset
pub async fn delete_release_asset(owner: &str, repo: &str, asset_id: i64) -> ReleasesResult<()> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/releases/assets/{}",
        owner, repo, asset_id
    );

    let response = client
        .delete(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|e| ReleasesError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ReleasesError(format!("GitHub API error ({}): {}", status, text)));
    }

    Ok(())
}

/// Upload a release asset
pub async fn upload_release_asset(
    upload_url: &str,
    file_path: &str,
    content_type: &str,
) -> ReleasesResult<ReleaseAsset> {
    let token = get_stored_token().map_err(|e| ReleasesError(e.to_string()))?;
    let client = Client::new();

    // Read file
    let file_content = std::fs::read(file_path)
        .map_err(|e| ReleasesError(format!("Failed to read file: {}", e)))?;

    let file_name = std::path::Path::new(file_path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("asset");

    // Parse the upload URL and add the name parameter
    // GitHub upload URLs look like: https://uploads.github.com/repos/owner/repo/releases/123/assets{?name,label}
    let base_url = upload_url.split('{').next().unwrap_or(upload_url);
    let url = format!("{}?name={}", base_url, urlencoding::encode(file_name));

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "LinuxGit")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .header("Content-Type", content_type)
        .body(file_content)
        .send()
        .await
        .map_err(|e| ReleasesError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ReleasesError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| ReleasesError(format!("Failed to parse response: {}", e)))
}

/// List tags for a repository
pub async fn list_tags(
    owner: &str,
    repo: &str,
    per_page: Option<u32>,
    page: Option<u32>,
) -> ReleasesResult<Vec<Tag>> {
    let (client, token) = get_client()?;

    let url = format!("https://api.github.com/repos/{}/{}/tags", owner, repo);

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
        .map_err(|e| ReleasesError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(ReleasesError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| ReleasesError(format!("Failed to parse response: {}", e)))
}

/// GitHub Tag
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    pub name: String,
    pub zipball_url: String,
    pub tarball_url: String,
    pub commit: TagCommit,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagCommit {
    pub sha: String,
    pub url: String,
}

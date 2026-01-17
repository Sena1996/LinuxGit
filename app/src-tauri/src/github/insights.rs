//! GitHub Repository Insights API module
//!
//! Provides access to repository statistics and traffic data.

use serde::{Deserialize, Serialize};
use reqwest::Client;

use super::get_stored_token;

/// Repository contributor
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Contributor {
    pub author: Option<ContributorAuthor>,
    pub total: i32,
    pub weeks: Vec<ContributorWeek>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContributorAuthor {
    pub login: String,
    pub id: i64,
    pub avatar_url: String,
    pub html_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContributorWeek {
    #[serde(rename = "w")]
    pub week: i64, // Unix timestamp
    #[serde(rename = "a")]
    pub additions: i32,
    #[serde(rename = "d")]
    pub deletions: i32,
    #[serde(rename = "c")]
    pub commits: i32,
}

/// Weekly commit activity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitActivity {
    pub days: Vec<i32>,  // Commits per day (Sun-Sat)
    pub total: i32,      // Total commits for the week
    pub week: i64,       // Unix timestamp for start of week
}

/// Code frequency stats (additions/deletions per week)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeFrequency {
    pub week: i64,       // Unix timestamp
    pub additions: i32,
    pub deletions: i32,
}

/// Repository participation stats
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Participation {
    pub all: Vec<i32>,    // Commits per week for all users
    pub owner: Vec<i32>,  // Commits per week for owner
}

/// Punch card data (commits by day and hour)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PunchCard {
    pub day: i32,     // 0-6 (Sun-Sat)
    pub hour: i32,    // 0-23
    pub commits: i32,
}

/// Traffic views
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrafficViews {
    pub count: i32,
    pub uniques: i32,
    pub views: Vec<TrafficViewEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrafficViewEntry {
    pub timestamp: String,
    pub count: i32,
    pub uniques: i32,
}

/// Traffic clones
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrafficClones {
    pub count: i32,
    pub uniques: i32,
    pub clones: Vec<TrafficCloneEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrafficCloneEntry {
    pub timestamp: String,
    pub count: i32,
    pub uniques: i32,
}

/// Top referrer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Referrer {
    pub referrer: String,
    pub count: i32,
    pub uniques: i32,
}

/// Popular content path
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PopularPath {
    pub path: String,
    pub title: String,
    pub count: i32,
    pub uniques: i32,
}

/// Community profile
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommunityProfile {
    pub health_percentage: i32,
    pub description: Option<String>,
    pub documentation: Option<String>,
    pub files: CommunityFiles,
    pub updated_at: Option<String>,
    pub content_reports_enabled: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommunityFiles {
    pub code_of_conduct: Option<CommunityFile>,
    pub code_of_conduct_file: Option<CommunityFile>,
    pub contributing: Option<CommunityFile>,
    pub issue_template: Option<CommunityFile>,
    pub pull_request_template: Option<CommunityFile>,
    pub license: Option<CommunityFile>,
    pub readme: Option<CommunityFile>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommunityFile {
    pub url: String,
    pub html_url: String,
}

/// Error type for insights API
#[derive(Debug)]
pub struct InsightsError(pub String);

impl std::fmt::Display for InsightsError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl std::error::Error for InsightsError {}

pub type InsightsResult<T> = Result<T, InsightsError>;

fn get_client() -> InsightsResult<(Client, String)> {
    let token = get_stored_token().map_err(|e| InsightsError(e.to_string()))?;
    let client = Client::new();
    Ok((client, token))
}

/// Get contributors list with stats
pub async fn get_contributors(owner: &str, repo: &str) -> InsightsResult<Vec<Contributor>> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/stats/contributors",
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
        .map_err(|e| InsightsError(format!("Request failed: {}", e)))?;

    // GitHub may return 202 if stats are being computed
    if response.status().as_u16() == 202 {
        return Err(InsightsError("Statistics are being computed. Please try again later.".to_string()));
    }

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(InsightsError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| InsightsError(format!("Failed to parse response: {}", e)))
}

/// Get weekly commit activity
pub async fn get_commit_activity(owner: &str, repo: &str) -> InsightsResult<Vec<CommitActivity>> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/stats/commit_activity",
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
        .map_err(|e| InsightsError(format!("Request failed: {}", e)))?;

    // GitHub may return 202 if stats are being computed
    if response.status().as_u16() == 202 {
        return Err(InsightsError("Statistics are being computed. Please try again later.".to_string()));
    }

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(InsightsError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| InsightsError(format!("Failed to parse response: {}", e)))
}

/// Get code frequency stats (additions/deletions per week)
pub async fn get_code_frequency(owner: &str, repo: &str) -> InsightsResult<Vec<CodeFrequency>> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/stats/code_frequency",
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
        .map_err(|e| InsightsError(format!("Request failed: {}", e)))?;

    // GitHub may return 202 if stats are being computed
    if response.status().as_u16() == 202 {
        return Err(InsightsError("Statistics are being computed. Please try again later.".to_string()));
    }

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(InsightsError(format!("GitHub API error ({}): {}", status, text)));
    }

    // Response is an array of [timestamp, additions, deletions]
    let raw: Vec<Vec<i64>> = response
        .json()
        .await
        .map_err(|e| InsightsError(format!("Failed to parse response: {}", e)))?;

    Ok(raw
        .into_iter()
        .map(|item| CodeFrequency {
            week: item.first().copied().unwrap_or(0),
            additions: item.get(1).copied().unwrap_or(0) as i32,
            deletions: item.get(2).copied().unwrap_or(0) as i32,
        })
        .collect())
}

/// Get participation stats
pub async fn get_participation(owner: &str, repo: &str) -> InsightsResult<Participation> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/stats/participation",
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
        .map_err(|e| InsightsError(format!("Request failed: {}", e)))?;

    // GitHub may return 202 if stats are being computed
    if response.status().as_u16() == 202 {
        return Err(InsightsError("Statistics are being computed. Please try again later.".to_string()));
    }

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(InsightsError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| InsightsError(format!("Failed to parse response: {}", e)))
}

/// Get punch card data (commits by day and hour)
pub async fn get_punch_card(owner: &str, repo: &str) -> InsightsResult<Vec<PunchCard>> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/stats/punch_card",
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
        .map_err(|e| InsightsError(format!("Request failed: {}", e)))?;

    // GitHub may return 202 if stats are being computed
    if response.status().as_u16() == 202 {
        return Err(InsightsError("Statistics are being computed. Please try again later.".to_string()));
    }

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(InsightsError(format!("GitHub API error ({}): {}", status, text)));
    }

    // Response is an array of [day, hour, commits]
    let raw: Vec<Vec<i32>> = response
        .json()
        .await
        .map_err(|e| InsightsError(format!("Failed to parse response: {}", e)))?;

    Ok(raw
        .into_iter()
        .map(|item| PunchCard {
            day: item.first().copied().unwrap_or(0),
            hour: item.get(1).copied().unwrap_or(0),
            commits: item.get(2).copied().unwrap_or(0),
        })
        .collect())
}

/// Get traffic views (last 14 days)
pub async fn get_traffic_views(owner: &str, repo: &str) -> InsightsResult<TrafficViews> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/traffic/views",
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
        .map_err(|e| InsightsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(InsightsError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| InsightsError(format!("Failed to parse response: {}", e)))
}

/// Get traffic clones (last 14 days)
pub async fn get_traffic_clones(owner: &str, repo: &str) -> InsightsResult<TrafficClones> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/traffic/clones",
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
        .map_err(|e| InsightsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(InsightsError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| InsightsError(format!("Failed to parse response: {}", e)))
}

/// Get top referral sources
pub async fn get_top_referrers(owner: &str, repo: &str) -> InsightsResult<Vec<Referrer>> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/traffic/popular/referrers",
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
        .map_err(|e| InsightsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(InsightsError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| InsightsError(format!("Failed to parse response: {}", e)))
}

/// Get popular content paths
pub async fn get_popular_paths(owner: &str, repo: &str) -> InsightsResult<Vec<PopularPath>> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/traffic/popular/paths",
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
        .map_err(|e| InsightsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(InsightsError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| InsightsError(format!("Failed to parse response: {}", e)))
}

/// Get community profile
pub async fn get_community_profile(owner: &str, repo: &str) -> InsightsResult<CommunityProfile> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/community/profile",
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
        .map_err(|e| InsightsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(InsightsError(format!("GitHub API error ({}): {}", status, text)));
    }

    response
        .json()
        .await
        .map_err(|e| InsightsError(format!("Failed to parse response: {}", e)))
}

/// Repository languages
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Languages(pub std::collections::HashMap<String, i64>);

/// Get repository languages
pub async fn get_languages(owner: &str, repo: &str) -> InsightsResult<Languages> {
    let (client, token) = get_client()?;

    let url = format!(
        "https://api.github.com/repos/{}/{}/languages",
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
        .map_err(|e| InsightsError(format!("Request failed: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(InsightsError(format!("GitHub API error ({}): {}", status, text)));
    }

    let map: std::collections::HashMap<String, i64> = response
        .json()
        .await
        .map_err(|e| InsightsError(format!("Failed to parse response: {}", e)))?;

    Ok(Languages(map))
}

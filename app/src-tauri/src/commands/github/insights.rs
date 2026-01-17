use crate::github::insights::{
    Contributor, CommitActivity, CodeFrequency, Participation, PunchCard,
    TrafficViews, TrafficClones, Referrer, PopularPath, CommunityProfile, Languages,
};

#[tauri::command]
pub async fn github_get_contributors(owner: String, repo: String) -> Result<Vec<Contributor>, String> {
    crate::github::insights::get_contributors(&owner, &repo)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_commit_activity(
    owner: String,
    repo: String,
) -> Result<Vec<CommitActivity>, String> {
    crate::github::insights::get_commit_activity(&owner, &repo)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_code_frequency(
    owner: String,
    repo: String,
) -> Result<Vec<CodeFrequency>, String> {
    crate::github::insights::get_code_frequency(&owner, &repo)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_participation(owner: String, repo: String) -> Result<Participation, String> {
    crate::github::insights::get_participation(&owner, &repo)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_punch_card(owner: String, repo: String) -> Result<Vec<PunchCard>, String> {
    crate::github::insights::get_punch_card(&owner, &repo)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_traffic_views(owner: String, repo: String) -> Result<TrafficViews, String> {
    crate::github::insights::get_traffic_views(&owner, &repo)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_traffic_clones(owner: String, repo: String) -> Result<TrafficClones, String> {
    crate::github::insights::get_traffic_clones(&owner, &repo)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_top_referrers(owner: String, repo: String) -> Result<Vec<Referrer>, String> {
    crate::github::insights::get_top_referrers(&owner, &repo)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_popular_paths(owner: String, repo: String) -> Result<Vec<PopularPath>, String> {
    crate::github::insights::get_popular_paths(&owner, &repo)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_community_profile(
    owner: String,
    repo: String,
) -> Result<CommunityProfile, String> {
    crate::github::insights::get_community_profile(&owner, &repo)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_languages(owner: String, repo: String) -> Result<Languages, String> {
    crate::github::insights::get_languages(&owner, &repo)
        .await
        .map_err(|e| e.to_string())
}

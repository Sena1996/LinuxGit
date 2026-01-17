use crate::github::{self, GitHubAuthStatus, GitHubUser, GitHubRepo};

#[tauri::command]
pub async fn github_login() -> Result<GitHubAuthStatus, String> {
    use std::sync::mpsc::RecvTimeoutError;
    use std::time::Duration;

    let rx = github::start_oauth_flow();

    let code = match rx.recv_timeout(Duration::from_secs(300)) {
        Ok(Ok(code)) => code,
        Ok(Err(e)) => return Err(e.to_string()),
        Err(RecvTimeoutError::Timeout) => {
            return Err("Authentication timed out. Please try again.".to_string())
        }
        Err(RecvTimeoutError::Disconnected) => {
            return Err("Authentication was cancelled.".to_string())
        }
    };

    let token = github::exchange_code_for_token(&code)
        .await
        .map_err(|e| e.to_string())?;

    github::store_token(&token.access_token).map_err(|e| e.to_string())?;

    let user = github::get_current_user(&token.access_token)
        .await
        .map_err(|e| e.to_string())?;

    let email = if user.email.is_some() {
        user.email.clone()
    } else {
        github::get_primary_email(&token.access_token)
            .await
            .ok()
            .flatten()
    };

    Ok(GitHubAuthStatus {
        authenticated: true,
        username: Some(user.login),
        email,
        avatar_url: Some(user.avatar_url),
    })
}

#[tauri::command]
pub async fn github_auth_status() -> Result<GitHubAuthStatus, String> {
    let token = match github::get_stored_token() {
        Ok(t) => t,
        Err(_) => {
            return Ok(GitHubAuthStatus {
                authenticated: false,
                username: None,
                email: None,
                avatar_url: None,
            })
        }
    };

    match github::get_current_user(&token).await {
        Ok(user) => {
            let email = if user.email.is_some() {
                user.email.clone()
            } else {
                github::get_primary_email(&token).await.ok().flatten()
            };

            Ok(GitHubAuthStatus {
                authenticated: true,
                username: Some(user.login),
                email,
                avatar_url: Some(user.avatar_url),
            })
        }
        Err(_) => {
            let _ = github::delete_token();
            Ok(GitHubAuthStatus {
                authenticated: false,
                username: None,
                email: None,
                avatar_url: None,
            })
        }
    }
}

#[tauri::command]
pub fn github_logout() -> Result<(), String> {
    github::delete_token().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_user() -> Result<GitHubUser, String> {
    let token = github::get_stored_token().map_err(|e| e.to_string())?;
    github::get_current_user(&token)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn github_get_repos(
    page: Option<u32>,
    per_page: Option<u32>,
) -> Result<Vec<GitHubRepo>, String> {
    let token = github::get_stored_token().map_err(|e| e.to_string())?;
    github::get_user_repos(&token, page.unwrap_or(1), per_page.unwrap_or(30))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn github_get_token() -> Result<String, String> {
    github::get_stored_token().map_err(|e| e.to_string())
}

//! GitHub OAuth implementation
//!
//! Handles the OAuth authorization flow for GitHub authentication.

use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::io::{BufRead, BufReader, Write};
use std::net::TcpListener;
use std::sync::mpsc;
use std::thread;
use thiserror::Error;

// OAuth App credentials (embedded like GitHub Desktop)
const GITHUB_CLIENT_ID: &str = "Ov23liJJc4ILqKfagUzI";
const GITHUB_CLIENT_SECRET: &str = "8dfb8d9f6281fef37668b3ca017efb88bef2eb41";
const CALLBACK_PORT: u16 = 8765;
const REDIRECT_URI: &str = "http://localhost:8765/callback";

// GitHub OAuth endpoints
const AUTHORIZE_URL: &str = "https://github.com/login/oauth/authorize";
const TOKEN_URL: &str = "https://github.com/login/oauth/access_token";

// Scopes we request - includes workflow for Actions and notifications
const SCOPES: &str = "repo,read:user,user:email,workflow,notifications,read:org";

// Keyring service name for storing tokens
const KEYRING_SERVICE: &str = "linuxgit";
const KEYRING_USERNAME: &str = "github_token";

#[derive(Debug, Error)]
pub enum OAuthError {
    #[error("Failed to start callback server: {0}")]
    ServerError(String),
    #[error("Authorization was cancelled or denied")]
    AuthorizationDenied,
    #[error("Failed to exchange code for token: {0}")]
    TokenExchangeError(String),
    #[error("Failed to store token: {0}")]
    KeyringError(String),
    #[error("Failed to open browser: {0}")]
    BrowserError(String),
    #[error("Network error: {0}")]
    NetworkError(String),
    #[error("No token found")]
    NoToken,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubToken {
    pub access_token: String,
    pub token_type: String,
    pub scope: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubAuthStatus {
    pub authenticated: bool,
    pub username: Option<String>,
    pub email: Option<String>,
    pub avatar_url: Option<String>,
}

/// Generate a random state string for CSRF protection
fn generate_state() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    format!("{:x}", nanos)
}

/// Build the GitHub authorization URL
pub fn get_authorization_url() -> (String, String) {
    let state = generate_state();
    let url = format!(
        "{}?client_id={}&redirect_uri={}&scope={}&state={}",
        AUTHORIZE_URL, GITHUB_CLIENT_ID, REDIRECT_URI, SCOPES, state
    );
    (url, state)
}

/// Start a local HTTP server to receive the OAuth callback
/// Returns the authorization code if successful
pub fn wait_for_callback(expected_state: &str) -> Result<String, OAuthError> {
    let listener = TcpListener::bind(format!("127.0.0.1:{}", CALLBACK_PORT))
        .map_err(|e| OAuthError::ServerError(e.to_string()))?;

    // Set a timeout for the listener
    listener
        .set_nonblocking(false)
        .map_err(|e| OAuthError::ServerError(e.to_string()))?;

    // Accept one connection
    let (mut stream, _) = listener
        .accept()
        .map_err(|e| OAuthError::ServerError(e.to_string()))?;

    let mut reader = BufReader::new(&stream);
    let mut request_line = String::new();
    reader
        .read_line(&mut request_line)
        .map_err(|e| OAuthError::ServerError(e.to_string()))?;

    // Parse the request to get code and state
    let (code, state) = parse_callback_request(&request_line)?;

    // Verify state matches
    if state != expected_state {
        send_error_response(&mut stream, "State mismatch - possible CSRF attack");
        return Err(OAuthError::AuthorizationDenied);
    }

    // Send success response to browser
    send_success_response(&mut stream);

    Ok(code)
}

/// Parse the callback request to extract code and state parameters
fn parse_callback_request(request: &str) -> Result<(String, String), OAuthError> {
    // Request looks like: GET /callback?code=XXX&state=YYY HTTP/1.1
    let parts: Vec<&str> = request.split_whitespace().collect();
    if parts.len() < 2 {
        return Err(OAuthError::AuthorizationDenied);
    }

    let path = parts[1];

    // Check for error in callback
    if path.contains("error=") {
        return Err(OAuthError::AuthorizationDenied);
    }

    // Parse query parameters
    let query_start = path.find('?').ok_or(OAuthError::AuthorizationDenied)?;
    let query = &path[query_start + 1..];

    let mut code = None;
    let mut state = None;

    for param in query.split('&') {
        let kv: Vec<&str> = param.split('=').collect();
        if kv.len() == 2 {
            match kv[0] {
                "code" => code = Some(kv[1].to_string()),
                "state" => state = Some(kv[1].to_string()),
                _ => {}
            }
        }
    }

    match (code, state) {
        (Some(c), Some(s)) => Ok((c, s)),
        _ => Err(OAuthError::AuthorizationDenied),
    }
}

/// Send a success HTML response to the browser
fn send_success_response(stream: &mut std::net::TcpStream) {
    let html = r#"<!DOCTYPE html>
<html>
<head>
    <title>LinuxGit - Authentication Successful</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
            background: linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%);
            color: #e6edf3;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            text-align: center;
            padding: 48px 40px;
            background: rgba(22, 27, 34, 0.8);
            border: 1px solid rgba(48, 54, 61, 0.8);
            border-radius: 16px;
            backdrop-filter: blur(20px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            max-width: 420px;
            width: 100%;
        }
        .success-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 24px;
            background: linear-gradient(135deg, #238636 0%, #2ea043 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 30px rgba(46, 160, 67, 0.4);
            animation: pulse 2s ease-in-out infinite;
        }
        .success-icon svg {
            width: 40px;
            height: 40px;
            stroke: white;
            stroke-width: 3;
            fill: none;
        }
        @keyframes pulse {
            0%, 100% { box-shadow: 0 0 30px rgba(46, 160, 67, 0.4); }
            50% { box-shadow: 0 0 50px rgba(46, 160, 67, 0.6); }
        }
        h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #e6edf3;
        }
        p {
            font-size: 16px;
            color: #8b949e;
            line-height: 1.5;
            margin-bottom: 24px;
        }
        .brand {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: rgba(56, 139, 253, 0.1);
            border: 1px solid rgba(56, 139, 253, 0.3);
            border-radius: 8px;
            color: #58a6ff;
            font-size: 14px;
            font-weight: 500;
        }
        .brand svg {
            width: 18px;
            height: 18px;
            fill: currentColor;
        }
        .close-hint {
            margin-top: 24px;
            font-size: 13px;
            color: #6e7681;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">
            <svg viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        </div>
        <h1>Authentication Successful!</h1>
        <p>You have successfully signed in with GitHub. You can now close this window and return to the application.</p>
        <div class="brand">
            <svg viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            LinuxGit
        </div>
        <p class="close-hint">This window can be safely closed.</p>
    </div>
</body>
</html>"#;

    let response = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        html.len(),
        html
    );

    let _ = stream.write_all(response.as_bytes());
    let _ = stream.flush();
}

/// Send an error HTML response to the browser
fn send_error_response(stream: &mut std::net::TcpStream, error: &str) {
    let html = format!(
        r#"<!DOCTYPE html>
<html>
<head>
    <title>LinuxGit - Authentication Failed</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #fff;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }}
        .container {{
            text-align: center;
            padding: 40px;
            background: rgba(255,255,255,0.1);
            border-radius: 16px;
        }}
        .error-icon {{ font-size: 64px; margin-bottom: 20px; }}
        h1 {{ margin: 0 0 10px 0; color: #ff6b6b; }}
        p {{ opacity: 0.8; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">✗</div>
        <h1>Authentication Failed</h1>
        <p>{}</p>
    </div>
</body>
</html>"#,
        error
    );

    let response = format!(
        "HTTP/1.1 400 Bad Request\r\nContent-Type: text/html\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        html.len(),
        html
    );

    let _ = stream.write_all(response.as_bytes());
    let _ = stream.flush();
}

/// Exchange the authorization code for an access token
pub async fn exchange_code_for_token(code: &str) -> Result<GitHubToken, OAuthError> {
    let client = Client::new();

    #[derive(Serialize)]
    struct TokenRequest<'a> {
        client_id: &'a str,
        client_secret: &'a str,
        code: &'a str,
        redirect_uri: &'a str,
    }

    let request = TokenRequest {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
    };

    let response = client
        .post(TOKEN_URL)
        .header("Accept", "application/json")
        .json(&request)
        .send()
        .await
        .map_err(|e| OAuthError::NetworkError(e.to_string()))?;

    if !response.status().is_success() {
        return Err(OAuthError::TokenExchangeError(format!(
            "GitHub returned status: {}",
            response.status()
        )));
    }

    #[derive(Deserialize)]
    struct TokenResponse {
        access_token: Option<String>,
        token_type: Option<String>,
        scope: Option<String>,
        error: Option<String>,
        error_description: Option<String>,
    }

    let token_response: TokenResponse = response
        .json()
        .await
        .map_err(|e| OAuthError::TokenExchangeError(e.to_string()))?;

    if let Some(error) = token_response.error {
        return Err(OAuthError::TokenExchangeError(format!(
            "{}: {}",
            error,
            token_response.error_description.unwrap_or_default()
        )));
    }

    Ok(GitHubToken {
        access_token: token_response
            .access_token
            .ok_or_else(|| OAuthError::TokenExchangeError("No access token in response".into()))?,
        token_type: token_response.token_type.unwrap_or_else(|| "bearer".into()),
        scope: token_response.scope.unwrap_or_default(),
    })
}

/// Store the access token securely in the system keyring
pub fn store_token(token: &str) -> Result<(), OAuthError> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USERNAME)
        .map_err(|e| OAuthError::KeyringError(e.to_string()))?;

    entry
        .set_password(token)
        .map_err(|e| OAuthError::KeyringError(e.to_string()))?;

    Ok(())
}

/// Retrieve the access token from the system keyring
pub fn get_stored_token() -> Result<String, OAuthError> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USERNAME)
        .map_err(|e| OAuthError::KeyringError(e.to_string()))?;

    entry
        .get_password()
        .map_err(|_| OAuthError::NoToken)
}

/// Delete the stored token (logout)
pub fn delete_token() -> Result<(), OAuthError> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USERNAME)
        .map_err(|e| OAuthError::KeyringError(e.to_string()))?;

    // Ignore error if credential doesn't exist
    let _ = entry.delete_password();
    Ok(())
}

/// Check if user is authenticated (has stored token)
pub fn is_authenticated() -> bool {
    get_stored_token().is_ok()
}

/// Start the OAuth flow in a background thread
/// Returns a channel receiver that will receive the result
pub fn start_oauth_flow() -> mpsc::Receiver<Result<String, OAuthError>> {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let (auth_url, state) = get_authorization_url();

        // Open browser
        if let Err(e) = open::that(&auth_url) {
            let _ = tx.send(Err(OAuthError::BrowserError(e.to_string())));
            return;
        }

        // Wait for callback
        let result = wait_for_callback(&state);
        let _ = tx.send(result);
    });

    rx
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_state() {
        let state1 = generate_state();
        let state2 = generate_state();
        assert!(!state1.is_empty());
        // States should be unique (with high probability)
        assert_ne!(state1, state2);
    }

    #[test]
    fn test_authorization_url() {
        let (url, state) = get_authorization_url();
        assert!(url.contains("github.com/login/oauth/authorize"));
        assert!(url.contains(GITHUB_CLIENT_ID));
        assert!(url.contains(&state));
    }
}

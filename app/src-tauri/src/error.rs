use std::fmt;
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub enum ErrorCode {
    Unknown,
    NotFound,
    RepositoryNotOpen,
    GitOperation,
    GitHubApi,
    Authentication,
    Validation,
    Network,
    Timeout,
}

#[derive(Debug, Clone, Serialize)]
pub struct AppError {
    pub code: ErrorCode,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<String>,
}

impl AppError {
    pub fn new(code: ErrorCode, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            context: None,
        }
    }

    pub fn with_context(mut self, context: impl Into<String>) -> Self {
        self.context = Some(context.into());
        self
    }

    pub fn repository_not_open() -> Self {
        Self::new(ErrorCode::RepositoryNotOpen, "No repository is currently open")
    }

    pub fn not_found(resource: &str) -> Self {
        Self::new(ErrorCode::NotFound, format!("{} not found", resource))
    }

    pub fn git_operation(operation: &str, error: impl fmt::Display) -> Self {
        Self::new(
            ErrorCode::GitOperation,
            format!("Git operation '{}' failed: {}", operation, error),
        )
    }

    pub fn github_api(message: impl Into<String>) -> Self {
        Self::new(ErrorCode::GitHubApi, message)
    }

    pub fn authentication(message: impl Into<String>) -> Self {
        Self::new(ErrorCode::Authentication, message)
    }

    pub fn validation(message: impl Into<String>) -> Self {
        Self::new(ErrorCode::Validation, message)
    }
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for AppError {}

impl From<git2::Error> for AppError {
    fn from(error: git2::Error) -> Self {
        Self::new(ErrorCode::GitOperation, error.message().to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(error: std::io::Error) -> Self {
        Self::new(ErrorCode::Unknown, error.to_string())
    }
}

impl From<reqwest::Error> for AppError {
    fn from(error: reqwest::Error) -> Self {
        if error.is_timeout() {
            Self::new(ErrorCode::Timeout, "Request timed out")
        } else if error.is_connect() {
            Self::new(ErrorCode::Network, "Failed to connect to server")
        } else {
            Self::new(ErrorCode::Network, error.to_string())
        }
    }
}

impl From<serde_json::Error> for AppError {
    fn from(error: serde_json::Error) -> Self {
        Self::new(ErrorCode::Validation, error.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;

pub trait ResultExt<T> {
    fn map_app_err(self, code: ErrorCode, message: impl Into<String>) -> AppResult<T>;
}

impl<T, E: fmt::Display> ResultExt<T> for Result<T, E> {
    fn map_app_err(self, code: ErrorCode, message: impl Into<String>) -> AppResult<T> {
        self.map_err(|e| AppError::new(code, message).with_context(e.to_string()))
    }
}

pub mod ollama;
pub mod openai;

use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AiError {
    #[error("AI provider not available: {0}")]
    ProviderNotAvailable(String),

    #[error("API error: {0}")]
    ApiError(String),

    #[error("Request failed: {0}")]
    RequestFailed(#[from] reqwest::Error),

    #[error("Invalid response: {0}")]
    InvalidResponse(String),
}

impl Serialize for AiError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

pub type AiResult<T> = Result<T, AiError>;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AiProvider {
    Ollama,
    OpenAI,
}

/// Configuration for AI providers
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiConfig {
    pub provider: AiProvider,
    pub ollama_url: String,
    pub ollama_model: String,
    pub openai_api_key: Option<String>,
    pub openai_model: String,
}

impl Default for AiConfig {
    fn default() -> Self {
        Self {
            provider: AiProvider::Ollama,
            ollama_url: "http://localhost:11434".to_string(),
            ollama_model: "codellama".to_string(),
            openai_api_key: None,
            openai_model: "gpt-4".to_string(),
        }
    }
}

/// Generate a commit message from a diff using the configured AI provider
pub async fn generate_commit_message(diff: &str, config: &AiConfig) -> AiResult<String> {
    let prompt = create_commit_prompt(diff);

    match config.provider {
        AiProvider::Ollama => {
            ollama::generate(&config.ollama_url, &config.ollama_model, &prompt).await
        }
        AiProvider::OpenAI => {
            let api_key = config
                .openai_api_key
                .as_ref()
                .ok_or_else(|| AiError::ProviderNotAvailable("OpenAI API key not configured".to_string()))?;
            openai::generate(api_key, &config.openai_model, &prompt).await
        }
    }
}

/// Creates a prompt for generating commit messages
fn create_commit_prompt(diff: &str) -> String {
    format!(
        r#"You are a helpful assistant that generates clear, concise Git commit messages.

Based on the following diff, generate a commit message following the Conventional Commits specification:
- Use format: <type>(<scope>): <description>
- Types: feat, fix, docs, style, refactor, test, chore
- Keep the description under 72 characters
- Focus on WHAT changed and WHY, not HOW

Diff:
```
{}
```

Generate ONLY the commit message, no explanation:"#,
        diff.chars().take(4000).collect::<String>() // Truncate very long diffs
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_commit_prompt() {
        let diff = "+ added new function";
        let prompt = create_commit_prompt(diff);
        assert!(prompt.contains("+ added new function"));
        assert!(prompt.contains("Conventional Commits"));
    }
}

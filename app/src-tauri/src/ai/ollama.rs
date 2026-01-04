use reqwest::Client;
use serde::{Deserialize, Serialize};

use super::{AiError, AiResult};

#[derive(Debug, Serialize)]
struct OllamaRequest {
    model: String,
    prompt: String,
    stream: bool,
}

#[derive(Debug, Deserialize)]
struct OllamaResponse {
    response: String,
}

/// Check if Ollama is available
pub async fn is_available(base_url: &str) -> bool {
    let client = Client::new();
    client
        .get(format!("{}/api/version", base_url))
        .timeout(std::time::Duration::from_secs(2))
        .send()
        .await
        .is_ok()
}

/// List available models
pub async fn list_models(base_url: &str) -> AiResult<Vec<String>> {
    let client = Client::new();

    #[derive(Deserialize)]
    struct ModelsResponse {
        models: Vec<ModelInfo>,
    }

    #[derive(Deserialize)]
    struct ModelInfo {
        name: String,
    }

    let response = client
        .get(format!("{}/api/tags", base_url))
        .timeout(std::time::Duration::from_secs(5))
        .send()
        .await?
        .json::<ModelsResponse>()
        .await?;

    Ok(response.models.into_iter().map(|m| m.name).collect())
}

/// Generate text using Ollama
pub async fn generate(base_url: &str, model: &str, prompt: &str) -> AiResult<String> {
    let client = Client::new();

    let request = OllamaRequest {
        model: model.to_string(),
        prompt: prompt.to_string(),
        stream: false,
    };

    let response = client
        .post(format!("{}/api/generate", base_url))
        .json(&request)
        .timeout(std::time::Duration::from_secs(60))
        .send()
        .await
        .map_err(|e| {
            if e.is_connect() {
                AiError::ProviderNotAvailable("Ollama is not running. Start it with 'ollama serve'".to_string())
            } else if e.is_timeout() {
                AiError::ApiError("Request timed out".to_string())
            } else {
                AiError::RequestFailed(e)
            }
        })?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        return Err(AiError::ApiError(format!(
            "Ollama returned {}: {}",
            status, error_text
        )));
    }

    let ollama_response: OllamaResponse = response
        .json()
        .await
        .map_err(|e| AiError::InvalidResponse(e.to_string()))?;

    // Clean up the response (remove extra whitespace, etc.)
    let message = ollama_response
        .response
        .trim()
        .lines()
        .next()
        .unwrap_or("")
        .to_string();

    Ok(message)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_is_available_when_not_running() {
        // This should return false when Ollama isn't running
        let result = is_available("http://localhost:11434").await;
        // Don't assert - it depends on whether Ollama is running
        println!("Ollama available: {}", result);
    }
}

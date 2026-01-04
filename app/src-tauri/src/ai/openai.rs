use reqwest::Client;
use serde::{Deserialize, Serialize};

use super::{AiError, AiResult};

const OPENAI_API_URL: &str = "https://api.openai.com/v1/chat/completions";

#[derive(Debug, Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<Message>,
    temperature: f32,
    max_tokens: u32,
}

#[derive(Debug, Serialize, Deserialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct ChatResponse {
    choices: Vec<Choice>,
}

#[derive(Debug, Deserialize)]
struct Choice {
    message: Message,
}

/// Validate an OpenAI API key
pub async fn validate_api_key(api_key: &str) -> bool {
    let client = Client::new();

    let response = client
        .get("https://api.openai.com/v1/models")
        .header("Authorization", format!("Bearer {}", api_key))
        .timeout(std::time::Duration::from_secs(5))
        .send()
        .await;

    response.map(|r| r.status().is_success()).unwrap_or(false)
}

/// List available models
pub async fn list_models(api_key: &str) -> AiResult<Vec<String>> {
    let client = Client::new();

    #[derive(Deserialize)]
    struct ModelsResponse {
        data: Vec<ModelInfo>,
    }

    #[derive(Deserialize)]
    struct ModelInfo {
        id: String,
    }

    let response = client
        .get("https://api.openai.com/v1/models")
        .header("Authorization", format!("Bearer {}", api_key))
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await?;

    if !response.status().is_success() {
        return Err(AiError::ApiError("Failed to list models".to_string()));
    }

    let models: ModelsResponse = response.json().await?;

    // Filter to GPT models that are useful for text generation
    let gpt_models: Vec<String> = models
        .data
        .into_iter()
        .map(|m| m.id)
        .filter(|id| id.starts_with("gpt-"))
        .collect();

    Ok(gpt_models)
}

/// Generate text using OpenAI
pub async fn generate(api_key: &str, model: &str, prompt: &str) -> AiResult<String> {
    let client = Client::new();

    let request = ChatRequest {
        model: model.to_string(),
        messages: vec![
            Message {
                role: "system".to_string(),
                content: "You are a helpful assistant that generates clear, concise Git commit messages. Respond with ONLY the commit message, no explanation or additional text.".to_string(),
            },
            Message {
                role: "user".to_string(),
                content: prompt.to_string(),
            },
        ],
        temperature: 0.3, // Lower temperature for more consistent output
        max_tokens: 100,
    };

    let response = client
        .post(OPENAI_API_URL)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request)
        .timeout(std::time::Duration::from_secs(30))
        .send()
        .await
        .map_err(|e| {
            if e.is_timeout() {
                AiError::ApiError("Request timed out".to_string())
            } else {
                AiError::RequestFailed(e)
            }
        })?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();

        return Err(AiError::ApiError(format!(
            "OpenAI returned {}: {}",
            status, error_text
        )));
    }

    let chat_response: ChatResponse = response
        .json()
        .await
        .map_err(|e| AiError::InvalidResponse(e.to_string()))?;

    let message = chat_response
        .choices
        .first()
        .map(|c| c.message.content.trim().to_string())
        .unwrap_or_default();

    // Clean up: get first line only (commit subject)
    let message = message.lines().next().unwrap_or("").to_string();

    Ok(message)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_validate_invalid_key() {
        let result = validate_api_key("invalid-key").await;
        assert!(!result);
    }
}

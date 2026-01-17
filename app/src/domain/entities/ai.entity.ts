export type AiProvider = 'ollama' | 'openai';

export interface AiConfig {
  provider: AiProvider;
  ollamaModel: string;
  ollamaEndpoint: string;
  openaiKey?: string;
  openaiModel: string;
}

export interface AiGenerationRequest {
  diff: string;
  context?: string;
}

export interface AiGenerationResponse {
  message: string;
  provider: AiProvider;
  model: string;
}

export interface OllamaModel {
  name: string;
  modifiedAt: string;
  size: number;
}

export interface OllamaStatus {
  available: boolean;
  models: OllamaModel[];
  error?: string;
}

import type { AiConfig, OllamaStatus, OllamaModel } from '../entities';

export interface IAiService {
  generateCommitMessage(diff: string): Promise<string>;
  getConfig(): Promise<AiConfig>;
  setConfig(config: Partial<AiConfig>): Promise<void>;
}

export interface IOllamaService {
  checkStatus(): Promise<OllamaStatus>;
  listModels(): Promise<OllamaModel[]>;
  generate(model: string, prompt: string): Promise<string>;
}

export interface IOpenAiService {
  validateKey(key: string): Promise<boolean>;
  generate(model: string, prompt: string): Promise<string>;
}

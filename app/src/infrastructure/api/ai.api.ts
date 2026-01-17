import { BaseApi } from './base.api';
import type { IAiService, IOllamaService, IOpenAiService } from '@/domain/interfaces';
import type { AiConfig, OllamaStatus, OllamaModel } from '@/domain/entities';

interface RawAiConfig {
  provider: 'ollama' | 'openai';
  ollama_model: string;
  ollama_endpoint: string;
  openai_key?: string;
  openai_model: string;
}

class AiMapper {
  static toConfig(raw: RawAiConfig): AiConfig {
    return {
      provider: raw.provider,
      ollamaModel: raw.ollama_model,
      ollamaEndpoint: raw.ollama_endpoint,
      openaiKey: raw.openai_key,
      openaiModel: raw.openai_model,
    };
  }

  static fromConfig(config: Partial<AiConfig>): Partial<RawAiConfig> {
    const raw: Partial<RawAiConfig> = {};
    if (config.provider) raw.provider = config.provider;
    if (config.ollamaModel) raw.ollama_model = config.ollamaModel;
    if (config.ollamaEndpoint) raw.ollama_endpoint = config.ollamaEndpoint;
    if (config.openaiKey !== undefined) raw.openai_key = config.openaiKey;
    if (config.openaiModel) raw.openai_model = config.openaiModel;
    return raw;
  }
}

export class AiApi extends BaseApi implements IAiService {
  async generateCommitMessage(diff: string): Promise<string> {
    return this.invoke<string>('generate_commit_message', { diff });
  }

  async getConfig(): Promise<AiConfig> {
    const raw = await this.invoke<RawAiConfig>('get_ai_config');
    return AiMapper.toConfig(raw);
  }

  async setConfig(config: Partial<AiConfig>): Promise<void> {
    const raw = AiMapper.fromConfig(config);
    await this.invoke('set_ai_config', { config: raw });
  }
}

export class OllamaApi extends BaseApi implements IOllamaService {
  async checkStatus(): Promise<OllamaStatus> {
    return this.invoke<OllamaStatus>('check_ollama_status');
  }

  async listModels(): Promise<OllamaModel[]> {
    return this.invoke<OllamaModel[]>('list_ollama_models');
  }

  async generate(model: string, prompt: string): Promise<string> {
    return this.invoke<string>('generate_ollama', { model, prompt });
  }
}

export class OpenAiApi extends BaseApi implements IOpenAiService {
  async validateKey(key: string): Promise<boolean> {
    return this.invoke<boolean>('validate_openai_key', { key });
  }

  async generate(model: string, prompt: string): Promise<string> {
    return this.invoke<string>('generate_openai', { model, prompt });
  }
}

export const aiApi = new AiApi();
export const ollamaApi = new OllamaApi();
export const openAiApi = new OpenAiApi();

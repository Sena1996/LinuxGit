import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AiConfig, AiProvider, OllamaStatus } from '@/domain/entities';
import { aiApi, ollamaApi, openAiApi } from '@/infrastructure/api';

interface AiState extends AiConfig {
  generating: boolean;
  error: string | null;
  ollamaStatus: OllamaStatus | null;

  setProvider: (provider: AiProvider) => void;
  setOllamaModel: (model: string) => void;
  setOllamaEndpoint: (endpoint: string) => void;
  setOpenaiKey: (key: string) => void;
  setOpenaiModel: (model: string) => void;
  generateCommitMessage: (diff: string) => Promise<string>;
  checkOllamaStatus: () => Promise<void>;
  validateOpenaiKey: (key: string) => Promise<boolean>;
  loadConfig: () => Promise<void>;
  saveConfig: () => Promise<void>;
}

const defaultConfig: AiConfig = {
  provider: 'ollama',
  ollamaModel: 'llama2',
  ollamaEndpoint: 'http://localhost:11434',
  openaiKey: undefined,
  openaiModel: 'gpt-3.5-turbo',
};

export const useAiStore = create<AiState>()(
  persist(
    (set, get) => ({
      ...defaultConfig,
      generating: false,
      error: null,
      ollamaStatus: null,

      setProvider: (provider) => {
        set({ provider });
        get().saveConfig();
      },

      setOllamaModel: (ollamaModel) => {
        set({ ollamaModel });
        get().saveConfig();
      },

      setOllamaEndpoint: (ollamaEndpoint) => {
        set({ ollamaEndpoint });
        get().saveConfig();
      },

      setOpenaiKey: (openaiKey) => {
        set({ openaiKey });
        get().saveConfig();
      },

      setOpenaiModel: (openaiModel) => {
        set({ openaiModel });
        get().saveConfig();
      },

      generateCommitMessage: async (diff) => {
        set({ generating: true, error: null });
        try {
          const message = await aiApi.generateCommitMessage(diff);
          set({ generating: false });
          return message;
        } catch (error) {
          set({ error: String(error), generating: false });
          throw error;
        }
      },

      checkOllamaStatus: async () => {
        try {
          const ollamaStatus = await ollamaApi.checkStatus();
          set({ ollamaStatus });
        } catch (error) {
          set({ ollamaStatus: { available: false, models: [], error: String(error) } });
        }
      },

      validateOpenaiKey: async (key) => {
        try {
          return await openAiApi.validateKey(key);
        } catch {
          return false;
        }
      },

      loadConfig: async () => {
        try {
          const config = await aiApi.getConfig();
          set(config);
        } catch (error) {
          console.error('Failed to load AI config:', error);
        }
      },

      saveConfig: async () => {
        const { provider, ollamaModel, ollamaEndpoint, openaiKey, openaiModel } = get();
        try {
          await aiApi.setConfig({
            provider,
            ollamaModel,
            ollamaEndpoint,
            openaiKey,
            openaiModel,
          });
        } catch (error) {
          console.error('Failed to save AI config:', error);
        }
      },
    }),
    {
      name: 'linuxgit-ai',
      version: 1,
      partialize: (state) => ({
        provider: state.provider,
        ollamaModel: state.ollamaModel,
        ollamaEndpoint: state.ollamaEndpoint,
        openaiModel: state.openaiModel,
      }),
    }
  )
);

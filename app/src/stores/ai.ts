import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';

export type AiProvider = 'ollama' | 'openai';

export interface AiConfig {
  provider: AiProvider;
  ollama_url: string;
  ollama_model: string;
  openai_api_key: string | null;
  openai_model: string;
}

export interface OllamaStatus {
  available: boolean;
  models: string[];
}

interface AiState {
  // Config
  provider: AiProvider;
  ollamaUrl: string;
  ollamaModel: string;
  openaiModel: string;
  openaiApiKey: string | null;

  // Status
  ollamaAvailable: boolean;
  ollamaModels: string[];
  openaiKeyValid: boolean | null;
  loading: boolean;
  error: string | null;

  // Actions
  setProvider: (provider: AiProvider) => void;
  setOllamaModel: (model: string) => void;
  setOpenaiModel: (model: string) => void;
  setOpenaiApiKey: (key: string) => void;
  loadConfig: () => Promise<void>;
  saveConfig: () => Promise<void>;
  checkOllamaStatus: () => Promise<void>;
  validateOpenaiKey: () => Promise<boolean>;
}

export const useAIStore = create<AiState>()(
  persist(
    (set, get) => ({
      // Default config
      provider: 'ollama',
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'codellama',
      openaiModel: 'gpt-4',
      openaiApiKey: null,

      // Status
      ollamaAvailable: false,
      ollamaModels: [],
      openaiKeyValid: null,
      loading: false,
      error: null,

      setProvider: (provider) => {
        set({ provider });
        get().saveConfig();
      },

      setOllamaModel: (model) => {
        set({ ollamaModel: model });
        get().saveConfig();
      },

      setOpenaiModel: (model) => {
        set({ openaiModel: model });
        get().saveConfig();
      },

      setOpenaiApiKey: (key) => {
        set({ openaiApiKey: key, openaiKeyValid: null });
        get().saveConfig();
      },

      loadConfig: async () => {
        try {
          set({ loading: true, error: null });
          const config = await invoke<AiConfig>('get_ai_config');
          set({
            provider: config.provider === 'ollama' ? 'ollama' : 'openai',
            ollamaUrl: config.ollama_url,
            ollamaModel: config.ollama_model,
            openaiModel: config.openai_model,
            openaiApiKey: config.openai_api_key,
          });
        } catch (e) {
          set({ error: String(e) });
        } finally {
          set({ loading: false });
        }
      },

      saveConfig: async () => {
        const state = get();
        const config: AiConfig = {
          provider: state.provider,
          ollama_url: state.ollamaUrl,
          ollama_model: state.ollamaModel,
          openai_api_key: state.openaiApiKey,
          openai_model: state.openaiModel,
        };

        try {
          await invoke('set_ai_config', { config });
        } catch (e) {
          set({ error: String(e) });
        }
      },

      checkOllamaStatus: async () => {
        try {
          set({ loading: true, error: null });
          const status = await invoke<OllamaStatus>('check_ollama_status');
          set({
            ollamaAvailable: status.available,
            ollamaModels: status.models,
          });
        } catch (e) {
          set({ error: String(e), ollamaAvailable: false, ollamaModels: [] });
        } finally {
          set({ loading: false });
        }
      },

      validateOpenaiKey: async () => {
        const { openaiApiKey } = get();
        if (!openaiApiKey) {
          set({ openaiKeyValid: false });
          return false;
        }

        try {
          set({ loading: true, error: null });
          const valid = await invoke<boolean>('validate_openai_key', { apiKey: openaiApiKey });
          set({ openaiKeyValid: valid });
          return valid;
        } catch (e) {
          set({ error: String(e), openaiKeyValid: false });
          return false;
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'linuxgit-ai',
      partialize: (state) => ({
        provider: state.provider,
        ollamaModel: state.ollamaModel,
        openaiModel: state.openaiModel,
        // Note: API key stored in localStorage - consider using keyring for production
        openaiApiKey: state.openaiApiKey,
      }),
    }
  )
);

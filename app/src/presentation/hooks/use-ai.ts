import { useCallback } from 'react';
import { useAiStore } from '../stores';

export function useAi() {
  const store = useAiStore();

  const generateCommitMessage = useCallback(async (diff: string) => {
    return store.generateCommitMessage(diff);
  }, [store]);

  return {
    provider: store.provider,
    generating: store.generating,
    error: store.error,
    ollamaStatus: store.ollamaStatus,
    generateCommitMessage,
    setProvider: store.setProvider,
    setOllamaModel: store.setOllamaModel,
    setOllamaEndpoint: store.setOllamaEndpoint,
    setOpenaiKey: store.setOpenaiKey,
    setOpenaiModel: store.setOpenaiModel,
    checkOllamaStatus: store.checkOllamaStatus,
    validateOpenaiKey: store.validateOpenaiKey,
    loadConfig: store.loadConfig,
    saveConfig: store.saveConfig,
  };
}

export function useAiConfig() {
  const store = useAiStore();

  return {
    provider: store.provider,
    ollamaModel: store.ollamaModel,
    ollamaEndpoint: store.ollamaEndpoint,
    openaiKey: store.openaiKey,
    openaiModel: store.openaiModel,
    ollamaStatus: store.ollamaStatus,
  };
}

import { invoke } from '@tauri-apps/api/core';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromUnknown(error: unknown): ApiError {
    if (error instanceof ApiError) return error;
    if (error instanceof Error) return new ApiError(error.message);
    return new ApiError(String(error));
  }
}

export abstract class BaseApi {
  protected async invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
    try {
      return await invoke<T>(command, args);
    } catch (error) {
      throw ApiError.fromUnknown(error);
    }
  }
}

export function createInvoker<T>(command: string) {
  return async (args?: Record<string, unknown>): Promise<T> => {
    try {
      return await invoke<T>(command, args);
    } catch (error) {
      throw ApiError.fromUnknown(error);
    }
  };
}

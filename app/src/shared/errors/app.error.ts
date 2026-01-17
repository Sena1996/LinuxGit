export enum ErrorCode {
  UNKNOWN = 'UNKNOWN',
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION = 'VALIDATION',
  REPOSITORY_NOT_OPEN = 'REPOSITORY_NOT_OPEN',
  GIT_OPERATION_FAILED = 'GIT_OPERATION_FAILED',
  GITHUB_API_ERROR = 'GITHUB_API_ERROR',
  AI_GENERATION_FAILED = 'AI_GENERATION_FAILED',
  TIMEOUT = 'TIMEOUT',
}

export interface AppErrorDetails {
  code: ErrorCode;
  message: string;
  originalError?: unknown;
  context?: Record<string, unknown>;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly context?: Record<string, unknown>;
  readonly originalError?: unknown;

  constructor(details: AppErrorDetails) {
    super(details.message);
    this.name = 'AppError';
    this.code = details.code;
    this.originalError = details.originalError;
    this.context = details.context;
  }

  static fromUnknown(error: unknown, defaultCode = ErrorCode.UNKNOWN): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError({
        code: defaultCode,
        message: error.message,
        originalError: error,
      });
    }

    return new AppError({
      code: defaultCode,
      message: String(error),
      originalError: error,
    });
  }

  static network(message: string, originalError?: unknown): AppError {
    return new AppError({
      code: ErrorCode.NETWORK,
      message,
      originalError,
    });
  }

  static authentication(message: string): AppError {
    return new AppError({
      code: ErrorCode.AUTHENTICATION,
      message,
    });
  }

  static notFound(resource: string): AppError {
    return new AppError({
      code: ErrorCode.NOT_FOUND,
      message: `${resource} not found`,
      context: { resource },
    });
  }

  static validation(message: string, context?: Record<string, unknown>): AppError {
    return new AppError({
      code: ErrorCode.VALIDATION,
      message,
      context,
    });
  }

  static repositoryNotOpen(): AppError {
    return new AppError({
      code: ErrorCode.REPOSITORY_NOT_OPEN,
      message: 'No repository is currently open',
    });
  }

  static gitOperationFailed(operation: string, originalError?: unknown): AppError {
    return new AppError({
      code: ErrorCode.GIT_OPERATION_FAILED,
      message: `Git operation failed: ${operation}`,
      originalError,
      context: { operation },
    });
  }

  static githubApiError(message: string, originalError?: unknown): AppError {
    return new AppError({
      code: ErrorCode.GITHUB_API_ERROR,
      message,
      originalError,
    });
  }

  toJSON(): AppErrorDetails {
    return {
      code: this.code,
      message: this.message,
      context: this.context,
    };
  }
}

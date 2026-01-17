import { AppError, ErrorCode } from './app.error';

export type Result<T, E = AppError> = Success<T> | Failure<E>;

export class Success<T> {
  readonly success = true as const;
  constructor(readonly value: T) {}

  isSuccess(): this is Success<T> {
    return true;
  }

  isFailure(): this is Failure<never> {
    return false;
  }

  map<U>(fn: (value: T) => U): Result<U, never> {
    return new Success(fn(this.value));
  }

  flatMap<U, E>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  getOrElse(_defaultValue: T): T {
    return this.value;
  }

  getOrThrow(): T {
    return this.value;
  }
}

export class Failure<E> {
  readonly success = false as const;
  constructor(readonly error: E) {}

  isSuccess(): this is Success<never> {
    return false;
  }

  isFailure(): this is Failure<E> {
    return true;
  }

  map<U>(_fn: (value: never) => U): Result<U, E> {
    return this as unknown as Failure<E>;
  }

  flatMap<U>(_fn: (value: never) => Result<U, E>): Result<U, E> {
    return this as unknown as Failure<E>;
  }

  getOrElse<T>(defaultValue: T): T {
    return defaultValue;
  }

  getOrThrow(): never {
    if (this.error instanceof Error) {
      throw this.error;
    }
    throw new Error(String(this.error));
  }
}

export const ok = <T>(value: T): Success<T> => new Success(value);
export const fail = <E>(error: E): Failure<E> => new Failure(error);

export const tryCatch = async <T>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => AppError
): Promise<Result<T, AppError>> => {
  try {
    const result = await fn();
    return ok(result);
  } catch (error) {
    if (errorHandler) {
      return fail(errorHandler(error));
    }
    return fail(AppError.fromUnknown(error));
  }
};

export const tryCatchSync = <T>(
  fn: () => T,
  errorHandler?: (error: unknown) => AppError
): Result<T, AppError> => {
  try {
    const result = fn();
    return ok(result);
  } catch (error) {
    if (errorHandler) {
      return fail(errorHandler(error));
    }
    return fail(AppError.fromUnknown(error));
  }
};

export const isResult = <T, E>(value: unknown): value is Result<T, E> => {
  return value instanceof Success || value instanceof Failure;
};

export const fromPromise = async <T>(
  promise: Promise<T>,
  errorCode = ErrorCode.UNKNOWN
): Promise<Result<T, AppError>> => {
  try {
    const result = await promise;
    return ok(result);
  } catch (error) {
    return fail(AppError.fromUnknown(error, errorCode));
  }
};

/**
 * Result type for functional error handling
 * Either Success or Failure, never null/undefined
 */

export type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * Success result with value
 */
export class Success<T> {
  readonly tag = "success";

  constructor(readonly value: T) {}

  isSuccess(): this is Success<T> {
    return true;
  }

  isFailure(): this is Failure<any> {
    return false;
  }

  map<U>(fn: (value: T) => U): Result<U> {
    return new Success(fn(this.value));
  }

  flatMap<U, E>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  getOrElse(): T {
    return this.value;
  }

  fold<U>(onFailure: (error: any) => U, onSuccess: (value: T) => U): U {
    return onSuccess(this.value);
  }
}

/**
 * Failure result with error
 */
export class Failure<E> {
  readonly tag = "failure";

  constructor(readonly error: E) {}

  isSuccess(): this is Success<any> {
    return false;
  }

  isFailure(): this is Failure<E> {
    return true;
  }

  map<U>(): Result<U, E> {
    return this as any;
  }

  flatMap<U>(): Result<U, E> {
    return this as any;
  }

  getOrElse<T>(defaultValue: T): T {
    return defaultValue;
  }

  fold<U>(onFailure: (error: E) => U, onSuccess: (value: any) => U): U {
    return onFailure(this.error);
  }
}

export const Ok = <T>(value: T): Result<T> => new Success(value);
export const Err = <E>(error: E): Result<never, E> => new Failure(error);

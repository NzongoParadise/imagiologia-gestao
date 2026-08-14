/**
 * DomainException base class for all domain errors
 */
export abstract class DomainException extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  readonly timestamp: Date = new Date();

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, DomainException.prototype);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
    };
  }
}

/**
 * ValidationException for input validation errors
 */
export class ValidationException extends DomainException {
  readonly code = "VALIDATION_ERROR";
  readonly statusCode = 400;

  constructor(
    message: string,
    public readonly field?: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    Object.setPrototypeOf(this, ValidationException.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
      context: this.context,
    };
  }
}

/**
 * BusinessException for business rule violations
 */
export class BusinessException extends DomainException {
  readonly statusCode = 409;

  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    Object.setPrototypeOf(this, BusinessException.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      context: this.context,
    };
  }
}

/**
 * NotFoundException for resource not found errors
 */
export class NotFoundException extends DomainException {
  readonly code = "NOT_FOUND";
  readonly statusCode = 404;

  constructor(
    message: string,
    public readonly resource?: string,
    public readonly id?: string | number
  ) {
    super(message);
    Object.setPrototypeOf(this, NotFoundException.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      resource: this.resource,
      id: this.id,
    };
  }
}

/**
 * UnauthorizedException for authentication/authorization errors
 */
export class UnauthorizedException extends DomainException {
  readonly code = "UNAUTHORIZED";
  readonly statusCode = 401;

  constructor(message: string = "Unauthorized") {
    super(message);
    Object.setPrototypeOf(this, UnauthorizedException.prototype);
  }
}

/**
 * ForbiddenException for permission denied errors
 */
export class ForbiddenException extends DomainException {
  readonly code = "FORBIDDEN";
  readonly statusCode = 403;

  constructor(message: string = "Forbidden") {
    super(message);
    Object.setPrototypeOf(this, ForbiddenException.prototype);
  }
}

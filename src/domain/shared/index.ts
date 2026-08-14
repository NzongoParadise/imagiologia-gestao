// Base classes
export { ValueObject } from "./base/ValueObject";
export { Entity } from "./base/Entity";
export { AggregateRoot } from "./base/AggregateRoot";

// Types
export type { Result } from "./types/Result";
export { Ok, Err, Success, Failure } from "./types/Result";

// Exceptions
export {
  DomainException,
  ValidationException,
  BusinessException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from "./exceptions/DomainException";

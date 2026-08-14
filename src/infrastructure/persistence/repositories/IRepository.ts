import { Entity } from "../../../domain/shared/base/Entity";
import { UniqueEntityID } from "../../../domain/shared/base/UniqueEntityID";

/**
 * IRepository - Generic Repository interface following Repository Pattern
 * Provides CRUD operations for domain entities
 */
export interface IRepository<T extends Entity<any>> {
  /**
   * Find entity by ID
   */
  findById(id: UniqueEntityID): Promise<T | null>;

  /**
   * Find all entities
   */
  findAll(): Promise<T[]>;

  /**
   * Save entity (create or update)
   */
  save(entity: T): Promise<T>;

  /**
   * Delete entity by ID
   */
  delete(id: UniqueEntityID): Promise<void>;

  /**
   * Check if entity exists
   */
  exists(id: UniqueEntityID): Promise<boolean>;
}

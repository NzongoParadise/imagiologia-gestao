import { Entity } from "./Entity";

/**
 * AggregateRoot base class
 * Entities that are also aggregate roots (entry point for aggregates)
 * Can generate domain events
 */
export abstract class AggregateRoot<ID> extends Entity<ID> {
  private domainEvents: any[] = [];

  /**
   * Add an event to be published
   */
  protected addDomainEvent(event: any): void {
    this.domainEvents.push(event);
  }

  /**
   * Get all pending domain events
   */
  getDomainEvents(): any[] {
    return this.domainEvents;
  }

  /**
   * Clear all domain events after they've been published
   */
  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  /**
   * Check if has pending events
   */
  hasDomainEvents(): boolean {
    return this.domainEvents.length > 0;
  }
}

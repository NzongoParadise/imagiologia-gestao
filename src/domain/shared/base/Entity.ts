/**
 * Entity base class
 * Objects with identity that can change over time
 * Equality based on ID, not props
 */
export abstract class Entity<ID> {
  protected readonly id: ID;
  protected props: object;

  constructor(id: ID, props: object = {}) {
    this.id = id;
    this.props = props;
  }

  /**
   * Get the unique identifier
   */
  getId(): ID {
    return this.id;
  }

  /**
   * Two entities are equal if they have the same ID
   */
  equals(other: Entity<ID>): boolean {
    return this.id === other.id;
  }

  /**
   * Get all props
   */
  getProps(): object {
    return { ...this.props };
  }
}

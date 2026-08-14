/**
 * ValueObject base class
 * Immutable objects that represent concepts in the domain
 * Equality based on props, not identity
 */
export abstract class ValueObject<Props> {
  protected readonly props: Props;

  constructor(props: Props) {
    this.props = Object.freeze(props);
  }

  /**
   * Compare this VO with another VO
   */
  abstract equals(other: ValueObject<Props>): boolean;

  /**
   * Get the value/props of this VO
   */
  getValue(): Props {
    return this.props;
  }

  /**
   * String representation for debugging
   */
  abstract toString(): string;
}

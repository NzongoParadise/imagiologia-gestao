import { ValueObject } from "../../shared/base/ValueObject";
import { ValidationException } from "../../shared/exceptions/DomainException";

interface ContactoProps {
  telefone?: string;
  email?: string;
}

export class Contacto extends ValueObject<ContactoProps> {
  private constructor(props: ContactoProps) {
    super(props);
  }

  static create(props: { telefone?: string; email?: string }): Contacto {
    const telefone = props.telefone?.trim();
    const email = props.email?.trim().toLowerCase();

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ValidationException("Formato de email inválido.", "email");
    }

    if (telefone && telefone.length < 6) {
      throw new ValidationException(
        "Telefone deve conter no mínimo 6 dígitos.",
        "telefone"
      );
    }

    return new Contacto({ telefone, email });
  }

  get telefone(): string | undefined {
    return this.props.telefone;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  equals(other: Contacto): boolean {
    return this.telefone === other.telefone && this.email === other.email;
  }

  toString(): string {
    return `Tel: ${this.telefone ?? "N/D"} | Email: ${this.email ?? "N/D"}`;
  }
}

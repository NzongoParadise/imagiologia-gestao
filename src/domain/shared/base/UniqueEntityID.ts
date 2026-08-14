/**
 * Identificador técnico utilizado por repositórios que persistem entidades
 * com chave numérica no Prisma.
 */
export class UniqueEntityID {
  constructor(readonly value: number) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error("UniqueEntityID deve ser um inteiro positivo.");
    }
  }
}

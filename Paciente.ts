import { AggregateRoot } from "@/domain/shared/base/AggregateRoot";
import { PacienteId } from "../value-objects/PacienteId";

interface PacienteProps {
  nome: string;
  dataNascimento: Date;
  genero: "Masculino" | "Feminino" | "Outro";
  nif?: string;
  numeroProcesso: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export class Paciente extends AggregateRoot<PacienteId> {
  private nome: string;
  private dataNascimento: Date;
  private genero: "Masculino" | "Feminino" | "Outro";
  private nif?: string;
  private numeroProcesso: string;
  private criadoEm: Date;
  private atualizadoEm: Date;

  private constructor(id: PacienteId, props: PacienteProps) {
    super(id);
    this.nome = props.nome;
    this.dataNascimento = props.dataNascimento;
    this.genero = props.genero;
    this.nif = props.nif;
    this.numeroProcesso = props.numeroProcesso;
    this.criadoEm = props.criadoEm;
    this.atualizadoEm = props.atualizadoEm;
  }

  public static criar(props: {
    nome: string;
    dataNascimento: Date;
    genero: "Masculino" | "Feminino" | "Outro";
    nif?: string;
    numeroProcesso: string;
  }): Paciente {
    // Em um sistema real, o ID seria gerado pelo banco de dados (auto-increment)
    // e reconstituído. Para o exemplo, vamos gerar um ID numérico aleatório.
    const id = new PacienteId(Math.floor(Math.random() * 1000) + 1);
    const agora = new Date();

    const paciente = new Paciente(id, {
      ...props,
      criadoEm: agora,
      atualizadoEm: agora,
    });

    // Adicionar evento de domínio
    paciente.addDomainEvent({
      type: "PacienteCriado",
      aggregateId: id.getValue(),
      timestamp: agora,
      data: {
        nome: props.nome,
        numeroProcesso: props.numeroProcesso,
      },
    });

    return paciente;
  }

  public atualizarDados(props: { nome?: string; nif?: string }) {
    if (props.nome) {
      this.nome = props.nome;
    }
    if (props.nif) {
      this.nif = props.nif;
    }
    this.atualizadoEm = new Date();

    this.addDomainEvent({
      type: "PacienteAtualizado",
      aggregateId: this.id.getValue(),
      timestamp: this.atualizadoEm,
    });
  }

  // Getters
  public getNome(): string {
    return this.nome;
  }

  public getDataNascimento(): Date {
    return this.dataNascimento;
  }

  public getGenero(): string {
    return this.genero;
  }

  public getNumeroProcesso(): string {
    return this.numeroProcesso;
  }
}
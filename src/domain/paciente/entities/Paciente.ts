import { AggregateRoot } from "../../shared/base/AggregateRoot";
import { PacienteId } from "../value-objects/PacienteId";
import { NumeroProcesso } from "../value-objects/NumeroProcesso";
import { Contacto } from "../value-objects/Contacto";
import { DocumentoIdentificacao } from "../value-objects/DocumentoIdentificacao";
import { ValidationException } from "../../shared/exceptions/DomainException";

export interface PacienteProps {
  numeroProcesso: NumeroProcesso;
  nome: string;
  dataNascimento?: Date;
  sexo?: string;
  contacto: Contacto;
  documento: DocumentoIdentificacao;
  endereco?: string;
  foto?: string;
  observacoes?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export class Paciente extends AggregateRoot<PacienteId> {
  private numeroProcesso: NumeroProcesso;
  private nome: string;
  private dataNascimento?: Date;
  private sexo?: string;
  private contacto: Contacto;
  private documento: DocumentoIdentificacao;
  private endereco?: string;
  private foto?: string;
  private observacoes?: string;
  private criadoEm: Date;
  private atualizadoEm: Date;

  private constructor(id: PacienteId, props: PacienteProps) {
    super(id, props);
    this.numeroProcesso = props.numeroProcesso;
    this.nome = props.nome;
    this.dataNascimento = props.dataNascimento;
    this.sexo = props.sexo;
    this.contacto = props.contacto;
    this.documento = props.documento;
    this.endereco = props.endereco;
    this.foto = props.foto;
    this.observacoes = props.observacoes;
    this.criadoEm = props.criadoEm;
    this.atualizadoEm = props.atualizadoEm;
  }

  static criar(props: {
    id?: string | number;
    numeroProcesso?: string;
    nome: string;
    dataNascimento?: Date;
    sexo?: string;
    telefone?: string;
    email?: string;
    nif?: string;
    bi?: string;
    documento?: string;
    endereco?: string;
    foto?: string;
    observacoes?: string;
  }): Paciente {
    const nomeLimpo = props.nome?.trim();
    if (!nomeLimpo || nomeLimpo.length < 2) {
      throw new ValidationException(
        "O nome do paciente deve conter pelo menos 2 caracteres.",
        "nome"
      );
    }

    if (props.dataNascimento && props.dataNascimento > new Date()) {
      throw new ValidationException(
        "A data de nascimento não pode estar no futuro.",
        "dataNascimento"
      );
    }

    const id = props.id ? PacienteId.from(props.id) : PacienteId.create();
    const numeroProcesso = props.numeroProcesso
      ? NumeroProcesso.create(props.numeroProcesso)
      : NumeroProcesso.gerarAutomatico();

    const contacto = Contacto.create({
      telefone: props.telefone,
      email: props.email,
    });

    const documento = DocumentoIdentificacao.create({
      nif: props.nif,
      bi: props.bi,
      documentoOutro: props.documento,
    });

    const agora = new Date();

    const paciente = new Paciente(id, {
      numeroProcesso,
      nome: nomeLimpo,
      dataNascimento: props.dataNascimento,
      sexo: props.sexo,
      contacto,
      documento,
      endereco: props.endereco?.trim(),
      foto: props.foto,
      observacoes: props.observacoes?.trim(),
      criadoEm: agora,
      atualizadoEm: agora,
    });

    paciente.addDomainEvent({
      type: "PacienteRegistado",
      aggregateId: id.value,
      timestamp: agora,
      dados: {
        nome: paciente.nome,
        numeroProcesso: numeroProcesso.value,
        telefone: contacto.telefone,
        email: contacto.email,
      },
    });

    return paciente;
  }

  static reconstituir(id: PacienteId, props: PacienteProps): Paciente {
    return new Paciente(id, props);
  }

  atualizarDados(props: {
    nome?: string;
    dataNascimento?: Date;
    sexo?: string;
    endereco?: string;
    foto?: string;
    observacoes?: string;
  }): void {
    if (props.nome !== undefined) {
      const nomeLimpo = props.nome.trim();
      if (!nomeLimpo || nomeLimpo.length < 2) {
        throw new ValidationException(
          "O nome do paciente deve conter pelo menos 2 caracteres.",
          "nome"
        );
      }
      this.nome = nomeLimpo;
    }

    if (props.dataNascimento !== undefined) {
      if (props.dataNascimento > new Date()) {
        throw new ValidationException(
          "A data de nascimento não pode estar no futuro.",
          "dataNascimento"
        );
      }
      this.dataNascimento = props.dataNascimento;
    }

    if (props.sexo !== undefined) this.sexo = props.sexo;
    if (props.endereco !== undefined) this.endereco = props.endereco?.trim();
    if (props.foto !== undefined) this.foto = props.foto;
    if (props.observacoes !== undefined) this.observacoes = props.observacoes?.trim();

    this.atualizadoEm = new Date();

    this.addDomainEvent({
      type: "PacienteAtualizado",
      aggregateId: this.id.value,
      timestamp: this.atualizadoEm,
      alteracoes: { ...props },
    });
  }

  atualizarContacto(telefone?: string, email?: string): void {
    this.contacto = Contacto.create({ telefone, email });
    this.atualizadoEm = new Date();

    this.addDomainEvent({
      type: "PacienteAtualizado",
      aggregateId: this.id.value,
      timestamp: this.atualizadoEm,
      alteracoes: { telefone, email },
    });
  }

  atualizarDocumentos(nif?: string, bi?: string, documento?: string): void {
    this.documento = DocumentoIdentificacao.create({
      nif,
      bi,
      documentoOutro: documento,
    });
    this.atualizadoEm = new Date();
  }

  adicionarObservacao(texto: string): void {
    const textoLimpo = texto.trim();
    if (!textoLimpo) return;

    const dataPrefixo = `[${new Date().toLocaleDateString("pt-PT")}]`;
    this.observacoes = this.observacoes
      ? `${this.observacoes}\n${dataPrefixo} ${textoLimpo}`
      : `${dataPrefixo} ${textoLimpo}`;

    this.atualizadoEm = new Date();

    this.addDomainEvent({
      type: "PacienteObservacaoAdicionada",
      aggregateId: this.id.value,
      timestamp: this.atualizadoEm,
      observacao: textoLimpo,
    });
  }

  calcularIdade(dataReferencia: Date = new Date()): number | null {
    if (!this.dataNascimento) return null;
    const nasc = new Date(this.dataNascimento);
    let anos = dataReferencia.getFullYear() - nasc.getFullYear();
    const m = dataReferencia.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && dataReferencia.getDate() < nasc.getDate())) {
      anos--;
    }
    return Math.max(0, anos);
  }

  // Getters
  getId(): PacienteId {
    return this.id;
  }

  getNumeroProcesso(): NumeroProcesso {
    return this.numeroProcesso;
  }

  getNome(): string {
    return this.nome;
  }

  getDataNascimento(): Date | undefined {
    return this.dataNascimento;
  }

  getSexo(): string | undefined {
    return this.sexo;
  }

  getContacto(): Contacto {
    return this.contacto;
  }

  getDocumento(): DocumentoIdentificacao {
    return this.documento;
  }

  getEndereco(): string | undefined {
    return this.endereco;
  }

  getFoto(): string | undefined {
    return this.foto;
  }

  getObservacoes(): string | undefined {
    return this.observacoes;
  }

  getCriadoEm(): Date {
    return this.criadoEm;
  }

  getAtualizadoEm(): Date {
    return this.atualizadoEm;
  }
}

import { Atendimento } from "@/domain/atendimento/entities/Atendimento";
import { IAtendimentoRepository } from "@/domain/atendimento/repositories/IAtendimentoRepository";

export class InMemoryAtendimentoRepository implements IAtendimentoRepository {
  public items: Atendimento[] = [];

  async salvar(atendimento: Atendimento): Promise<void> {
    const index = this.items.findIndex((item) => item.getId() === atendimento.getId());
    if (index === -1) {
      this.items.push(atendimento);
    } else {
      this.items[index] = atendimento;
    }
  }

  async obterPorId(id: string): Promise<Atendimento | null> {
    return this.items.find((item) => item.getId() === id) || null;
  }

  async obterPorCodigo(codigo: string): Promise<Atendimento | null> {
    return this.items.find((item) => item.getCodigo() === codigo) || null;
  }

  async obterProximoNumeroSequencial(tipo: string): Promise<number> {
    const ano = new Date().getFullYear();
    const prefixo = tipo === "URGENCIA" ? "URG" : "CON";
    const relevantItems = this.items.filter((item) =>
      item.getCodigo().startsWith(`AT-${ano}-${prefixo}`)
    );
    return relevantItems.length + 1;
  }

  async obterUltimaSenha(tipo: string): Promise<string> {
    const tipoPrefixo = tipo === "CONSULTA" ? "C" : "U";
    const relevantItems = this.items.filter(
      (item) => item.getSenha()?.getTipo() === tipo
    );

    if (relevantItems.length === 0) {
      return `${tipoPrefixo}-000`;
    }

    const lastSenha = relevantItems[relevantItems.length - 1].getSenha()!.getCodigo();
    return lastSenha;
  }

  async listar(filtros: any): Promise<{ data: Atendimento[]; total: number }> {
    return { data: this.items, total: this.items.length };
  }

  public clear(): void {
    this.items = [];
  }
}
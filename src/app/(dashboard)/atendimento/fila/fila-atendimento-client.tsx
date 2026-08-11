"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, ListOrdered, Printer, RotateCcw, UserRoundCheck, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { usePermissoes } from "@/hooks/use-permissoes";
import { chamarProximo, devolverParaFila, repetirChamada } from "@/server/actions/atendimento-actions";

type TipoFila = "CONSULTA" | "URGENCIA";

interface ItemFila {
  id: number;
  atendimentoId: number;
  tipoFila: TipoFila;
  posicao: number;
  status: string;
  chamadoEm: string | null;
  atendimento: {
    id: number;
    codigo: string;
    tipo: string;
    estado: string;
    prioridade: string;
    paciente: { id: number; nome: string; numeroProcesso: string | null };
    especialidade: { nome: string } | null;
    senha: { codigo: string; status: string; chamadaEm: string | null } | null;
    urgencia: { classificacao: { nome: string; cor: string; nivel: number } | null } | null;
  };
}

interface FilaAtendimentoClientProps { fila: ItemFila[] }

function anunciar(nome: string, senha?: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const mensagem = new SpeechSynthesisUtterance(`Paciente ${nome}${senha ? `, senha ${senha}` : ""}, dirigir-se ao atendimento, por favor.`);
  mensagem.lang = "pt-PT";
  mensagem.rate = 0.9;
  window.speechSynthesis.speak(mensagem);
}

function escaparHtml(valor: string) {
  return valor.replace(/[&<>\"]/g, (caractere) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[caractere] || caractere);
}

export function FilaAtendimentoClient({ fila }: FilaAtendimentoClientProps) {
  const router = useRouter();
  const { pode } = usePermissoes();
  const [tipoAtivo, setTipoAtivo] = useState<TipoFila>("CONSULTA");
  const [processando, setProcessando] = useState(false);

  const itens = useMemo(() => fila.filter((item) => item.tipoFila === tipoAtivo), [fila, tipoAtivo]);
  const chamados = itens.filter((item) => item.status === "CHAMADO");
  const aguardando = itens.filter((item) => item.status === "EM_FILA");

  const atualizar = () => router.refresh();

  const imprimirFicha = (item: ItemFila) => {
    const janela = window.open("", "_blank", "width=420,height=600");
    if (!janela) {
      toast.error("Permita janelas pop-up para imprimir a ficha");
      return;
    }

    const senha = item.atendimento.senha?.codigo || item.atendimento.codigo;
    const agora = new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeStyle: "short" }).format(new Date());
    janela.document.write(`<!doctype html><html lang="pt"><head><title>Ficha ${escaparHtml(senha)}</title><style>body{font-family:Arial,sans-serif;margin:0;padding:18px;color:#111}.ficha{border:2px dashed #111;padding:18px;text-align:center}.hospital{font-size:12px;font-weight:bold;letter-spacing:1px}.tipo{font-size:14px;margin:14px 0 6px}.senha{font-size:54px;font-weight:800;line-height:1}.nome{font-size:18px;font-weight:bold;margin:16px 0 4px}.detalhe{font-size:12px;color:#444;margin:4px 0}.rodape{border-top:1px dashed #555;margin-top:16px;padding-top:10px;font-size:10px;color:#555}@media print{body{padding:0}.ficha{border:0}}</style></head><body><main class="ficha"><div class="hospital">GESTAO HOSPITALAR</div><div class="tipo">${item.tipoFila === "CONSULTA" ? "FICHA DE CONSULTA" : "FICHA DE URGENCIA"}</div><div class="senha">${escaparHtml(senha)}</div><div class="nome">${escaparHtml(item.atendimento.paciente.nome)}</div><div class="detalhe">${escaparHtml(item.atendimento.especialidade?.nome || "Atendimento clinico")}</div><div class="detalhe">Prioridade: ${escaparHtml(item.atendimento.prioridade)}</div><div class="rodape">Emitida em ${escaparHtml(agora)}<br/>Apresente esta ficha quando for chamado.</div></main><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script></body></html>`);
    janela.document.close();
  };

  const chamar = async () => {
    setProcessando(true);
    try {
      const proximo = await chamarProximo(tipoAtivo);
      if (!proximo) {
        toast.info("Não há pacientes a aguardar nesta fila");
        return;
      }
      anunciar(proximo.atendimento.paciente.nome, proximo.atendimento.senha?.codigo);
      toast.success(`${proximo.atendimento.paciente.nome} foi chamado`);
      atualizar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível chamar o próximo paciente");
    } finally {
      setProcessando(false);
    }
  };

  const repetir = async (item: ItemFila) => {
    setProcessando(true);
    try {
      await repetirChamada(item.atendimentoId);
      anunciar(item.atendimento.paciente.nome, item.atendimento.senha?.codigo);
      toast.success("Chamada repetida");
      atualizar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível repetir a chamada");
    } finally {
      setProcessando(false);
    }
  };

  const devolver = async (item: ItemFila) => {
    setProcessando(true);
    try {
      await devolverParaFila(item.atendimentoId);
      toast.success("Paciente devolvido à fila");
      atualizar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível devolver o paciente à fila");
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Fila e chamadas</h1>
          <p className="text-sm text-muted-foreground">Controle a ordem de atendimento e a chamada de pacientes.</p>
        </div>
        {pode("atendimento", "editar") && (
          <>
          <Button variant="outline" onClick={() => aguardando[0] && imprimirFicha(aguardando[0])} disabled={aguardando.length === 0}>
            <Printer className="h-4 w-4" /> Imprimir ficha
          </Button>
          <Button onClick={chamar} disabled={processando || aguardando.length === 0}>
            <BellRing className="h-4 w-4" /> Chamar próximo
          </Button>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        {(["CONSULTA", "URGENCIA"] as TipoFila[]).map((tipo) => (
          <button key={tipo} type="button" onClick={() => setTipoAtivo(tipo)} className={`rounded-lg border p-3 text-left transition-colors ${tipoAtivo === tipo ? "border-primary bg-primary/10 text-primary" : "bg-card hover:bg-muted"}`}>
            <span className="block text-sm font-semibold">{tipo === "CONSULTA" ? "Consultas" : "Urgências"}</span>
            <span className="text-xs text-muted-foreground">{fila.filter((item) => item.tipoFila === tipo && item.status === "EM_FILA").length} a aguardar</span>
          </button>
        ))}
      </div>

      {chamados.length > 0 && (
        <Card className="border-primary/40 bg-primary/[0.03]">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Volume2 className="h-4 w-4 text-primary" /> Pacientes chamados</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {chamados.map((item) => (
              <div key={item.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-lg font-bold">{item.atendimento.senha?.codigo || item.atendimento.codigo}</p><p className="font-medium">{item.atendimento.paciente.nome}</p><p className="text-xs text-muted-foreground">{item.atendimento.especialidade?.nome || "Atendimento clínico"}</p></div>
                  <Badge>Em atendimento</Badge>
                </div>
                {pode("atendimento", "editar") && <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => repetir(item)} disabled={processando}><Volume2 className="h-3.5 w-3.5" /> Repetir</Button><Button size="sm" variant="ghost" onClick={() => devolver(item)} disabled={processando}><RotateCcw className="h-3.5 w-3.5" /> Voltar à fila</Button></div>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ListOrdered className="h-4 w-4" /> Aguardando atendimento ({aguardando.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {aguardando.length === 0 ? <EmptyState icon={<UserRoundCheck className="h-8 w-8 text-muted-foreground" />} title="Fila vazia" description="Não há pacientes à espera neste momento." /> : <div className="divide-y">{aguardando.map((item, index) => <div key={item.id} className="flex items-center gap-4 px-5 py-4"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">{index + 1}</div><div className="min-w-0 flex-1"><p className="font-medium">{item.atendimento.paciente.nome}</p><p className="text-xs text-muted-foreground">{item.atendimento.senha?.codigo || item.atendimento.codigo} · {item.atendimento.especialidade?.nome || "Atendimento clínico"}</p></div>{item.atendimento.urgencia?.classificacao && <Badge variant="destructive">{item.atendimento.urgencia.classificacao.nome}</Badge>}<Badge variant={item.atendimento.prioridade === "Urgente" ? "destructive" : "secondary"}>{item.atendimento.prioridade}</Badge></div>)}</div>}
        </CardContent>
      </Card>
    </div>
  );
}

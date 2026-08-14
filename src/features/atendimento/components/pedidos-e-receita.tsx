"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export type PedidoFormulario = { tipoExameId: string; prioridade: string; justificativa: string };
export type MedicamentoFormulario = { medicamento: string; dosagem: string; via: string; frequencia: string; duracaoDias: string; quantidade: string; observacoes: string };

export function PedidosEReceita({ tiposExame, pedidos, medicamentos, observacoes, onPedidosChange, onMedicamentosChange, onObservacoesChange }: {
  tiposExame: { id: number; nome: string; modalidade: string | null }[];
  pedidos: PedidoFormulario[];
  medicamentos: MedicamentoFormulario[];
  observacoes: string;
  onPedidosChange: (pedidos: PedidoFormulario[]) => void;
  onMedicamentosChange: (medicamentos: MedicamentoFormulario[]) => void;
  onObservacoesChange: (observacoes: string) => void;
}) {
  const novoPedido = () => onPedidosChange([...pedidos, { tipoExameId: "", prioridade: "Normal", justificativa: "" }]);
  const novoMedicamento = () => onMedicamentosChange([...medicamentos, { medicamento: "", dosagem: "", via: "Oral", frequencia: "", duracaoDias: "", quantidade: "", observacoes: "" }]);

  return <div className="space-y-5 border-t pt-5">
    <div><div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">Pedidos de exame</h3><Button type="button" size="sm" variant="outline" onClick={novoPedido}><Plus className="h-3.5 w-3.5" /> Adicionar exame</Button></div>
      {pedidos.map((pedido, indice) => <div key={indice} className="mb-2 grid gap-2 rounded-lg border p-3 md:grid-cols-[1fr_130px_36px]"><Select options={tiposExame.map((tipo) => ({ value: tipo.id, label: `${tipo.nome}${tipo.modalidade ? ` (${tipo.modalidade})` : ""}` }))} placeholder="Tipo de exame" value={pedido.tipoExameId} onChange={(event) => onPedidosChange(pedidos.map((item, i) => i === indice ? { ...item, tipoExameId: event.target.value } : item))} /><Select options={[{ value: "Normal", label: "Normal" }, { value: "Prioridade", label: "Prioridade" }, { value: "Urgente", label: "Urgente" }]} value={pedido.prioridade} onChange={(event) => onPedidosChange(pedidos.map((item, i) => i === indice ? { ...item, prioridade: event.target.value } : item))} /><Button type="button" size="icon" variant="ghost" onClick={() => onPedidosChange(pedidos.filter((_, i) => i !== indice))}><Trash2 className="h-4 w-4" /></Button><input className="md:col-span-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm" placeholder="Justificativa clínica (opcional)" value={pedido.justificativa} onChange={(event) => onPedidosChange(pedidos.map((item, i) => i === indice ? { ...item, justificativa: event.target.value } : item))} /></div>)}</div>
    <div><div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">Receita</h3><Button type="button" size="sm" variant="outline" onClick={novoMedicamento}><Plus className="h-3.5 w-3.5" /> Adicionar medicamento</Button></div>
      {medicamentos.map((medicamento, indice) => <div key={indice} className="mb-2 grid gap-2 rounded-lg border p-3 md:grid-cols-3"><input className="rounded-md border border-input bg-transparent px-3 py-2 text-sm" placeholder="Medicamento *" value={medicamento.medicamento} onChange={(event) => onMedicamentosChange(medicamentos.map((item, i) => i === indice ? { ...item, medicamento: event.target.value } : item))} /><input className="rounded-md border border-input bg-transparent px-3 py-2 text-sm" placeholder="Dosagem" value={medicamento.dosagem} onChange={(event) => onMedicamentosChange(medicamentos.map((item, i) => i === indice ? { ...item, dosagem: event.target.value } : item))} /><div className="flex gap-2"><input className="min-w-0 flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm" placeholder="Frequência" value={medicamento.frequencia} onChange={(event) => onMedicamentosChange(medicamentos.map((item, i) => i === indice ? { ...item, frequencia: event.target.value } : item))} /><Button type="button" size="icon" variant="ghost" onClick={() => onMedicamentosChange(medicamentos.filter((_, i) => i !== indice))}><Trash2 className="h-4 w-4" /></Button></div><input className="rounded-md border border-input bg-transparent px-3 py-2 text-sm" placeholder="Via (ex.: Oral)" value={medicamento.via} onChange={(event) => onMedicamentosChange(medicamentos.map((item, i) => i === indice ? { ...item, via: event.target.value } : item))} /><input type="number" min="1" className="rounded-md border border-input bg-transparent px-3 py-2 text-sm" placeholder="Duração (dias)" value={medicamento.duracaoDias} onChange={(event) => onMedicamentosChange(medicamentos.map((item, i) => i === indice ? { ...item, duracaoDias: event.target.value } : item))} /><input className="rounded-md border border-input bg-transparent px-3 py-2 text-sm" placeholder="Quantidade" value={medicamento.quantidade} onChange={(event) => onMedicamentosChange(medicamentos.map((item, i) => i === indice ? { ...item, quantidade: event.target.value } : item))} /></div>)}</div>
    {medicamentos.length > 0 && <textarea className="min-h-15 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" placeholder="Observações gerais da receita" value={observacoes} onChange={(event) => onObservacoesChange(event.target.value)} />}
  </div>;
}

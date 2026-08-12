"use client";

import { useEffect, useState } from "react";
import {
  obterDisponibilidades,
  definirDisponibilidade,
  desativarDisponibilidade,
} from "@/server/actions/consultorio-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Plus } from "lucide-react";

const DIAS_SEMANA = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

interface Disponibilidade {
  id: number;
  diaSemana: number;
  horaAbertura: string;
  horaFechamento: string;
  ativo: boolean;
}

interface HorarioComponentProps {
  consultorioId: number;
}

export default function HorarioConsultorioComponent({
  consultorioId,
}: HorarioComponentProps) {
  const [disponibilidades, setDisponibilidades] = useState<
    Map<number, Disponibilidade>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<number | null>(null);
  const [horarios, setHorarios] = useState<Record<number, { abertura: string; fechamento: string }>>({});

  useEffect(() => {
    carregarDisponibilidades();
  }, [consultorioId]);

  async function carregarDisponibilidades() {
    try {
      const dados = await obterDisponibilidades(consultorioId);
      const mapa = new Map();
      const novoHorarios: Record<number, { abertura: string; fechamento: string }> = {};

      dados.forEach((d: Disponibilidade) => {
        mapa.set(d.diaSemana, d);
        novoHorarios[d.diaSemana] = {
          abertura: d.horaAbertura,
          fechamento: d.horaFechamento,
        };
      });

      setDisponibilidades(mapa);
      setHorarios(novoHorarios);
    } catch (error) {
      console.error("Erro ao carregar disponibilidades:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSalvarHorario(diaSemana: number) {
    try {
      const h = horarios[diaSemana];
      if (!h || !h.abertura || !h.fechamento) return;

      await definirDisponibilidade({
        consultorioId,
        diaSemana,
        horaAbertura: h.abertura,
        horaFechamento: h.fechamento,
      });

      setEditando(null);
      await carregarDisponibilidades();
    } catch (error) {
      console.error("Erro ao salvar horário:", error);
    }
  }

  async function handleRemoverHorario(diaSemana: number) {
    try {
      await desativarDisponibilidade(consultorioId, diaSemana);
      setHorarios((prev) => {
        const novo = { ...prev };
        delete novo[diaSemana];
        return novo;
      });
      await carregarDisponibilidades();
    } catch (error) {
      console.error("Erro ao remover horário:", error);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Carregando horários...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horários de Funcionamento</CardTitle>
        <CardDescription>
          Defina os horários disponíveis para cada dia da semana
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {DIAS_SEMANA.map((dia, index) => {
            const tem = disponibilidades.has(index);
            const h = horarios[index];

            return (
              <div
                key={index}
                className="border rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-24">
                    <p className="font-medium">{dia}</p>
                  </div>

                  {tem && editando !== index ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {h?.abertura} - {h?.fechamento}
                      </Badge>
                    </div>
                  ) : editando === index ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={h?.abertura || "09:00"}
                        onChange={(e) =>
                          setHorarios((prev) => ({
                            ...prev,
                            [index]: {
                              ...(prev[index] || {}),
                              abertura: e.target.value,
                            },
                          }))
                        }
                        className="w-32"
                      />
                      <span>até</span>
                      <Input
                        type="time"
                        value={h?.fechamento || "18:00"}
                        onChange={(e) =>
                          setHorarios((prev) => ({
                            ...prev,
                            [index]: {
                              ...(prev[index] || {}),
                              fechamento: e.target.value,
                            },
                          }))
                        }
                        className="w-32"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      Não configurado
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  {editando === index ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleSalvarHorario(index)}
                      >
                        Salvar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditando(null)}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditando(index)}
                      >
                        {tem ? "Editar" : "Adicionar"}
                      </Button>
                      {tem && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoverHorario(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

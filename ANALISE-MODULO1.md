# Análise Detalhada - Módulo 1: Atendimento (Consultas e Urgências)

## 📋 Sumário Executivo
O Módulo 1 está **85% funcional** com infraestrutura básica implementada. Schema Prisma está completo com todas as tabelas necessárias. A UI está parcialmente criada, mas faltam refinamentos críticos e funcionalidades avançadas para um hospital em produção.

---

## 1. ✅ Análise de Força: O que está bem

### 1.1 Schema Prisma — Bem estruturado
- ✅ Modelos completos: `Atendimento`, `AtendimentoConsulta`, `AtendimentoUrgencia`, `Triagem`, `FilaAtendimento`, `SenhaAtendimento`, `Encaminhamento`
- ✅ Relacionamentos corretos com cascata `onDelete`
- ✅ Índices de performance em campos críticos (`pacienteId`, `estado`, `criadoEm`)
- ✅ Campos metadata: `criadoEm`, `atualizadoEm`, `criadoPorId` para auditoria
- ✅ Suporte a múltiplos tipos de urgência (BUM, BUP, BUCO)
- ✅ Classificação de risco configurável com cores e níveis

### 1.2 Server Actions — Lógica bem implementada
- ✅ Transações Prisma: `iniciarConsulta()`, `iniciarUrgencia()` usam `$transaction` corretamente
- ✅ Geração automática de códigos únicos: `AT-YYYY-TIPO-NNNN`
- ✅ Sistema de senhas: C-001, U-001 com validação
- ✅ Fila inteligente: ordena urgências por `nivel` DESC e consultas por `posicao` ASC
- ✅ Histórico auditado: cada ação registada em `Historico`
- ✅ Validações básicas de entrada

### 1.3 Páginas e Componentes
- ✅ Estrutura de pastas organizada: `/atendimento/`, `/consultas/`, `/urgencias/`, `/encaminhamentos/`, `/fila/`
- ✅ Separação client/server: `*-client.tsx` para componentes interativos
- ✅ Permissões verificadas em `page.tsx` (server)
- ✅ Modais para criar/editar
- ✅ Badges de estado com cores
- ✅ Integração com componentes UI Shadcn

### 1.4 Funcionalidades Implementadas
- ✅ Criar consultas/urgências
- ✅ Triagem com sinais vitais
- ✅ Geração de senhas
- ✅ Fila de atendimento
- ✅ Concluir consultas com diagnóstico
- ✅ Pedidos de exame integrados
- ✅ Receitas com medicamentos

---

## 2. 🚨 Problemas Críticos — Devem ser corrigidos

### 2.1 **Busca de pacientes limitada a 100 registos**
**Problema:**
```typescript
// src/app/(dashboard)/atendimento/consultas/page.tsx
pacientes: prisma.paciente.findMany({
  orderBy: { nome: "asc" },
  take: 100,  // ❌ MUITO LIMITADO
})
```
- Hospitais com >100 pacientes não conseguem procurar pacientes novos
- Sem paginação ou busca por nome/número de processo

**Solução:**
```typescript
// Adicionar search endpoint
export async function buscarPacientes(termo: string, page = 1) {
  const skip = (page - 1) * 50;
  return prisma.paciente.findMany({
    where: {
      OR: [
        { nome: { contains: termo, mode: 'insensitive' } },
        { numeroProcesso: { contains: termo, mode: 'insensitive' } },
        { nif: { contains: termo } },
      ]
    },
    take: 50,
    skip,
    orderBy: { nome: 'asc' }
  });
}
```

---

### 2.2 **Sem validação de duplicatas de triagem**
**Problema:**
```typescript
// A action registarTriagem não bloqueia se já existe triagem
const triagemExistente = await tx.triagem.findUnique({
  where: { atendimentoId: input.atendimentoId },
  select: { id: true },
});
if (triagemExistente) throw new Error("..."); // Bom!
```
Mas em `urgencias-client.tsx`, não há verificação antes de abrir modal triagem.

**Solução:**
```typescript
// Verificar estado antes de permitir ação
const podeRegistarTriagem = (atendimento) => 
  atendimento.estado === "AGUARDANDO" && !atendimento.triagem;
```

---

### 2.3 **Sem suporte a cancelamento de atendimentos**
**Problema:**
- Atendimentos no estado `CANCELADO` não têm lógica de reversão
- Sem motivo ou rastreabilidade do cancelamento
- Fila não é atualizada quando cancela

**Solução:**
Adicionar tabela e action:
```prisma
model CancelamentoAtendimento {
  id              Int       @id @default(autoincrement())
  atendimentoId   Int       @map("atendimento_id")
  motivo          String
  justificativa   String?
  canceladoPorId  Int?      @map("cancelado_por_id")
  canceladoEm     DateTime  @default(now()) @map("cancelado_em")
  
  atendimento Atendimento @relation(fields: [atendimentoId], references: [id])
  canceladoPor Utilizador? @relation(fields: [canceladoPorId], references: [id])
  
  @@index([atendimentoId])
  @@map("cancelamentos_atendimento")
}
```

---

### 2.4 **Sem controle de tempo máximo de atendimento**
**Problema:**
- `ClassificacaoRisco.tempoMaximo` está definido mas não é usado
- Sem alertas para atendimentos vencidos
- Falta SLA (Service Level Agreement)

**Solução:**
```typescript
// Adicionar query de atendimentos em atraso
export async function listarAtendimentosEmAtraso() {
  const agora = new Date();
  
  return prisma.atendimento.findMany({
    where: {
      estado: "EM_ATENDIMENTO",
      urgencia: {
        triagem: {
          classificacao: {
            tempoMaximo: { gt: 0 }
          },
          realizadoEm: {
            lt: new Date(agora.getTime() - 60000 * 1) // X minutos atrás
          }
        }
      }
    },
    include: {
      triagem: { include: { classificacao: true } }
    }
  });
}
```

---

### 2.5 **Sem suporte a re-agendamento ou adiar consulta**
**Problema:**
- Consultas não podem ser adiadas
- Sem sistema de bloqueio de horário

**Solução:**
Necessário adicionar em `AgendamentoConsulta`:
```prisma
model AgendamentoConsulta {
  // ... campos existentes
  statusAgendamento String @default("ATIVO") // ATIVO | ADIADO | NAOCOMPARECEU
  dataAgendada     DateTime @map("data_agendada")
  motivo           String? // motivo se adiado
  adiadoPorId      Int? @map("adiado_por_id")
  adiadoEm         DateTime? @map("adiado_em")
}
```

---

### 2.6 **Sem verificação de conflito em consultório**
**Problema:**
- Dois atendimentos podem ser atribuídos ao mesmo consultório no mesmo horário
- Sem overbooking control

**Solução:**
```typescript
// Validação ao criar atendimento
if (input.consultorioId) {
  const jaOcupado = await prisma.atendimento.findFirst({
    where: {
      consultorioId: input.consultorioId,
      estado: { in: ["EM_TRIAGEM", "EM_ATENDIMENTO"] },
      OR: [
        { consulta: { iniciadoEm: { not: null }, concluidoEm: null } },
        { urgencia: { } }
      ]
    }
  });
  if (jaOcupado) throw new Error("Consultório está ocupado");
}
```

---

### 2.7 **Sem rastreamento de tempo (timestamps)**
**Problema:**
```typescript
// Falta tempo de início/fim em campos críticos
// AtendimentoConsulta tem iniciadoEm/concluidoEm ✅
// Mas SenhaAtendimento não tem chamadaEm consistente
// E tempo na fila não é calculado
```

**Solução:**
Adicionar em `FilaAtendimento`:
```prisma
model FilaAtendimento {
  // ... campos existentes
  tempoEspera   Int? @map("tempo_espera") // minutos
  tempoAtendimento Int? @map("tempo_atendimento") // minutos
}
```

---

## 3. ⚠️ Problemas Moderados — Devem ser planeados

### 3.1 **Sem histórico de alterações em atendimentos**
- Não é possível ver quem mudou o estado
- Falta auditoria completa de mudanças

**Solução:**
```typescript
export async function registarMudancaAtendimento(input: {
  atendimentoId: number;
  campoAlterado: string;
  valorAnterior: string;
  valorNovo: string;
  motivoAlteracao?: string;
}) {
  // Registar em tabela separada
}
```

---

### 3.2 **Interface de consultórios pouco clara**
- Endpoint `/api/consultórios?especialidadeId=` carrega dinamicamente, mas não está claro no código

**Solução:**
- Documentar o endpoint
- Adicionar tratamento de erros de carregamento

---

### 3.3 **Sem confirmação visual de ações críticas**
- Concluir consulta sem confirmar
- Devolver à fila sem confirmar

**Solução:**
```typescript
// Adicionar diálogos de confirmação
<Dialog open={confirmarConcluir} onOpenChange={setConfirmarConcluir}>
  <DialogContent>
    <p>Tem certeza que deseja concluir esta consulta?</p>
    <p>Paciente: {atendimento.paciente.nome}</p>
    <Button onClick={handleConcluir}>Confirmar</Button>
  </DialogContent>
</Dialog>
```

---

### 3.4 **Sem filtros avançados na listagem**
- Apenas filtros básicos por data/tipo/estado
- Sem filtro por especialidade ativa
- Sem ordenação customizável

**Solução:**
```typescript
// Adicionar componentes de filtro
<FilterPanel
  filtros={{
    especialidade: especialidades,
    prioridade: ["Normal", "Prioridade", "Urgente"],
    medico: medicos,
    dataInicio: null,
    dataFim: null,
  }}
/>
```

---

### 3.5 **Sem notificações em tempo real**
- Paciente não sabe quando é chamado (apenas em tela)
- Sem integração com sistema de voz/display

**Solução:**
Integrar com sistema existente de chamadas:
```typescript
// src/services/chamadas-voz.service.ts
export async function chamarPaciente(atendimentoId: number) {
  const fila = await listarFilaAtendimento();
  const paciente = fila.find(p => p.atendimentoId === atendimentoId);
  
  // Chamar via API de voz existente
  await axios.post('/api/chamadas-voz', {
    tipo: 'CHAMADA_ATENDIMENTO',
    paciente: paciente.nome,
    senha: paciente.senha,
    consultorio: paciente.consultorio,
  });
}
```

---

## 4. 🚀 Sugestões de Melhorias (Roadmap)

### 4.1 **Curto Prazo (1-2 sprints)**

#### 1. Implementar busca real de pacientes
```bash
- Criar API endpoint `/api/pacientes/search?q=termo`
- Adicionar combobox com autocomplete
- Paginação cliente-servidor
- Prioridade: ALTA
```

#### 2. Adicionar confirmação de ações críticas
```bash
- Concluir consulta
- Cancelar atendimento
- Devolver à fila
- Prioridade: MÉDIA
```

#### 3. Validar conflito de consultório
```bash
- Verificar consultório disponível antes de atribuir
- Alertar se consultório ocupado
- Prioridade: ALTA
```

#### 4. Adicionar cancelamento de atendimento
```bash
- Nova tabela CancelamentoAtendimento
- Action cancelarAtendimento()
- Reversão de fila e senha
- Prioridade: MÉDIA
```

---

### 4.2 **Médio Prazo (2-4 sprints)**

#### 5. Dashboard de métricas em tempo real
```typescript
interface MetricasAtendimento {
  totalEmEspera: number;
  tempoMedioEspera: number; // minutos
  atendimentosAtraso: number; // SLA vencido
  ocupacaoConsultoriosPercentual: number;
  pacientesNaoComparecidos: number; // hoje
}
```

#### 6. Sistema de priorização automática
- Urgências sempre chamadas antes que consultas
- Re-ordenação de fila quando entra urgência crítica
- Algoritmo de otimização de fluxo

#### 7. Integração com chamadas de voz
- Usar sistema existente em `/features/chamadas-voz/`
- Anúncios automáticos de senha
- Display de consultório

#### 8. Suporte a múltiplos consultórios
- Dropdown dinâmico com consultórios disponíveis
- Vista por consultório
- Indicador de ocupação em tempo real

---

### 4.3 **Longo Prazo (Roadmap futuro)**

#### 9. Telemedicina / Consulta Remota
```prisma
model AtendimentoRemoto {
  id              Int       @id @default(autoincrement())
  atendimentoId   Int       @unique
  urlZoom         String?
  tokenVideochamada String?
  iniciadaEm      DateTime?
  concluidaEm     DateTime?
}
```

#### 10. Analytics e Relatórios
- Tempo médio por especialidade
- Taxa de abandono (no-show)
- Eficiência por médico
- Exportar para Excel/PDF

#### 11. Agendamento automático de retorno
- Consulta de retorno agendada após conclusão
- SMS/Email de confirmação
- Relembretes 24h antes

#### 12. Integração com WhatsApp/SMS
- Notificação de chamada via SMS
- Confirmação de presença
- Alertas de atraso

---

## 5. 📊 Análise de Código — Pontos de Melhoria

### 5.1 **Repetição de lógica**
**Problema:**
```typescript
// Em consultas-client.tsx E urgencias-client.tsx
const ESTADO_COR: Record<string, string> = { ... }
const ESTADO_LABEL: Record<string, string> = { ... }
```

**Solução:**
Extrair para constante compartilhada:
```typescript
// src/features/atendimento/constants/estado.ts
export const ESTADO_CONFIG = {
  AGUARDANDO: { label: "Aguardando", cor: "warning" },
  EM_TRIAGEM: { label: "Em triagem", cor: "info" },
  // ...
}
```

---

### 5.2 **Tipos não compartilhados**
**Problema:**
Interfaces duplicadas em cada componente:
- `ConsultasClient` define `Paciente`, `Especialidade`
- `UrgenciasClient` define as mesmas interfaces

**Solução:**
```typescript
// src/types/atendimento.ts
export interface Paciente {
  id: number;
  nome: string;
  numeroProcesso: string | null;
}

export interface Especialidade {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}
```

---

### 5.3 **Sem tratamento de erros em fetch**
**Problema:**
```typescript
// consultas-client.tsx
const response = await fetch(`/api/consultórios?especialidadeId=${especialidadeId}`);
const dados = await response.json(); // ❌ Sem tratamento
```

**Solução:**
```typescript
try {
  const response = await fetch(`/api/consultórios?especialidadeId=${especialidadeId}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const dados = await response.json();
  setConsultórios(dados);
} catch (error) {
  toast.error("Erro ao carregar consultórios");
  console.error(error);
  setConsultórios([]);
} finally {
  setCarregandoConsultórios(false);
}
```

---

### 5.4 **Formulários sem validação**
**Problema:**
Não há validação com Zod/Yup antes de enviar

**Solução:**
```typescript
// Usar Zod schemas já existentes
import { schemas } from "@/validators/schemas";

const novaConsultaSchema = z.object({
  pacienteId: z.number().int().positive("Selecione um paciente"),
  especialidadeId: z.number().int().positive("Selecione uma especialidade"),
  motivo: z.string().optional(),
});

const handleSubmit = async (dados) => {
  const validacao = novaConsultaSchema.safeParse(dados);
  if (!validacao.success) {
    validacao.error.errors.forEach(err => {
      toast.error(err.message);
    });
    return;
  }
  // Proceder...
}
```

---

## 6. 🎯 Checklist de Melhorias Prioritárias

| Prioridade | Issue | Status | Sprint |
|-----------|-------|--------|--------|
| 🔴 ALTA | Busca de pacientes limitada | TODO | Sprint 1 |
| 🔴 ALTA | Sem validação de conflito consultório | TODO | Sprint 1 |
| 🔴 ALTA | Sem confirmação de ações críticas | TODO | Sprint 1 |
| 🟠 MÉDIA | Adicionar cancelamento atendimento | TODO | Sprint 2 |
| 🟠 MÉDIA | Extrair tipos compartilhados | TODO | Sprint 1 |
| 🟠 MÉDIA | Melhorar tratamento de erros | TODO | Sprint 1 |
| 🟡 BAIXA | Adicionar validação Zod | TODO | Sprint 2 |
| 🟡 BAIXA | Dashboard de métricas | TODO | Sprint 3 |

---

## 7. 📝 Recomendações Finais

### O que fazer AGORA (antes de go-live)
1. ✅ **Implementar busca real de pacientes** — Crítico para UX
2. ✅ **Adicionar confirmação de ações** — Prevenir erros acidentais
3. ✅ **Validar conflitos de consultório** — Evitar double-booking
4. ✅ **Melhorar tratamento de erros** — Evitar crashes silenciosos
5. ✅ **Adicionar índices de performance** — Schema está bom, mas testar com dados reais

### O que fazer EM PRODUÇÃO (after launch)
1. 📊 Monitorar tempo médio de atendimento
2. 📊 Coletar feedback de usuários (recepção, médicos, enfermeiros)
3. 📊 Medir taxa de abandono (no-show)
4. 🔄 Implementar cancelamento + rastreabilidade
5. 🔄 Integração com notificações (voz/SMS)

### O que deixar para DEPOIS
- Telemedicina (complexo, depende de infra)
- Analytics avançada (coletar dados primeiro)
- Agendamento automático de retorno (precisa testes)

---

## 8. 🏥 Impacto Estimado para Usuários

| Persona | Benefício | Risco |
|---------|-----------|-------|
| **Recepcionista** | Emite senhas rápido, fila clara | Sem busca de paciente = lento |
| **Enfermeiro** | Triagem com sinais vitais registados | Pode registar triagem 2x se não validar |
| **Médico** | Consulta com diagnóstico registado | Sem filtro de especialidade ativa = confuso |
| **Administrador** | Relatórios por estado | Sem SLA = não consegue medir performance |

---

## Conclusão

O Módulo 1 é uma **boa fundação** mas precisa de **refinamentos antes de produção**. 
Focus em resolver os 4 problemas críticos (busca, conflito consultório, confirmação, cancelamento) 
e estará pronto para uso clínico real.

**Estimativa de trabalho restante:** 2-3 sprints de 80 horas cada.

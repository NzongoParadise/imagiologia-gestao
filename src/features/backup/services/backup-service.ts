import { prisma } from "@/lib/db";
import { gzipSync, gunzipSync } from "zlib";

export const BACKUP_VERSION = 1;

export interface BackupData {
  versao: number;
  exportadoEm: string;
  conteudo: Record<string, unknown[]>;
}

/**
 * Serializa TODOS os registos de todos os modelos da base de dados,
 * incluindo os bytes das imagens (base64) para um backup fiel.
 */
export async function recolherDados(): Promise<BackupData> {
  const conteudo: Record<string, unknown[]> = {};

  // Lista de modelos a exportar (ordem respeita dependências de FK)
  const models: Record<string, () => Promise<unknown[]>> = {
    utilizadores: () => prisma.utilizador.findMany(),
    pacientes: () => prisma.paciente.findMany(),
    tecnicos: () => prisma.tecnico.findMany(),
    procedencias: () => prisma.procedencia.findMany(),
    tiposExame: () => prisma.tipoExame.findMany(),
    exames: () => prisma.exame.findMany(),
    imagens: () => prisma.imagem.findMany(),
    configuracoes: () => prisma.configuracao.findMany(),
    notificacoes: () => prisma.notificacao.findMany(),
    historico: () => prisma.historico.findMany(),
    anotacoes: () => prisma.anotacao.findMany(),
    turnos: () => prisma.turno.findMany(),
    conversas: () => prisma.conversa.findMany(),
    conversaParticipantes: () => prisma.conversaParticipante.findMany(),
    mensagens: () => prisma.mensagem.findMany(),
  };

for (const [key, fn] of Object.entries(models)) {
    const registos = await fn();
    conteudo[key] = registos.map((r) => serializarRegisto(r as Record<string, unknown>));
  }

  return {
    versao: BACKUP_VERSION,
    exportadoEm: new Date().toISOString(),
    conteudo,
  };
}

/**
 * Converte um registo do Prisma para JSON serializável:
 * - `Date` → ISO string
 * - `Buffer`/`Uint8Array` (bytes de imagens) → base64
 * - `BigInt` → string
 */
function serializarRegisto(registo: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(registo)) {
    out[k] = serializarValor(v);
  }
  return out;
}

function serializarValor(v: unknown): unknown {
  if (v === null || v === undefined) return v;
  if (v instanceof Date) return v.toISOString();
  if (Buffer.isBuffer(v)) return `base64:${v.toString("base64")}`;
  if (ArrayBuffer.isView(v)) {
    return `base64:${Buffer.from(v.buffer as ArrayBuffer).toString("base64")}`;
  }
  if (typeof v === "bigint") return v.toString();
  if (Array.isArray(v)) return v.map((x) => serializarValor(x));
  if (typeof v === "object") return serializarRegisto(v as Record<string, unknown>);
  return v;
}

/** Comprime os dados num Buffer gzip. */
export function comprimir(dados: BackupData): Buffer {
  return gzipSync(Buffer.from(JSON.stringify(dados), "utf-8"));
}

/** Descomprime um Buffer gzip para BackupData. */
export function descomprimir(buffer: Buffer): BackupData {
  const json = gunzipSync(buffer).toString("utf-8");
  const parsed = JSON.parse(json) as BackupData;
  if (parsed.versao !== BACKUP_VERSION) {
    throw new Error(`Versão de backup não suportada: ${parsed.versao}`);
  }
  return parsed;
}

/** Devolve o JSON plano (sem gzip) de um backup, pronto para download/leitura. */
export function dadosParaDownload(buffer: Buffer): Buffer {
  return Buffer.from(JSON.stringify(descomprimir(buffer), null, 2), "utf-8");
}

/** Guarda um backup na base de dados. */
export async function guardarBackup(options: {
  dados: Buffer;
  tipo: "manual" | "automatico";
  criadoPorId?: number | null;
  numRegistos: number;
}) {
  const nome = `backup-${options.tipo}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  return prisma.backup.create({
    data: {
      nome,
      tipo: options.tipo,
      tamanho: options.dados.length,
      numRegistos: options.numRegistos,
      dados: options.dados,
      criadoPorId: options.criadoPorId ?? null,
    },
  });
}

/** Lista o histórico de backups (metadados, sem `dados`). */
export async function listarBackups() {
  return prisma.backup.findMany({
    orderBy: { criadoEm: "desc" },
    select: {
      id: true,
      nome: true,
      tipo: true,
      tamanho: true,
      numRegistos: true,
      criadoEm: true,
      criadoPor: { select: { id: true, nome: true, email: true } },
    },
  });
}

/** Obtém um backup completo (com `dados`). */
export async function obterBackup(id: number) {
  return prisma.backup.findUnique({ where: { id } });
}

/** Apaga um backup do histórico. */
export async function apagarBackup(id: number) {
  await prisma.backup.delete({ where: { id } });
}

/**
 * Restaura a base de dados a partir de um backup (transacional e atómico).
 * Apaga os dados existentes e recria a partir do snapshot.
 */
export async function restaurarBackup(dados: BackupData) {
  if (dados.versao !== BACKUP_VERSION) {
    throw new Error(`Versão de backup não suportada: ${dados.versao}`);
  }
  const c = dados.conteudo;

  await prisma.$transaction(async (tx) => {
    // Apagar na ordem inversa das dependências FK
    await tx.mensagem.deleteMany();
    await tx.conversaParticipante.deleteMany();
    await tx.conversa.deleteMany();
    await tx.turno.deleteMany();
    await tx.anotacao.deleteMany();
    await tx.historico.deleteMany();
    await tx.notificacao.deleteMany();
    await tx.configuracao.deleteMany();
    await tx.imagem.deleteMany();
    await tx.exame.deleteMany();
    await tx.tipoExame.deleteMany();
    await tx.procedencia.deleteMany();
    await tx.tecnico.deleteMany();
    await tx.paciente.deleteMany();
    await tx.utilizador.deleteMany();

    // Restaurar (ordem respeita FKs)
    await inserirTx(tx, "utilizadores", c.utilizadores);
    await inserirTx(tx, "pacientes", c.pacientes);
    await inserirTx(tx, "tecnicos", c.tecnicos);
    await inserirTx(tx, "procedencias", c.procedencias);
    await inserirTx(tx, "tiposExame", c.tiposExame);
    await inserirTx(tx, "exames", c.exames);
    await inserirTx(tx, "imagens", c.imagens);
    await inserirTx(tx, "configuracoes", c.configuracoes);
    await inserirTx(tx, "notificacoes", c.notificacoes);
    await inserirTx(tx, "historico", c.historico);
    await inserirTx(tx, "anotacoes", c.anotacoes);
    await inserirTx(tx, "turnos", c.turnos);
    await inserirTx(tx, "conversas", c.conversas);
    await inserirTx(tx, "conversaParticipantes", c.conversaParticipantes);
    await inserirTx(tx, "mensagens", c.mensagens);
  });
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function inserirTx(tx: Tx, chave: string, registos?: unknown[]) {
  if (!registos || registos.length === 0) return;
  const model = (tx as unknown as Record<string, { createMany: (a: { data: unknown[] }) => Promise<unknown> }>)[chave];
  if (!model) throw new Error(`Modelo desconhecido no restauro: ${chave}`);
  await model.createMany({
    data: registos.map((r) => deserializarRegisto(r as Record<string, unknown>)),
  });
}

function deserializarRegisto(registo: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(registo)) {
    if (typeof v === "string" && v.startsWith("base64:")) {
      out[k] = Buffer.from(v.slice(7), "base64");
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** Lê uma configuração (chave-valor) da tabela Configuracao. */
export async function obterConfig(chave: string): Promise<string | null> {
  const config = await prisma.configuracao.findUnique({ where: { chave } });
  return config?.valor ?? null;
}

/** Aplica a política de retenção (apaga backups antigos além do limite). */
export async function aplicarRetencao(manterDefault = 10) {
  const manterStr = await obterConfig("backup_manter");
  const manter = parseInt(manterStr || String(manterDefault), 10);
  if (!Number.isFinite(manter) || manter <= 0) return;

  const backups = await prisma.backup.findMany({
    orderBy: { criadoEm: "desc" },
    select: { id: true },
  });
  const aApagar = backups.slice(manter);
  if (aApagar.length === 0) return;
  await prisma.backup.deleteMany({
    where: { id: { in: aApagar.map((b) => b.id) } },
  });
}

/** Verifica se o backup automático é necessário (agendamento) e executa. */
export async function executarBackupAutomatico(): Promise<{
  executado: boolean;
  motivo?: string;
}> {
  const ativo = await obterConfig("backup_auto");
  if (ativo !== "true") {
    return { executado: false, motivo: "backup automático desativado" };
  }

  const frequencia = await obterConfig("backup_frequencia") || "diario";
  const ultimoStr = await obterConfig("backup_ultimo");
  const ultimo = ultimoStr ? new Date(ultimoStr) : null;

  const agora = new Date();
  const dentro = (ms: number) => ultimo && agora.getTime() - ultimo.getTime() < ms;

  if (frequencia === "semanal" && dentro(7 * 24 * 60 * 60 * 1000)) {
    return { executado: false, motivo: "já foi feito esta semana" };
  }
  if (frequencia === "mensal" && dentro(30 * 24 * 60 * 60 * 1000)) {
    return { executado: false, motivo: "já foi feito este mês" };
  }
  if (frequencia === "diario" && dentro(24 * 60 * 60 * 1000)) {
    return { executado: false, motivo: "já foi feito hoje" };
  }

  const dados = await recolherDados();
  const dadosBuffer = comprimir(dados);
  const numRegistos = Object.values(dados.conteudo).reduce((acc, arr) => acc + arr.length, 0);

  await guardarBackup({
    dados: dadosBuffer,
    tipo: "automatico",
    numRegistos,
  });

  await aplicarRetencao();

  // Atualizar a data do último backup
  await prisma.configuracao.upsert({
    where: { chave: "backup_ultimo" },
    update: { valor: new Date().toISOString() },
    create: { chave: "backup_ultimo", valor: new Date().toISOString() },
  });

  return { executado: true };
}

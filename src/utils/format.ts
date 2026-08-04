import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR });
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "-";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 9) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
  }
  return phone;
}

export function formatNif(nif: string | null | undefined): string {
  if (!nif) return "-";
  const cleaned = nif.replace(/\D/g, "");
  if (cleaned.length === 9) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3");
  }
  return nif;
}

export function translateEstado(estado: string): string {
  const map: Record<string, string> = {
    Pendente: "Pendente",
    "Em andamento": "Em Andamento",
    Realizado: "Realizado",
    Entregue: "Entregue",
    Cancelado: "Cancelado",
  };
  return map[estado] || estado;
}


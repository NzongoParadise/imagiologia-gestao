"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Bell,
  Shield,
  Palette,
  Save,
  Moon,
  Sun,
  Monitor,
  Loader2,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { toast } from "sonner";

interface CampoConfig {
  id: string;
  label: string;
  type: "text" | "select" | "toggle" | "number" | "custom";
  options?: string[];
  defaultValue: string | boolean;
}

interface SecaoConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  fields: CampoConfig[];
}

const settingsSections: SecaoConfig[] = [
  {
    id: "geral",
    label: "Geral",
    icon: Settings,
    fields: [
      { id: "hospital_nome", label: "Nome do Hospital", type: "text", defaultValue: "Hospital Geral do Uíge" },
      { id: "unidade_nome", label: "Unidade de Imagiologia", type: "text", defaultValue: "Unidade de Imagiologia" },
      { id: "idioma", label: "Idioma", type: "select", options: ["Português", "English"], defaultValue: "Português" },
    ],
  },
  {
    id: "notificacoes",
    label: "Notificações",
    icon: Bell,
    fields: [
      { id: "notificacao_email", label: "Notificações por Email", type: "toggle", defaultValue: true },
      { id: "notificacao_sms", label: "Notificações por SMS", type: "toggle", defaultValue: false },
      { id: "notif_exame_criado", label: "Novo exame criado", type: "toggle", defaultValue: true },
      { id: "notif_exame_realizado", label: "Exame realizado", type: "toggle", defaultValue: true },
    ],
  },
  {
    id: "seguranca",
    label: "Segurança",
    icon: Shield,
    fields: [
      { id: "seguranca_session_timeout", label: "Timeout de sessão (minutos)", type: "number", defaultValue: "60" },
      { id: "seguranca_max_attempts", label: "Tentativas máximas de login", type: "number", defaultValue: "5" },
      { id: "seguranca_two_factor", label: "Autenticação de dois fatores", type: "toggle", defaultValue: false },
    ],
  },
  {
    id: "aparencia",
    label: "Aparência",
    icon: Palette,
    fields: [
      { id: "aparencia_tema", label: "Tema", type: "custom", defaultValue: "system" },
      { id: "aparencia_compacto", label: "Modo compacto", type: "toggle", defaultValue: false },
    ],
  },
];

export function ConfiguracoesClient() {
  const [activeSection, setActiveSection] = useState("geral");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch("/api/configuracoes");
        if (response.ok) {
          const data: Record<string, string> = await response.json();
          setFormValues(data);
          if (data["aparencia_tema"]) {
            setTheme(data["aparencia_tema"] as "light" | "dark" | "system");
          }
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  function getValue(fieldId: string, defaultValue: string | boolean): string {
    const saved = formValues[fieldId];
    if (saved !== undefined) return saved;
    return String(defaultValue);
  }

  function handleChange(fieldId: string, value: string) {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  function handleToggle(fieldId: string, checked: boolean) {
    setFormValues((prev) => ({ ...prev, [fieldId]: checked ? "true" : "false" }));
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = { ...formValues, aparencia_tema: theme };
      const response = await fetch("/api/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (response.ok) {
        toast.success("Configurações guardadas com sucesso");
      } else {
        toast.error("Erro ao guardar configurações");
      }
    } catch {
      toast.error("Erro ao guardar configurações");
    } finally {
      setSaving(false);
    }
  };

  const SectionIcon = settingsSections.find((s) => s.id === activeSection)?.icon || Settings;

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-[60vh]"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">A carregar configurações...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerir as configurações do sistema
        </p>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="lg:w-48 shrink-0">
          <nav className="space-y-1">
            {settingsSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    activeSection === section.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <SectionIcon className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">
              {settingsSections.find((s) => s.id === activeSection)?.label}
            </h2>
          </div>

          <div className="rounded-xl border bg-card divide-y">
            {settingsSections
              .find((s) => s.id === activeSection)
              ?.fields.map((field) => {
                const value = getValue(field.id, field.defaultValue);
                return (
                  <div
                    key={field.id}
                    className="flex items-center justify-between px-5 py-4"
                  >
                    <div>
                      <label className="text-sm font-medium">{field.label}</label>
                    </div>
                    <div className="flex items-center gap-2">
                      {field.type === "toggle" && (
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={value === "true"}
                            onChange={(e) => handleToggle(field.id, e.target.checked)}
                            className="peer sr-only"
                          />
                          <div className="h-5 w-9 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
                        </label>
                      )}
                      {field.type === "select" && (
                        <select
                          value={value}
                          onChange={(e) => handleChange(field.id, e.target.value)}
                          className="rounded-lg border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                        >
                          {(field.options || []).map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                      {field.type === "number" && (
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => handleChange(field.id, e.target.value)}
                          className="w-20 rounded-lg border bg-background px-3 py-1.5 text-sm text-right focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      )}
                      {field.type === "text" && (
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleChange(field.id, e.target.value)}
                          className="w-48 rounded-lg border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      )}
                      {field.type === "custom" && (
                        <div className="flex items-center gap-1 rounded-lg border p-0.5">
                          {[
                            { value: "light", icon: Sun },
                            { value: "dark", icon: Moon },
                            { value: "system", icon: Monitor },
                          ].map(({ value: optValue, icon: Icon }) => (
                            <button
                              key={optValue}
                              onClick={() => {
                                setTheme(optValue as typeof theme);
                                handleChange(field.id, optValue);
                              }}
                              className={cn(
                                "rounded-md p-1.5 transition-colors",
                                value === optValue
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-accent"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "A guardar..." : "Guardar Configurações"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


"use client";

import { useCallback, useMemo, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Loader } from "lucide-react";
import { cn } from "@/utils/cn";

interface Paciente {
  id: number;
  nome: string;
  numeroProcesso: string | null;
  dataNascimento: string | null;
  telefone: string | null;
}

interface SeletorPacienteProps {
  value?: number;
  onSelect?: (paciente: Paciente) => void;
  placeholder?: string;
}

export function SeletorPaciente({
  value,
  onSelect,
  placeholder = "Procurar paciente...",
}: SeletorPacienteProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Buscar pacientes quando termo muda
  const buscarPacientes = useCallback(async () => {
    if (debouncedSearch.length < 2) {
      setPacientes([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/pacientes/search?q=${encodeURIComponent(debouncedSearch)}`
      );
      if (!response.ok) throw new Error("Erro ao buscar");
      const resultado = await response.json();
      setPacientes(resultado.data);
    } catch (error) {
      console.error("Erro:", error);
      setPacientes([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  // Executar busca quando termo muda
  useMemo(() => {
    buscarPacientes();
  }, [buscarPacientes]);

  const handleSelect = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setOpen(false);
    onSelect?.(paciente);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedPaciente
            ? `${selectedPaciente.nome} (${selectedPaciente.numeroProcesso || "N/A"})`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder={placeholder}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          {isLoading && (
            <div className="p-4 text-center">
              <Loader className="inline h-4 w-4 animate-spin" />
            </div>
          )}
          <CommandEmpty>
            {searchTerm.length < 2
              ? "Digite pelo menos 2 caracteres"
              : "Nenhum paciente encontrado"}
          </CommandEmpty>
          <CommandGroup>
            {pacientes.map((paciente) => (
              <CommandItem
                key={paciente.id}
                value={String(paciente.id)}
                onSelect={() => handleSelect(paciente)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedPaciente?.id === paciente.id
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
                <div className="flex-1">
                  <div className="font-medium">{paciente.nome}</div>
                  <div className="text-xs text-gray-500">
                    {paciente.numeroProcesso} | {paciente.telefone || "S/N"}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
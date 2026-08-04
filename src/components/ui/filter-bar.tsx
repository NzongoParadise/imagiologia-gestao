"use client";

import { cn } from "@/utils/cn";
import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
}

interface FilterBarProps {
  groups: FilterGroup[];
  activeFilters: Record<string, string>;
  onFilterChange: (groupId: string, value: string) => void;
  onClear: () => void;
  className?: string;
}

export function FilterBar({
  groups,
  activeFilters,
  onFilterChange,
  onClear,
  className,
}: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const activeCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
          activeCount > 0
            ? "border-primary bg-primary/5 text-primary"
            : "border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filtros
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-40 w-72 rounded-xl border bg-card shadow-xl p-4 animate-scale-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Filtros</h3>
            {activeCount > 0 && (
              <button
                onClick={onClear}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Limpar tudo
              </button>
            )}
          </div>
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.id}>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {group.options.map((option) => {
                    const isActive = activeFilters[group.id] === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() =>
                          onFilterChange(
                            group.id,
                            isActive ? "" : option.value
                          )
                        }
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


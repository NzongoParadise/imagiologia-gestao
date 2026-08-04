"use client";

import { useState, useCallback, useRef } from "react";
import { cn } from "@/utils/cn";
import { Search, X, Loader2 } from "lucide-react";

interface SearchBarProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSearch?: (value: string) => void;
  loading?: boolean;
  debounceMs?: number;
  className?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  value = "",
  onChange,
  placeholder = "Pesquisar...",
  onSearch,
  loading = false,
  debounceMs = 300,
  className,
  autoFocus = false,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        onChange(newValue);
        if (onSearch) onSearch(newValue);
      }, debounceMs);
    },
    [onChange, onSearch, debounceMs]
  );

  const handleClear = useCallback(() => {
    setLocalValue("");
    onChange("");
    if (onSearch) onSearch("");
  }, [onChange, onSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && onSearch) {
        onSearch(localValue);
      }
    },
    [localValue, onSearch]
  );

  return (
    <div className={cn("group relative", className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Search className="h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
        )}
      </div>
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-8 text-sm transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
        aria-label={placeholder}
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Limpar pesquisa"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}


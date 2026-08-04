"use client";

import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/utils/cn";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleDarkMode = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  };

  return (
    <button
      onClick={toggleDarkMode}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur-md transition-all hover:border-primary/30 hover:bg-card hover:text-foreground",
        className
      )}
      aria-label={darkMode ? "Mudar para modo claro" : "Mudar para modo escuro"}
      title={darkMode ? "Modo claro" : "Modo escuro"}
    >
      {darkMode ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">{darkMode ? "Claro" : "Escuro"}</span>
    </button>
  );
}
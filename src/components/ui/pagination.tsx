"use client";

import { cn } from "@/utils/cn";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  total,
  onPageChange,
  pageSize = 20,
  className,
}: PaginationProps) {
  const start = Math.min((currentPage - 1) * pageSize + 1, total);
  const end = Math.min(currentPage * pageSize, total);

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    const delta = 2;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex items-center justify-between border-t px-4 py-3", className)}>
      <p className="text-sm text-muted-foreground">
        <span className="font-medium">{start}</span> -{" "}
        <span className="font-medium">{end}</span> de{" "}
        <span className="font-medium">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
          aria-label="Primeira página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-0.5 mx-1">
          {getPageNumbers().map((page, idx) =>
            page === "..." ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-sm text-muted-foreground">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                  currentPage === page
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {page}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
          aria-label="Próxima página"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
          aria-label="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}


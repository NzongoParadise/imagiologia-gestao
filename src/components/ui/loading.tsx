import { cn } from "@/utils/cn";
import { Loader2 } from "lucide-react";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-10 w-10",
};

export function Loading({
  size = "md",
  text,
  fullScreen = false,
  className,
}: LoadingProps) {
  if (fullScreen) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className={cn("animate-spin text-primary", sizeMap[size])} />
          {text && (
            <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center py-12", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeMap[size])} />
      {text && (
        <p className="mt-3 text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
}

// Skeleton component
interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  count?: number;
}

const skeletonWidths = ["80%", "85%", "75%", "90%", "70%", "88%", "82%", "78%", "92%", "72%"];

export function Skeleton({
  className,
  variant = "text",
  width,
  height,
  count = 1,
}: SkeletonProps) {
  const baseClass = cn(
    "animate-pulse rounded-md bg-muted/70",
    variant === "circular" && "rounded-full",
    variant === "text" && "h-4 w-full",
    variant === "rectangular" && "h-20 w-full",
    className
  );

  if (count === 1) {
    return (
      <div
        className={baseClass}
        style={{ width, height }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={baseClass}
          style={{
            width: typeof width === "number" ? width : width || skeletonWidths[i % skeletonWidths.length],
            height,
          }}
        />
      ))}
    </div>
  );
}

// Table Skeleton
const headerWidths = ["30%", "20%", "25%", "25%"];
const rowWidths = [
  ["25%", "15%", "20%", "20%"],
  ["28%", "18%", "22%", "18%"],
  ["22%", "16%", "24%", "22%"],
  ["26%", "14%", "18%", "20%"],
  ["24%", "20%", "22%", "16%"],
];

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="border-b bg-muted/50 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4" width={headerWidths[i % headerWidths.length]} />
          ))}
        </div>
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-4 px-4 py-3">
            {Array.from({ length: cols }).map((_, colIdx) => {
              const widths = rowWidths[rowIdx % rowWidths.length];
              return (
                <Skeleton key={colIdx} className="h-4" width={widths[colIdx] || "20%"} />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}


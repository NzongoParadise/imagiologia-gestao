"use client";

import { cn } from "@/utils/cn";
import { User } from "lucide-react";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const iconSizeMap = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

const colors = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  if (src) {
    return (
      <div
        className={cn(
          "shrink-0 overflow-hidden rounded-full ring-2 ring-background",
          sizeMap[size],
          className
        )}
      >
        <img
          src={src}
          alt={name || "Avatar"}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const initials = name ? getInitials(name) : null;
  const colorClass = name ? getColorFromName(name) : "bg-muted text-muted-foreground";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-medium ring-2 ring-background",
        sizeMap[size],
        colorClass,
        className
      )}
      title={name || undefined}
    >
      {initials || <User className={iconSizeMap[size]} />}
    </div>
  );
}


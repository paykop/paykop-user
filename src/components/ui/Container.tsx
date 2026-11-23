import { ReactNode } from "react";
import { cn } from "@/lib/cn";

const sizeClasses = {
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
} as const;

export function Container({
  children,
  className = "",
  size = "7xl",
}: {
  children: ReactNode;
  className?: string;
  size?: keyof typeof sizeClasses;
}) {
  return (
    <div
      className={cn(
        sizeClasses[size],
        "mx-auto px-4 sm:px-6 lg:px-8",
        className
      )}
    >
      {children}
    </div>
  );
}

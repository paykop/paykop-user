import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ReactNode } from "react";

export function SectionHeader({
  title,
  subtitle,
  href,
  actionLabel = "See all",
  icon,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  actionLabel?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3 sm:gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {icon}
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {title}
          </h2>
          {subtitle ? (
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {href ? (
        <Link
          href={href}
          className="flex items-center gap-1 text-xs sm:text-sm font-bold text-[var(--primary)] hover:underline shrink-0"
        >
          <span>{actionLabel}</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : null}
    </div>
  );
}

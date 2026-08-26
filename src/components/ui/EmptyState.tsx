import { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-12 px-4">
      {icon ? (
        <div className="w-16 h-16 rounded-3xl bg-[var(--primary-subtle)] text-[var(--primary)] flex items-center justify-center mx-auto mb-4">
          {icon}
        </div>
      ) : null}
      <h3 className="text-lg font-black text-slate-900">{title}</h3>
      {description ? (
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

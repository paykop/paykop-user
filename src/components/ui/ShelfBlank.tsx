import { cn } from "@/lib/cn";

/** Inaccessible empty shelf slot used when listing data is short of a 4-up grid. */
export function ShelfBlank({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "shopcart-card bg-[var(--surface-muted)] border border-transparent pointer-events-none select-none hidden sm:block",
        className
      )}
    />
  );
}

export function padToMinSlots<T>(items: T[], min = 4): { item: T | null; key: string }[] {
  const slots: { item: T | null; key: string }[] = items.map((item, i) => ({
    item,
    key: `item-${i}`,
  }));
  while (slots.length < min) {
    slots.push({ item: null, key: `blank-${slots.length}` });
  }
  return slots;
}

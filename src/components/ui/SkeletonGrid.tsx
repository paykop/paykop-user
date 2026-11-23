export function SkeletonGrid({ count = 4, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, n) => (
        <div key={n} className="shopcart-card h-72 animate-pulse bg-slate-100" />
      ))}
    </div>
  );
}

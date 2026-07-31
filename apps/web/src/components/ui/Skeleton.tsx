import { cn } from "@/lib/utils";

/** Shimmering skeleton block for loading states. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-surface-2",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer",
        "after:bg-gradient-to-r after:from-transparent after:via-black/5 after:to-transparent",
        "dark:after:via-white/10",
        className
      )}
    />
  );
}

/** A card-shaped skeleton for grid loading. */
export function SkeletonCard() {
  return (
    <div className="panel space-y-3 p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}

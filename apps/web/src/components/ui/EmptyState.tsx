import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

/** Friendly empty state for lists/tables with nothing to show. */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  detail,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  detail?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-muted">
        <Icon size={26} />
      </span>
      <div>
        <div className="text-sm font-semibold text-ink">{title}</div>
        {detail && <div className="mt-1 max-w-sm text-[12px] text-muted">{detail}</div>}
      </div>
      {action}
    </div>
  );
}

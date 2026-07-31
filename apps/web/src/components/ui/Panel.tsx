import { cn } from "@/lib/utils";

/** Base clinical surface. Theme-aware via the `.panel` component class. */
export function Panel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("panel relative", className)} {...props}>
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  right,
  icon,
}: {
  title: string;
  right?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-line px-4 py-3">
      <div className="flex items-center gap-2">
        {icon && <span className="text-primary">{icon}</span>}
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.13em] text-ink-secondary">
          {title}
        </h3>
      </div>
      {right}
    </div>
  );
}

export function PanelBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("p-4", className)}>{children}</div>;
}

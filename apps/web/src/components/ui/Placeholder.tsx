import { Panel } from "@/components/ui/Panel";
import { Construction } from "lucide-react";

/** A roadmap placeholder for pages beyond the current milestone. */
export function Placeholder({
  title,
  blurb,
  items,
}: {
  title: string;
  blurb: string;
  items: string[];
}) {
  return (
    <Panel className="mx-auto mt-6 max-w-2xl p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Construction size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <p className="text-[11px] uppercase tracking-widest text-muted">
            Planned module
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink-secondary">{blurb}</p>
      <ul className="mt-4 space-y-2">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2 text-[13px] text-ink-secondary">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            {it}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

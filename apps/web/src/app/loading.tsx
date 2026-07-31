import { Waves } from "lucide-react";

export default function Loading() {
  return (
    <div className="app-aura flex h-screen flex-col items-center justify-center gap-4">
      <div className="brand-gradient flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl text-white">
        <Waves size={24} />
      </div>
      <div className="flex items-center gap-2 text-sm text-muted">
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
        <span className="ml-1">Loading GaitGuard…</span>
      </div>
    </div>
  );
}

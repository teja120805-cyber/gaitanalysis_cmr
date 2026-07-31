import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="app-aura flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <Compass size={26} />
      </span>
      <div>
        <div className="brand-text text-4xl font-bold">404</div>
        <h2 className="mt-1 text-lg font-semibold text-ink">Page not found</h2>
        <p className="mt-1 max-w-md text-sm text-muted">
          The page you're looking for doesn't exist or has moved.
        </p>
      </div>
      <Link href="/">
        <Button size="sm">Back to dashboard</Button>
      </Link>
    </div>
  );
}

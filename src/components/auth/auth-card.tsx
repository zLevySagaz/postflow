import Link from "next/link";
import { Sparkles } from "lucide-react";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-5 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-white">
            <Sparkles size={15} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            PostFlow
          </span>
        </Link>
        <div className="rounded-lg border border-surface-border bg-surface p-7">
          <h1 className="text-lg font-semibold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-5 text-center text-sm text-ink-muted">{footer}</p>
      </div>
    </div>
  );
}

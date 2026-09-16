"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  PenSquare,
  Link2,
  Image as ImageIcon,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/posts/new", label: "Criar post", icon: PenSquare },
  { href: "/calendar", label: "Calendário", icon: CalendarDays },
  { href: "/accounts", label: "Contas conectadas", icon: Link2 },
  { href: "/media", label: "Biblioteca de mídia", icon: ImageIcon },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-white">
            <Sparkles size={15} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            PostFlow
          </span>
        </Link>
        <button
          onClick={onClose}
          className="text-ink-muted hover:text-ink lg:hidden"
          aria-label="Fechar menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-surface-raised text-ink"
                  : "text-ink-muted hover:bg-surface-raised/60 hover:text-ink"
              )}
            >
              <item.icon size={17} strokeWidth={active ? 2.25 : 1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 mb-4 rounded-md border border-surface-border bg-surface-raised p-3.5">
        <p className="text-xs font-medium text-ink">Plano Free</p>
        <p className="mt-0.5 text-xs text-ink-muted">
          2 de 3 redes conectadas
        </p>
        <div className="mt-2 h-1.5 w-full rounded-full bg-base">
          <div className="h-1.5 w-2/3 rounded-full bg-accent" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-60 shrink-0 border-r border-surface-border bg-surface lg:block">
        {content}
      </aside>

      {/* Mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
            aria-hidden
          />
          <aside className="animate-fade-in absolute left-0 top-0 h-full w-64 bg-surface">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { Menu, Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-surface-border bg-base/80 px-4 backdrop-blur sm:px-6">
      <button
        onClick={onMenuClick}
        className="text-ink-muted hover:text-ink lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu size={22} />
      </button>

      <div className="hidden text-sm text-ink-muted lg:block" />

      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/posts/new" className="hidden sm:block">
          <Button size="sm">
            <Plus size={15} />
            Novo post
          </Button>
        </Link>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink"
          aria-label="Notificações"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" />
        </button>
        <Avatar name="Ana Beatriz" size={32} />
      </div>
    </header>
  );
}

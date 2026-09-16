"use client";

import { cn } from "@/lib/utils";

export type SettingsTab = "workspace" | "members" | "plan" | "integrations" | "notifications";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "workspace", label: "Workspace" },
  { id: "members", label: "Membros" },
  { id: "plan", label: "Plano" },
  { id: "integrations", label: "Integrações" },
  { id: "notifications", label: "Notificações" },
];

export function SettingsTabs({
  active,
  onChange,
}: {
  active: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-surface-border">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
            active === tab.id
              ? "border-accent text-ink"
              : "border-transparent text-ink-muted hover:text-ink"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

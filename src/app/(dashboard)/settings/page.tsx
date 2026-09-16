"use client";

import { useState } from "react";
import { useAppStore } from "@/context/app-store";
import { SettingsTabs, type SettingsTab } from "@/components/settings/settings-tabs";
import {
  WorkspacePanel,
  MembersPanel,
  PlanPanel,
  IntegrationsPanel,
  NotificationsPanel,
} from "@/components/settings/settings-panels";

export default function SettingsPage() {
  const { accounts } = useAppStore();
  const [tab, setTab] = useState<SettingsTab>("workspace");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Configurações</h1>
        <p className="text-sm text-ink-muted">Gerencie seu workspace, time e integrações.</p>
      </div>

      <SettingsTabs active={tab} onChange={setTab} />

      <div>
        {tab === "workspace" && <WorkspacePanel />}
        {tab === "members" && <MembersPanel />}
        {tab === "plan" && <PlanPanel />}
        {tab === "integrations" && <IntegrationsPanel accounts={accounts} />}
        {tab === "notifications" && <NotificationsPanel />}
      </div>
    </div>
  );
}

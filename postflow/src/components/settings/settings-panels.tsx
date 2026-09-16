"use client";

import { useState } from "react";
import { Trash2, Mail, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { PLATFORM_META } from "@/integrations/platform-limits";
import type { SocialAccount } from "@/lib/types";

// ---------- Workspace ----------
export function WorkspacePanel() {
  const [name, setName] = useState("PostFlow Studio");
  const [saved, setSaved] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações do workspace</CardTitle>
      </CardHeader>
      <CardContent className="max-w-md space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-muted">Nome do workspace</label>
          <Input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-muted">URL</label>
          <div className="flex items-center rounded-md border border-surface-border bg-surface-raised px-3 text-sm text-ink-faint">
            <span>app.postflow.com/</span>
            <span className="text-ink">postflow-studio</span>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setSaved(true)}
        >
          {saved ? <><Check size={14} />Salvo</> : "Salvar alterações"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------- Members ----------
interface MockMember {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";
}

const INITIAL_MEMBERS: MockMember[] = [
  { id: "m1", name: "Ana Beatriz", email: "ana@postflow.com", role: "OWNER" },
  { id: "m2", name: "Rafael Souza", email: "rafael@postflow.com", role: "EDITOR" },
  { id: "m3", name: "Camila Duarte", email: "camila@postflow.com", role: "VIEWER" },
];

const ROLE_LABEL: Record<MockMember["role"], string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  EDITOR: "Editor",
  VIEWER: "Viewer",
};

export function MembersPanel() {
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [email, setEmail] = useState("");

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setMembers((prev) => [
      ...prev,
      { id: `m_${Math.random().toString(36).slice(2, 7)}`, name: email.split("@")[0], email, role: "VIEWER" },
    ]);
    setEmail("");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Convidar membro</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex max-w-md gap-2">
            <Input
              type="email"
              placeholder="email@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" size="sm" className="shrink-0">
              <Mail size={14} />
              Convidar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membros ({members.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={m.name} size={32} />
                <div>
                  <p className="text-sm text-ink">{m.name}</p>
                  <p className="text-xs text-ink-faint">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={m.role}
                  disabled={m.role === "OWNER"}
                  onChange={(e) =>
                    setMembers((prev) =>
                      prev.map((mem) =>
                        mem.id === m.id ? { ...mem, role: e.target.value as MockMember["role"] } : mem
                      )
                    )
                  }
                  className="h-8 rounded-md border border-surface-border bg-surface-raised px-2 text-xs text-ink disabled:opacity-60"
                >
                  {(["OWNER", "ADMIN", "EDITOR", "VIEWER"] as const).map((r) => (
                    <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                  ))}
                </select>
                {m.role !== "OWNER" && (
                  <button
                    onClick={() => setMembers((prev) => prev.filter((mem) => mem.id !== m.id))}
                    className="text-ink-faint hover:text-state-danger"
                    aria-label={`Remover ${m.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- Plan ----------
const PLAN_TIERS = [
  { id: "FREE", name: "Free", price: "R$ 0", accounts: 1, posts: 10, users: 1 },
  { id: "STARTER", name: "Starter", price: "R$ 49", accounts: 3, posts: 60, users: 2 },
  { id: "PRO", name: "Pro", price: "R$ 129", accounts: 6, posts: -1, users: 5 },
  { id: "AGENCY", name: "Agency", price: "R$ 349", accounts: 6, posts: -1, users: -1 },
] as const;

export function PlanPanel() {
  const current = "FREE";
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  async function handleUpgrade(tier: "STARTER" | "PRO" | "AGENCY") {
    setLoadingTier(tier);
    try {
      const meRes = await fetch("/api/workspace/me");
      if (!meRes.ok) throw new Error("Faça login para assinar um plano.");
      const { workspace } = await meRes.json();

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: workspace.id, tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível iniciar o checkout.");
      window.location.href = data.url;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao iniciar upgrade.");
    } finally {
      setLoadingTier(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Plano atual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-ink">Free</p>
              <p className="text-sm text-ink-muted">2 de 1 redes conectadas · cobrança via Stripe não configurada</p>
            </div>
            <Badge tone="neutral">Sem cartão cadastrado</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_TIERS.map((plan) => (
          <Card key={plan.id} className={plan.id === current ? "border-accent" : undefined}>
            <CardContent className="pt-5">
              <p className="text-sm font-medium text-ink">{plan.name}</p>
              <p className="mt-2 text-xl font-semibold text-ink">
                {plan.price}<span className="text-xs font-normal text-ink-faint">/mês</span>
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-ink-muted">
                <li>{plan.accounts} redes conectadas</li>
                <li>{plan.posts === -1 ? "Posts ilimitados" : `${plan.posts} posts/mês`}</li>
                <li>{plan.users === -1 ? "Usuários ilimitados" : `${plan.users} usuário(s)`}</li>
              </ul>
              <Button
                size="sm"
                variant={plan.id === current ? "secondary" : "primary"}
                className="mt-4 w-full"
                disabled={plan.id === current || loadingTier === plan.id}
                onClick={() => plan.id !== "FREE" && handleUpgrade(plan.id)}
              >
                {plan.id === current
                  ? "Plano atual"
                  : loadingTier === plan.id
                  ? "Redirecionando..."
                  : "Fazer upgrade"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-ink-faint">
        O checkout usa o Stripe real — configure STRIPE_SECRET_KEY e os STRIPE_PRICE_ID_* em .env para ativar a cobrança.
      </p>
    </div>
  );
}

// ---------- Integrations ----------
export function IntegrationsPanel({ accounts }: { accounts: SocialAccount[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status das integrações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {accounts.map((acc) => (
          <div key={acc.id} className="flex items-center justify-between border-b border-surface-border pb-3 last:border-0 last:pb-0">
            <div className="flex items-center gap-2.5">
              <PlatformIcon platform={acc.platform} size={16} className="text-ink-muted" />
              <span className="text-sm text-ink">{PLATFORM_META[acc.platform].label}</span>
            </div>
            <Badge tone={acc.status === "CONNECTED" ? "success" : "neutral"}>
              {acc.status === "NOT_CONFIGURED" ? "Integração não configurada" : acc.status === "CONNECTED" ? "Configurada" : "Requer atenção"}
            </Badge>
          </div>
        ))}
        <p className="pt-2 text-xs text-ink-faint">
          As credenciais OAuth de cada rede são definidas em variáveis de ambiente (ver .env.example) — nunca no código.
        </p>
      </CardContent>
    </Card>
  );
}

// ---------- Notifications ----------
const NOTIF_OPTIONS = [
  { id: "published", label: "Publicação realizada" },
  { id: "failed", label: "Falha na publicação" },
  { id: "token", label: "Token expirado" },
  { id: "disconnected", label: "Conta desconectada" },
  { id: "limit", label: "Limite de API atingido" },
];

export function NotificationsPanel() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    published: true,
    failed: true,
    token: true,
    disconnected: true,
    limit: false,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificações no sistema</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {NOTIF_OPTIONS.map((opt) => (
          <label key={opt.id} className="flex items-center justify-between text-sm text-ink">
            {opt.label}
            <input
              type="checkbox"
              checked={enabled[opt.id]}
              onChange={() =>
                setEnabled((prev) => ({ ...prev, [opt.id]: !prev[opt.id] }))
              }
              className="h-4 w-4 accent-accent"
            />
          </label>
        ))}
        <p className="pt-2 text-xs text-ink-faint">
          Envio por e-mail ainda não está configurado — arquitetura pronta em src/services, aguardando provedor de e-mail.
        </p>
      </CardContent>
    </Card>
  );
}

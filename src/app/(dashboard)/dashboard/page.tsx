"use client";

import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Link2,
  Plus,
} from "lucide-react";
import { useAppStore } from "@/context/app-store";
import { StatCard } from "@/components/dashboard/stat-card";
import { UpcomingPosts } from "@/components/dashboard/upcoming-posts";
import { ConnectedAccountsPanel, RecentActivity } from "@/components/dashboard/side-panels";
import { Button } from "@/components/ui/button";
import { upcomingPosts } from "@/services/post-service";

export default function DashboardPage() {
  const { posts, accounts } = useAppStore();

  const scheduled = posts.filter((p) => p.status === "SCHEDULED").length;
  const published = posts.filter((p) => p.status === "PUBLISHED").length;
  const failed = posts.filter((p) => p.status === "FAILED").length;
  const connected = accounts.filter((a) => a.status === "CONNECTED").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Dashboard</h1>
          <p className="text-sm text-ink-muted">
            Visão geral do seu workspace hoje.
          </p>
        </div>
        <Link href="/posts/new">
          <Button>
            <Plus size={16} />
            Novo post
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={CalendarClock} label="Agendados" value={scheduled} tone="accent" />
        <StatCard icon={CheckCircle2} label="Publicados" value={published} />
        <StatCard icon={AlertTriangle} label="Com erro" value={failed} tone={failed > 0 ? "danger" : "neutral"} />
        <StatCard icon={Link2} label="Redes conectadas" value={connected} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UpcomingPosts posts={upcomingPosts(posts)} />
        </div>
        <div className="space-y-6">
          <ConnectedAccountsPanel accounts={accounts} />
          <RecentActivity posts={posts} />
        </div>
      </div>
    </div>
  );
}

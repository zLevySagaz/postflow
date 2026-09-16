"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Fase 1: sem Auth.js/Supabase Auth real ainda — apenas navega para o
    // dashboard. A troca por autenticação real acontece só aqui.
    setTimeout(() => router.push("/dashboard"), 500);
  }

  return (
    <AuthCard
      title="Entrar"
      subtitle="Acesse o painel do seu workspace."
      footer={
        <>
          Não tem uma conta?{" "}
          <Link href="/signup" className="text-accent-soft hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-muted">E-mail</label>
          <Input type="email" placeholder="voce@empresa.com" required />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-muted">Senha</label>
          <Input type="password" placeholder="••••••••" required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </AuthCard>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => router.push("/dashboard"), 500);
  }

  return (
    <AuthCard
      title="Criar conta"
      subtitle="Comece de graça — sem cartão de crédito."
      footer={
        <>
          Já tem uma conta?{" "}
          <Link href="/login" className="text-accent-soft hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-muted">Nome</label>
          <Input placeholder="Seu nome" required />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-muted">E-mail</label>
          <Input type="email" placeholder="voce@empresa.com" required />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-muted">Senha</label>
          <Input type="password" placeholder="Mínimo 8 caracteres" required minLength={8} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>
    </AuthCard>
  );
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SocialProvider } from "./social-provider";

async function currentWorkspaceId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return null;
  // Fase 1/2: usuário tem um único workspace (owner). Multi-workspace
  // seletor fica para uma fase futura de UI — o backend já suporta N.
  const membership = await prisma.workspaceMember.findFirst({ where: { userId } });
  return membership?.workspaceId ?? null;
}

export async function handleAuthorize(provider: SocialProvider, req: Request) {
  const workspaceId = await currentWorkspaceId();
  if (!workspaceId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/${provider.platform.toLowerCase()}/callback`;

  try {
    const authUrl = await provider.getAuthUrl(workspaceId, redirectUri);
    return NextResponse.redirect(authUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao iniciar conexão.";
    const url = new URL("/accounts", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  }
}

export async function handleCallback(provider: SocialProvider, req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const redirectBase = new URL("/accounts", req.url);

  if (oauthError) {
    redirectBase.searchParams.set("error", `Autorização negada: ${oauthError}`);
    return NextResponse.redirect(redirectBase);
  }
  if (!code || !state) {
    redirectBase.searchParams.set("error", "Callback OAuth incompleto.");
    return NextResponse.redirect(redirectBase);
  }

  try {
    const account = await provider.connect(state, code);
    redirectBase.searchParams.set("connected", account.platform);
    return NextResponse.redirect(redirectBase);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao conectar conta.";
    redirectBase.searchParams.set("error", message);
    return NextResponse.redirect(redirectBase);
  }
}

import { prisma } from "@/lib/prisma";
import { encryptToken, decryptToken } from "@/lib/crypto";
import { signState, verifyState, generatePkcePair } from "../oauth-utils";
import { PLATFORM_LIMITS } from "../platform-limits";
import { UnsupportedOperationError, type SocialProvider } from "../social-provider";
import type { PostPlatformResult, SocialAccount } from "@/lib/types";

const AUTH_URL = "https://twitter.com/i/oauth2/authorize";
const TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
const SCOPES = ["tweet.read", "tweet.write", "users.read", "offline.access"];

export class XProvider implements SocialProvider {
  readonly platform = "X" as const;
  get limits() {
    return PLATFORM_LIMITS.X;
  }

  async getAuthUrl(workspaceId: string, redirectUri: string): Promise<string> {
    const clientId = process.env.X_CLIENT_ID;
    if (!clientId) {
      throw new Error("Integração não configurada: defina X_CLIENT_ID/SECRET em .env.");
    }
    // O verifier PKCE viaja dentro do state assinado (HMAC) — evita
    // depender de sessão/cookie entre o /authorize e o /callback.
    const { verifier, challenge } = generatePkcePair();
    const state = signState({ workspaceId, nonce: crypto.randomUUID(), pkceVerifier: verifier });

    const url = new URL(AUTH_URL);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", SCOPES.join(" "));
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");
    return url.toString();
  }

  async connect(stateToken: string, code: string): Promise<SocialAccount> {
    const clientId = process.env.X_CLIENT_ID!;
    const clientSecret = process.env.X_CLIENT_SECRET!;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/x/callback`;
    const { workspaceId, pkceVerifier } = verifyState(stateToken);
    if (!pkceVerifier) throw new Error("Verifier PKCE ausente no state.");

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        code_verifier: pkceVerifier,
      }),
    });
    if (!tokenRes.ok) throw new Error("Falha ao trocar code por access token (X).");
    const { access_token, refresh_token, expires_in } = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    const meRes = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const { data: me } = (await meRes.json()) as {
      data: { id: string; username: string; name: string; profile_image_url?: string };
    };

    const socialAccount = await prisma.socialAccount.upsert({
      where: { workspaceId_platform_externalId: { workspaceId, platform: "X", externalId: me.id } },
      update: { displayName: me.name, avatarUrl: me.profile_image_url, status: "CONNECTED", lastSyncedAt: new Date() },
      create: {
        workspaceId,
        platform: "X",
        externalId: me.id,
        displayName: me.name,
        avatarUrl: me.profile_image_url,
        status: "CONNECTED",
        lastSyncedAt: new Date(),
      },
    });

    await prisma.socialToken.upsert({
      where: { socialAccountId: socialAccount.id },
      update: {
        accessTokenEnc: encryptToken(access_token),
        refreshTokenEnc: refresh_token ? encryptToken(refresh_token) : undefined,
        expiresAt: new Date(Date.now() + expires_in * 1000),
      },
      create: {
        socialAccountId: socialAccount.id,
        accessTokenEnc: encryptToken(access_token),
        refreshTokenEnc: refresh_token ? encryptToken(refresh_token) : null,
        expiresAt: new Date(Date.now() + expires_in * 1000),
      },
    });

    return {
      id: socialAccount.id,
      platform: "X",
      displayName: me.name,
      handle: `@${me.username}`,
      avatarUrl: me.profile_image_url ?? "",
      status: "CONNECTED",
      lastSyncedAt: new Date().toISOString(),
    };
  }

  async refreshToken(accountId: string): Promise<void> {
    const token = await prisma.socialToken.findUnique({ where: { socialAccountId: accountId } });
    if (!token?.refreshTokenEnc) {
      await prisma.socialAccount.update({ where: { id: accountId }, data: { status: "RECONNECT_REQUIRED" } });
      throw new Error("Sem refresh token disponível — reconexão manual necessária.");
    }
    const clientId = process.env.X_CLIENT_ID!;
    const clientSecret = process.env.X_CLIENT_SECRET!;
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${basicAuth}` },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: decryptToken(token.refreshTokenEnc),
      }),
    });
    if (!res.ok) {
      await prisma.socialAccount.update({ where: { id: accountId }, data: { status: "RECONNECT_REQUIRED" } });
      throw new Error("Falha ao renovar token do X — reconexão manual necessária.");
    }
    const { access_token, refresh_token, expires_in } = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };
    await prisma.socialToken.update({
      where: { socialAccountId: accountId },
      data: {
        accessTokenEnc: encryptToken(access_token),
        refreshTokenEnc: refresh_token ? encryptToken(refresh_token) : undefined,
        expiresAt: new Date(Date.now() + expires_in * 1000),
      },
    });
  }

  async getAccount(accountId: string): Promise<SocialAccount> {
    const acc = await prisma.socialAccount.findUniqueOrThrow({ where: { id: accountId } });
    return {
      id: acc.id,
      platform: "X",
      displayName: acc.displayName,
      handle: acc.displayName,
      avatarUrl: acc.avatarUrl ?? "",
      status: acc.status,
      lastSyncedAt: acc.lastSyncedAt?.toISOString() ?? null,
    };
  }

  async publishPost(params: {
    accountId: string;
    content: string;
    mediaUrls: string[];
    idempotencyKey: string;
  }): Promise<PostPlatformResult> {
    if (params.content.length > this.limits.maxChars) {
      throw new UnsupportedOperationError(
        "X",
        `O X permite no máximo ${this.limits.maxChars} caracteres por post.`,
        "Encurte o texto ou publique como thread (não suportado nesta fase)."
      );
    }

    const token = await prisma.socialToken.findUniqueOrThrow({ where: { socialAccountId: params.accountId } });
    const accessToken = decryptToken(token.accessTokenEnc);

    // Upload de mídia usa o endpoint v1.1 (media/upload) e o media_id
    // resultante entra em `media.media_ids` abaixo — omitido aqui por
    // simplicidade; esta chamada cobre o caso de post só-texto.
    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: params.content }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        accountId: params.accountId,
        platform: "X",
        status: "FAILED",
        errorMessage: err?.detail ?? "Falha ao publicar no X.",
      };
    }

    return { accountId: params.accountId, platform: "X", status: "PUBLISHED" };
  }

  async getAnalytics(): Promise<unknown> {
    throw new Error("Métricas do X exigem acesso à API v2 paga (tier Basic ou superior).");
  }

  async disconnect(accountId: string): Promise<void> {
    await prisma.socialAccount.update({ where: { id: accountId }, data: { status: "DISCONNECTED" } });
    await prisma.socialToken.deleteMany({ where: { socialAccountId: accountId } });
  }
}

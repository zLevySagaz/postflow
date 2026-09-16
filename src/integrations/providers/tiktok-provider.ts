import { prisma } from "@/lib/prisma";
import { encryptToken, decryptToken } from "@/lib/crypto";
import { signState, verifyState } from "../oauth-utils";
import { PLATFORM_LIMITS } from "../platform-limits";
import { UnsupportedOperationError, type SocialProvider } from "../social-provider";
import type { PostPlatformResult, SocialAccount } from "@/lib/types";

const AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const SCOPES = ["user.info.basic", "video.publish"];

export class TikTokProvider implements SocialProvider {
  readonly platform = "TIKTOK" as const;
  get limits() {
    return PLATFORM_LIMITS.TIKTOK;
  }

  async getAuthUrl(workspaceId: string, redirectUri: string): Promise<string> {
    const clientKey = process.env.TIKTOK_CLIENT_ID;
    if (!clientKey) {
      throw new Error("Integração não configurada: defina TIKTOK_CLIENT_ID/SECRET em .env.");
    }
    const state = signState({ workspaceId, nonce: crypto.randomUUID() });
    const url = new URL(AUTH_URL);
    url.searchParams.set("client_key", clientKey);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", SCOPES.join(","));
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    return url.toString();
  }

  async connect(stateToken: string, code: string): Promise<SocialAccount> {
    const clientKey = process.env.TIKTOK_CLIENT_ID!;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET!;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/tiktok/callback`;
    const { workspaceId } = verifyState(stateToken);

    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });
    if (!tokenRes.ok) throw new Error("Falha ao trocar code por access token (TikTok).");
    const { access_token, refresh_token, expires_in, open_id } = (await tokenRes.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      open_id: string;
    };

    const profileRes = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const { data } = (await profileRes.json()) as {
      data: { user: { display_name: string; avatar_url?: string } };
    };

    const socialAccount = await prisma.socialAccount.upsert({
      where: { workspaceId_platform_externalId: { workspaceId, platform: "TIKTOK", externalId: open_id } },
      update: { displayName: data.user.display_name, status: "CONNECTED", lastSyncedAt: new Date() },
      create: {
        workspaceId,
        platform: "TIKTOK",
        externalId: open_id,
        displayName: data.user.display_name,
        avatarUrl: data.user.avatar_url,
        status: "CONNECTED",
        lastSyncedAt: new Date(),
      },
    });

    await prisma.socialToken.upsert({
      where: { socialAccountId: socialAccount.id },
      update: {
        accessTokenEnc: encryptToken(access_token),
        refreshTokenEnc: encryptToken(refresh_token),
        expiresAt: new Date(Date.now() + expires_in * 1000),
      },
      create: {
        socialAccountId: socialAccount.id,
        accessTokenEnc: encryptToken(access_token),
        refreshTokenEnc: encryptToken(refresh_token),
        expiresAt: new Date(Date.now() + expires_in * 1000),
      },
    });

    return {
      id: socialAccount.id,
      platform: "TIKTOK",
      displayName: data.user.display_name,
      handle: `@${data.user.display_name}`,
      avatarUrl: data.user.avatar_url ?? "",
      status: "CONNECTED",
      lastSyncedAt: new Date().toISOString(),
    };
  }

  async refreshToken(accountId: string): Promise<void> {
    const token = await prisma.socialToken.findUniqueOrThrow({ where: { socialAccountId: accountId } });
    if (!token.refreshTokenEnc) throw new Error("Sem refresh token — reconexão manual necessária.");

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_ID!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: decryptToken(token.refreshTokenEnc),
      }),
    });
    if (!res.ok) {
      await prisma.socialAccount.update({ where: { id: accountId }, data: { status: "RECONNECT_REQUIRED" } });
      throw new Error("Falha ao renovar token do TikTok.");
    }
    const { access_token, refresh_token, expires_in } = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };
    await prisma.socialToken.update({
      where: { socialAccountId: accountId },
      data: {
        accessTokenEnc: encryptToken(access_token),
        refreshTokenEnc: encryptToken(refresh_token),
        expiresAt: new Date(Date.now() + expires_in * 1000),
      },
    });
  }

  async getAccount(accountId: string): Promise<SocialAccount> {
    const acc = await prisma.socialAccount.findUniqueOrThrow({ where: { id: accountId } });
    return {
      id: acc.id,
      platform: "TIKTOK",
      displayName: acc.displayName,
      handle: `@${acc.displayName}`,
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
    const hasVideo = params.mediaUrls.length > 0; // assume-se vídeo — ver aviso na UI
    if (!hasVideo) {
      throw new UnsupportedOperationError(
        "TIKTOK",
        "O TikTok exige um vídeo — não é possível publicar apenas texto ou imagem estática.",
        "Adicione um vídeo na Biblioteca de Mídia antes de agendar para o TikTok."
      );
    }

    const token = await prisma.socialToken.findUniqueOrThrow({ where: { socialAccountId: params.accountId } });
    const accessToken = decryptToken(token.accessTokenEnc);

    // Content Posting API: inicializa o post via PULL_FROM_URL (a TikTok
    // busca o vídeo direto da URL informada) — requer domínio verificado
    // no TikTok Developer Portal para uso em produção.
    const res = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        post_info: {
          title: params.content.slice(0, 150),
          privacy_level: "SELF_ONLY", // apps não auditados só podem postar em modo privado
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: params.mediaUrls[0],
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        accountId: params.accountId,
        platform: "TIKTOK",
        status: "FAILED",
        errorMessage: err?.error?.message ?? "Falha ao publicar no TikTok.",
      };
    }

    // A publicação real acontece de forma assíncrona no lado da TikTok;
    // o status aqui reflete apenas o aceite da requisição de init.
    return { accountId: params.accountId, platform: "TIKTOK", status: "PUBLISHED" };
  }

  async getAnalytics(): Promise<unknown> {
    throw new Error("Analytics do TikTok requer aprovação de app com escopo video.list e research API.");
  }

  async disconnect(accountId: string): Promise<void> {
    await prisma.socialAccount.update({ where: { id: accountId }, data: { status: "DISCONNECTED" } });
    await prisma.socialToken.deleteMany({ where: { socialAccountId: accountId } });
  }
}

import { prisma } from "@/lib/prisma";
import { encryptToken, decryptToken } from "@/lib/crypto";
import { signState, verifyState } from "../oauth-utils";
import { PLATFORM_LIMITS } from "../platform-limits";
import { UnsupportedOperationError, type SocialProvider } from "../social-provider";
import type { PostPlatformResult, SocialAccount } from "@/lib/types";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
];

export class YouTubeProvider implements SocialProvider {
  readonly platform = "YOUTUBE" as const;
  get limits() {
    return PLATFORM_LIMITS.YOUTUBE;
  }

  async getAuthUrl(workspaceId: string, redirectUri: string): Promise<string> {
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    if (!clientId) {
      throw new Error("Integração não configurada: defina YOUTUBE_CLIENT_ID/SECRET em .env.");
    }
    const state = signState({ workspaceId, nonce: crypto.randomUUID() });
    const url = new URL(AUTH_URL);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", SCOPES.join(" "));
    url.searchParams.set("access_type", "offline"); // necessário para receber refresh_token
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("state", state);
    return url.toString();
  }

  async connect(stateToken: string, code: string): Promise<SocialAccount> {
    const clientId = process.env.YOUTUBE_CLIENT_ID!;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET!;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/youtube/callback`;
    const { workspaceId } = verifyState(stateToken);

    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) throw new Error("Falha ao trocar code por access token (YouTube).");
    const { access_token, refresh_token, expires_in } = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    const channelRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const { items } = (await channelRes.json()) as {
      items: { id: string; snippet: { title: string; thumbnails: { default: { url: string } } } }[];
    };
    const channel = items[0];
    if (!channel) throw new Error("Nenhum canal do YouTube encontrado para esta conta Google.");

    const socialAccount = await prisma.socialAccount.upsert({
      where: { workspaceId_platform_externalId: { workspaceId, platform: "YOUTUBE", externalId: channel.id } },
      update: { displayName: channel.snippet.title, status: "CONNECTED", lastSyncedAt: new Date() },
      create: {
        workspaceId,
        platform: "YOUTUBE",
        externalId: channel.id,
        displayName: channel.snippet.title,
        avatarUrl: channel.snippet.thumbnails.default.url,
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
      platform: "YOUTUBE",
      displayName: channel.snippet.title,
      handle: channel.id,
      avatarUrl: channel.snippet.thumbnails.default.url,
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
        client_id: process.env.YOUTUBE_CLIENT_ID!,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
        refresh_token: decryptToken(token.refreshTokenEnc),
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) {
      await prisma.socialAccount.update({ where: { id: accountId }, data: { status: "RECONNECT_REQUIRED" } });
      throw new Error("Falha ao renovar token do YouTube.");
    }
    const { access_token, expires_in } = (await res.json()) as { access_token: string; expires_in: number };
    await prisma.socialToken.update({
      where: { socialAccountId: accountId },
      data: { accessTokenEnc: encryptToken(access_token), expiresAt: new Date(Date.now() + expires_in * 1000) },
    });
  }

  async getAccount(accountId: string): Promise<SocialAccount> {
    const acc = await prisma.socialAccount.findUniqueOrThrow({ where: { id: accountId } });
    return {
      id: acc.id,
      platform: "YOUTUBE",
      displayName: acc.displayName,
      handle: acc.externalId,
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
    if (params.mediaUrls.length === 0) {
      throw new UnsupportedOperationError(
        "YOUTUBE",
        "O YouTube exige um arquivo de vídeo — não é possível publicar apenas texto.",
        "Adicione um vídeo na Biblioteca de Mídia antes de agendar para o YouTube."
      );
    }

    const token = await prisma.socialToken.findUniqueOrThrow({ where: { socialAccountId: params.accountId } });
    const accessToken = decryptToken(token.accessTokenEnc);

    // videos.insert exige upload resumable/multipart do binário do vídeo
    // (não uma URL). Nesta implementação inicial, baixamos o arquivo do
    // storage (mediaUrls[0]) e fazemos upload multipart simples — para
    // arquivos grandes, trocar por upload resumable (Content-Range).
    const videoRes = await fetch(params.mediaUrls[0]);
    const videoBlob = await videoRes.blob();

    const metadata = {
      snippet: { title: params.content.slice(0, 100) || "Novo vídeo", description: params.content },
      status: { privacyStatus: "public" },
    };

    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("video", videoBlob);

    const res = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status",
      { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: form }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        accountId: params.accountId,
        platform: "YOUTUBE",
        status: "FAILED",
        errorMessage: err?.error?.message ?? "Falha ao publicar no YouTube.",
      };
    }

    return { accountId: params.accountId, platform: "YOUTUBE", status: "PUBLISHED" };
  }

  async getAnalytics(accountId: string, from: Date, to: Date): Promise<unknown> {
    const token = await prisma.socialToken.findUniqueOrThrow({ where: { socialAccountId: accountId } });
    const accessToken = decryptToken(token.accessTokenEnc);
    const res = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${from
        .toISOString()
        .slice(0, 10)}&endDate=${to.toISOString().slice(0, 10)}&metrics=views,likes,comments,subscribersGained`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) throw new Error("Falha ao buscar métricas do YouTube.");
    return res.json();
  }

  async disconnect(accountId: string): Promise<void> {
    await prisma.socialAccount.update({ where: { id: accountId }, data: { status: "DISCONNECTED" } });
    await prisma.socialToken.deleteMany({ where: { socialAccountId: accountId } });
  }
}

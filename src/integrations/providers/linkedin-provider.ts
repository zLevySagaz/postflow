import { prisma } from "@/lib/prisma";
import { encryptToken, decryptToken } from "@/lib/crypto";
import { signState, verifyState } from "../oauth-utils";
import { PLATFORM_LIMITS } from "../platform-limits";
import type { SocialProvider } from "../social-provider";
import type { PostPlatformResult, SocialAccount } from "@/lib/types";

const AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const SCOPES = ["openid", "profile", "w_member_social"];

export class LinkedInProvider implements SocialProvider {
  readonly platform = "LINKEDIN" as const;
  get limits() {
    return PLATFORM_LIMITS.LINKEDIN;
  }

  async getAuthUrl(workspaceId: string, redirectUri: string): Promise<string> {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    if (!clientId) {
      throw new Error("Integração não configurada: defina LINKEDIN_CLIENT_ID/SECRET em .env.");
    }
    const state = signState({ workspaceId, nonce: crypto.randomUUID() });
    const url = new URL(AUTH_URL);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("scope", SCOPES.join(" "));
    return url.toString();
  }

  async connect(stateToken: string, code: string): Promise<SocialAccount> {
    const clientId = process.env.LINKEDIN_CLIENT_ID!;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/linkedin/callback`;
    const { workspaceId } = verifyState(stateToken);

    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    if (!tokenRes.ok) throw new Error("Falha ao trocar code por access token (LinkedIn).");
    const { access_token, expires_in } = (await tokenRes.json()) as {
      access_token: string;
      expires_in: number;
    };

    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profile = (await profileRes.json()) as { sub: string; name: string; picture?: string };

    const socialAccount = await prisma.socialAccount.upsert({
      where: { workspaceId_platform_externalId: { workspaceId, platform: "LINKEDIN", externalId: profile.sub } },
      update: { displayName: profile.name, avatarUrl: profile.picture, status: "CONNECTED", lastSyncedAt: new Date() },
      create: {
        workspaceId,
        platform: "LINKEDIN",
        externalId: profile.sub,
        displayName: profile.name,
        avatarUrl: profile.picture,
        status: "CONNECTED",
        lastSyncedAt: new Date(),
      },
    });

    await prisma.socialToken.upsert({
      where: { socialAccountId: socialAccount.id },
      update: { accessTokenEnc: encryptToken(access_token), expiresAt: new Date(Date.now() + expires_in * 1000) },
      create: {
        socialAccountId: socialAccount.id,
        accessTokenEnc: encryptToken(access_token),
        expiresAt: new Date(Date.now() + expires_in * 1000),
      },
    });

    return {
      id: socialAccount.id,
      platform: "LINKEDIN",
      displayName: profile.name,
      handle: `linkedin.com/in/${profile.sub}`,
      avatarUrl: profile.picture ?? "",
      status: "CONNECTED",
      lastSyncedAt: new Date().toISOString(),
    };
  }

  async refreshToken(): Promise<void> {
    // LinkedIn não emite refresh_token por padrão para a maioria dos apps
    // (exige aprovação especial). Access tokens duram ~60 dias — quando
    // expiram, o usuário precisa reconectar via getAuthUrl().
    throw new Error("LinkedIn requer reconexão manual — refresh automático não disponível.");
  }

  async getAccount(accountId: string): Promise<SocialAccount> {
    const acc = await prisma.socialAccount.findUniqueOrThrow({ where: { id: accountId } });
    return {
      id: acc.id,
      platform: "LINKEDIN",
      displayName: acc.displayName,
      handle: `linkedin.com/in/${acc.externalId}`,
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
    const account = await prisma.socialAccount.findUniqueOrThrow({ where: { id: params.accountId } });
    const token = await prisma.socialToken.findUniqueOrThrow({ where: { socialAccountId: params.accountId } });
    const accessToken = decryptToken(token.accessTokenEnc);
    const author = `urn:li:person:${account.externalId}`;

    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: params.content },
            // Publicação de imagem/vídeo real requer um upload prévio via
            // Assets API (registerUpload) e o urn resultante aqui —
            // omitido nesta implementação inicial por simplicidade.
            shareMediaCategory: params.mediaUrls.length > 0 ? "IMAGE" : "NONE",
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        accountId: params.accountId,
        platform: "LINKEDIN",
        status: "FAILED",
        errorMessage: err?.message ?? "Falha ao publicar no LinkedIn.",
      };
    }

    return { accountId: params.accountId, platform: "LINKEDIN", status: "PUBLISHED" };
  }

  async getAnalytics(): Promise<unknown> {
    // A Community Management API de analytics do LinkedIn exige aprovação
    // de parceiro (Marketing Developer Platform). Estrutura pronta para
    // quando o acesso for concedido.
    throw new Error("Analytics do LinkedIn requer acesso aprovado ao Marketing Developer Platform.");
  }

  async disconnect(accountId: string): Promise<void> {
    await prisma.socialAccount.update({ where: { id: accountId }, data: { status: "DISCONNECTED" } });
    await prisma.socialToken.deleteMany({ where: { socialAccountId: accountId } });
  }
}

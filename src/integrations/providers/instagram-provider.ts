import { prisma } from "@/lib/prisma";
import { encryptToken, decryptToken } from "@/lib/crypto";
import { signState, verifyState } from "../oauth-utils";
import { PLATFORM_LIMITS } from "../platform-limits";
import { UnsupportedOperationError, type SocialProvider } from "../social-provider";
import type { PostPlatformResult, SocialAccount } from "@/lib/types";

// Instagram (contas Business/Creator) é publicado via Instagram Graph API,
// autenticado com Facebook Login — não existe OAuth "nativo" do Instagram
// para contas profissionais. Referência: developers.facebook.com/docs/instagram-api
const GRAPH_VERSION = "v19.0";
const AUTH_URL = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`;
const TOKEN_URL = `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`;
const SCOPES = ["instagram_basic", "instagram_content_publish", "pages_show_list", "pages_read_engagement"];

export class InstagramProvider implements SocialProvider {
  readonly platform = "INSTAGRAM" as const;
  get limits() {
    return PLATFORM_LIMITS.INSTAGRAM;
  }

  async getAuthUrl(workspaceId: string, redirectUri: string): Promise<string> {
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    if (!clientId) {
      throw new Error(
        "Integração não configurada: defina INSTAGRAM_CLIENT_ID e INSTAGRAM_CLIENT_SECRET em .env."
      );
    }
    const state = signState({ workspaceId, nonce: crypto.randomUUID() });
    const url = new URL(AUTH_URL);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", SCOPES.join(","));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", state);
    return url.toString();
  }

  async connect(stateToken: string, code: string): Promise<SocialAccount> {
    const clientId = process.env.INSTAGRAM_CLIENT_ID!;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET!;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/instagram/callback`;
    const { workspaceId } = verifyState(stateToken);

    // 1. Troca o code por um short-lived user access token.
    const tokenRes = await fetch(
      `${TOKEN_URL}?client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&code=${code}`
    );
    if (!tokenRes.ok) throw new Error("Falha ao trocar code por access token (Instagram).");
    const { access_token: shortLivedToken } = (await tokenRes.json()) as { access_token: string };

    // 2. Troca por um long-lived token (~60 dias).
    const longLivedRes = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedToken}`
    );
    const { access_token: longLivedToken, expires_in } = (await longLivedRes.json()) as {
      access_token: string;
      expires_in: number;
    };

    // 3. Descobre a Página do Facebook vinculada e a conta Instagram Business associada.
    const pagesRes = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${longLivedToken}`
    );
    const pagesData = (await pagesRes.json()) as {
      data: { id: string; name: string; access_token: string; instagram_business_account?: { id: string } }[];
    };
    const pageWithIg = pagesData.data.find((p) => p.instagram_business_account);
    if (!pageWithIg?.instagram_business_account) {
      throw new Error(
        "Nenhuma conta Instagram Business/Creator vinculada a uma Página do Facebook foi encontrada."
      );
    }

    const igAccountId = pageWithIg.instagram_business_account.id;
    const igProfileRes = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${igAccountId}?fields=username,profile_picture_url&access_token=${pageWithIg.access_token}`
    );
    const igProfile = (await igProfileRes.json()) as { username: string; profile_picture_url?: string };

    const socialAccount = await prisma.socialAccount.upsert({
      where: {
        workspaceId_platform_externalId: {
          workspaceId,
          platform: "INSTAGRAM",
          externalId: igAccountId,
        },
      },
      update: {
        displayName: igProfile.username,
        avatarUrl: igProfile.profile_picture_url,
        status: "CONNECTED",
        lastSyncedAt: new Date(),
      },
      create: {
        workspaceId,
        platform: "INSTAGRAM",
        externalId: igAccountId,
        displayName: igProfile.username,
        avatarUrl: igProfile.profile_picture_url,
        status: "CONNECTED",
        lastSyncedAt: new Date(),
      },
    });

    // Guarda o token da Página (é ele que autentica chamadas à conta IG),
    // sempre cifrado.
    await prisma.socialToken.upsert({
      where: { socialAccountId: socialAccount.id },
      update: {
        accessTokenEnc: encryptToken(pageWithIg.access_token),
        expiresAt: new Date(Date.now() + expires_in * 1000),
      },
      create: {
        socialAccountId: socialAccount.id,
        accessTokenEnc: encryptToken(pageWithIg.access_token),
        expiresAt: new Date(Date.now() + expires_in * 1000),
      },
    });

    return {
      id: socialAccount.id,
      platform: "INSTAGRAM",
      displayName: igProfile.username,
      handle: `@${igProfile.username}`,
      avatarUrl: igProfile.profile_picture_url ?? "",
      status: "CONNECTED",
      lastSyncedAt: socialAccount.lastSyncedAt?.toISOString() ?? null,
    };
  }

  async refreshToken(accountId: string): Promise<void> {
    // Page access tokens long-lived duram ~60 dias e não têm refresh token
    // tradicional — a prática recomendada é re-solicitar via
    // fb_exchange_token antes de expirar, usando o token atual.
    const token = await prisma.socialToken.findUnique({ where: { socialAccountId: accountId } });
    if (!token) throw new Error("Token não encontrado para esta conta.");

    const clientId = process.env.INSTAGRAM_CLIENT_ID!;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET!;
    const current = decryptToken(token.accessTokenEnc);

    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${current}`
    );
    if (!res.ok) {
      await prisma.socialAccount.update({
        where: { id: accountId },
        data: { status: "RECONNECT_REQUIRED" },
      });
      throw new Error("Não foi possível renovar o token. Reconexão manual necessária.");
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
      platform: "INSTAGRAM",
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
    if (params.mediaUrls.length === 0) {
      throw new UnsupportedOperationError(
        "INSTAGRAM",
        "O Instagram exige ao menos uma imagem ou vídeo — não é possível publicar apenas texto.",
        "Adicione uma imagem na Biblioteca de Mídia antes de agendar para o Instagram."
      );
    }

    const account = await prisma.socialAccount.findUniqueOrThrow({ where: { id: params.accountId } });
    const token = await prisma.socialToken.findUniqueOrThrow({ where: { socialAccountId: params.accountId } });
    const accessToken = decryptToken(token.accessTokenEnc);

    // Fluxo de duas etapas da Instagram Graph API: cria um container de
    // mídia e depois publica esse container.
    const containerRes = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${account.externalId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: params.mediaUrls[0],
          caption: params.content,
          access_token: accessToken,
        }),
      }
    );
    if (!containerRes.ok) {
      const err = await containerRes.json().catch(() => ({}));
      return {
        accountId: params.accountId,
        platform: "INSTAGRAM",
        status: "FAILED",
        errorMessage: err?.error?.message ?? "Falha ao criar container de mídia no Instagram.",
      };
    }
    const { id: creationId } = (await containerRes.json()) as { id: string };

    const publishRes = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${account.externalId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creation_id: creationId, access_token: accessToken }),
      }
    );
    if (!publishRes.ok) {
      const err = await publishRes.json().catch(() => ({}));
      return {
        accountId: params.accountId,
        platform: "INSTAGRAM",
        status: "FAILED",
        errorMessage: err?.error?.message ?? "Falha ao publicar no Instagram.",
      };
    }

    return { accountId: params.accountId, platform: "INSTAGRAM", status: "PUBLISHED" };
  }

  async getAnalytics(accountId: string, from: Date, to: Date): Promise<unknown> {
    const token = await prisma.socialToken.findUniqueOrThrow({ where: { socialAccountId: accountId } });
    const account = await prisma.socialAccount.findUniqueOrThrow({ where: { id: accountId } });
    const accessToken = decryptToken(token.accessTokenEnc);

    const metrics = "impressions,reach,follower_count";
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${account.externalId}/insights?metric=${metrics}&period=day&since=${Math.floor(
        from.getTime() / 1000
      )}&until=${Math.floor(to.getTime() / 1000)}&access_token=${accessToken}`
    );
    if (!res.ok) throw new Error("Falha ao buscar métricas do Instagram.");
    return res.json();
  }

  async disconnect(accountId: string): Promise<void> {
    await prisma.socialAccount.update({ where: { id: accountId }, data: { status: "DISCONNECTED" } });
    await prisma.socialToken.deleteMany({ where: { socialAccountId: accountId } });
  }
}

import { prisma } from "@/lib/prisma";
import { encryptToken, decryptToken } from "@/lib/crypto";
import { signState, verifyState } from "../oauth-utils";
import { PLATFORM_LIMITS } from "../platform-limits";
import type { SocialProvider } from "../social-provider";
import type { PostPlatformResult, SocialAccount } from "@/lib/types";

const GRAPH_VERSION = "v19.0";
const AUTH_URL = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`;
const SCOPES = ["pages_show_list", "pages_manage_posts", "pages_read_engagement"];

export class FacebookProvider implements SocialProvider {
  readonly platform = "FACEBOOK" as const;
  get limits() {
    return PLATFORM_LIMITS.FACEBOOK;
  }

  async getAuthUrl(workspaceId: string, redirectUri: string): Promise<string> {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    if (!clientId) {
      throw new Error("Integração não configurada: defina FACEBOOK_CLIENT_ID/SECRET em .env.");
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
    const clientId = process.env.FACEBOOK_CLIENT_ID!;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET!;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/facebook/callback`;
    const { workspaceId } = verifyState(stateToken);

    const tokenRes = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&code=${code}`
    );
    const { access_token: userToken } = (await tokenRes.json()) as { access_token: string };

    const pagesRes = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/me/accounts?fields=id,name,access_token,picture&access_token=${userToken}`
    );
    const pagesData = (await pagesRes.json()) as {
      data: { id: string; name: string; access_token: string; picture?: { data: { url: string } } }[];
    };
    const page = pagesData.data[0];
    if (!page) throw new Error("Nenhuma Página do Facebook encontrada para esta conta.");

    const socialAccount = await prisma.socialAccount.upsert({
      where: { workspaceId_platform_externalId: { workspaceId, platform: "FACEBOOK", externalId: page.id } },
      update: { displayName: page.name, status: "CONNECTED", lastSyncedAt: new Date() },
      create: {
        workspaceId,
        platform: "FACEBOOK",
        externalId: page.id,
        displayName: page.name,
        avatarUrl: page.picture?.data.url,
        status: "CONNECTED",
        lastSyncedAt: new Date(),
      },
    });

    // Page access tokens obtidos assim já são de longa duração quando o
    // user token de origem também for long-lived.
    await prisma.socialToken.upsert({
      where: { socialAccountId: socialAccount.id },
      update: { accessTokenEnc: encryptToken(page.access_token) },
      create: { socialAccountId: socialAccount.id, accessTokenEnc: encryptToken(page.access_token) },
    });

    return {
      id: socialAccount.id,
      platform: "FACEBOOK",
      displayName: page.name,
      handle: page.id,
      avatarUrl: page.picture?.data.url ?? "",
      status: "CONNECTED",
      lastSyncedAt: new Date().toISOString(),
    };
  }

  async refreshToken(): Promise<void> {
    // Page tokens derivados de um long-lived user token não expiram na
    // prática — nada a fazer aqui além de validar periodicamente.
    return;
  }

  async getAccount(accountId: string): Promise<SocialAccount> {
    const acc = await prisma.socialAccount.findUniqueOrThrow({ where: { id: accountId } });
    return {
      id: acc.id,
      platform: "FACEBOOK",
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
    const account = await prisma.socialAccount.findUniqueOrThrow({ where: { id: params.accountId } });
    const token = await prisma.socialToken.findUniqueOrThrow({ where: { socialAccountId: params.accountId } });
    const accessToken = decryptToken(token.accessTokenEnc);

    const endpoint =
      params.mediaUrls.length > 0
        ? `https://graph.facebook.com/${GRAPH_VERSION}/${account.externalId}/photos`
        : `https://graph.facebook.com/${GRAPH_VERSION}/${account.externalId}/feed`;

    const body =
      params.mediaUrls.length > 0
        ? { url: params.mediaUrls[0], caption: params.content, access_token: accessToken }
        : { message: params.content, access_token: accessToken };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        accountId: params.accountId,
        platform: "FACEBOOK",
        status: "FAILED",
        errorMessage: err?.error?.message ?? "Falha ao publicar no Facebook.",
      };
    }

    return { accountId: params.accountId, platform: "FACEBOOK", status: "PUBLISHED" };
  }

  async getAnalytics(accountId: string, from: Date, to: Date): Promise<unknown> {
    const account = await prisma.socialAccount.findUniqueOrThrow({ where: { id: accountId } });
    const token = await prisma.socialToken.findUniqueOrThrow({ where: { socialAccountId: accountId } });
    const accessToken = decryptToken(token.accessTokenEnc);
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${account.externalId}/insights?metric=page_impressions,page_engaged_users&period=day&since=${Math.floor(
        from.getTime() / 1000
      )}&until=${Math.floor(to.getTime() / 1000)}&access_token=${accessToken}`
    );
    if (!res.ok) throw new Error("Falha ao buscar métricas do Facebook.");
    return res.json();
  }

  async disconnect(accountId: string): Promise<void> {
    await prisma.socialAccount.update({ where: { id: accountId }, data: { status: "DISCONNECTED" } });
    await prisma.socialToken.deleteMany({ where: { socialAccountId: accountId } });
  }
}

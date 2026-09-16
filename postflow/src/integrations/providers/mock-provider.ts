import type {
  PlatformLimits,
  PostPlatformResult,
  SocialAccount,
  SocialPlatform,
} from "@/lib/types";
import type { SocialProvider } from "../social-provider";
import { PLATFORM_LIMITS } from "../platform-limits";

/**
 * Implementação mock, usada em todas as plataformas na Fase 1.
 * Simula latência de rede e nunca faz nenhuma chamada externa real.
 * Quando a integração real de uma plataforma for construída, ela troca
 * esta classe por ex. InstagramProvider em provider-registry.ts — nada
 * fora de /integrations precisa mudar.
 */
export class MockSocialProvider implements SocialProvider {
  constructor(public readonly platform: SocialPlatform) {}

  get limits(): PlatformLimits {
    return PLATFORM_LIMITS[this.platform];
  }

  async getAuthUrl(): Promise<string> {
    throw new Error(
      `Integração com ${this.platform} não configurada. Configure as credenciais OAuth em Configurações > Integrações.`
    );
  }

  async connect(): Promise<SocialAccount> {
    throw new Error("connect() ainda não implementado nesta fase (mock).");
  }

  async refreshToken(): Promise<void> {
    return;
  }

  async getAccount(accountId: string): Promise<SocialAccount> {
    throw new Error(`Conta ${accountId} não encontrada (mock provider).`);
  }

  async publishPost(params: {
    accountId: string;
    content: string;
    mediaUrls: string[];
    idempotencyKey: string;
  }): Promise<PostPlatformResult> {
    await new Promise((r) => setTimeout(r, 300));
    return {
      accountId: params.accountId,
      platform: this.platform,
      status: "SCHEDULED",
    };
  }

  async getAnalytics(): Promise<unknown> {
    return null;
  }

  async disconnect(): Promise<void> {
    return;
  }
}

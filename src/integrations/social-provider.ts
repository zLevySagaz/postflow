import type {
  PlatformLimits,
  PostPlatformResult,
  SocialAccount,
  SocialPlatform,
} from "@/lib/types";

/**
 * Contrato que toda integração de rede social deve implementar.
 *
 * Nesta fase (MVP visual), a única implementação real é o
 * MockSocialProvider. Cada plataforma (Instagram, Facebook, LinkedIn, X,
 * TikTok, YouTube) terá sua própria classe em ./providers/*, implementando
 * esta mesma interface e chamando as APIs oficiais via OAuth.
 *
 * Nenhuma lógica específica de uma rede deve vazar para fora do provider
 * correspondente — dashboard, editor de post e calendário conversam apenas
 * com esta interface.
 */
export interface SocialProvider {
  readonly platform: SocialPlatform;
  readonly limits: PlatformLimits;

  /** Inicia o fluxo OAuth e retorna a URL de autorização da plataforma. */
  getAuthUrl(workspaceId: string, redirectUri: string): Promise<string>;

  /** Troca o código de autorização por tokens e persiste a conta conectada. */
  connect(workspaceId: string, code: string): Promise<SocialAccount>;

  /** Renova o access token usando o refresh token armazenado. */
  refreshToken(accountId: string): Promise<void>;

  /** Busca os dados atualizados da conta (nome, avatar, status). */
  getAccount(accountId: string): Promise<SocialAccount>;

  /** Publica o conteúdo na rede. Deve ser idempotente via idempotencyKey. */
  publishPost(params: {
    accountId: string;
    content: string;
    mediaUrls: string[];
    idempotencyKey: string;
  }): Promise<PostPlatformResult>;

  /** Busca métricas do período informado. */
  getAnalytics(accountId: string, from: Date, to: Date): Promise<unknown>;

  /** Revoga o acesso e marca a conta como desconectada. */
  disconnect(accountId: string): Promise<void>;
}

/**
 * Erro padronizado para quando uma plataforma não suporta uma operação
 * (ex.: TikTok não aceita post só-texto). A UI usa `friendlyMessage` e
 * `suggestion` para orientar o usuário a uma alternativa compatível.
 */
export class UnsupportedOperationError extends Error {
  constructor(
    public readonly platform: SocialPlatform,
    public readonly friendlyMessage: string,
    public readonly suggestion?: string
  ) {
    super(`[${platform}] ${friendlyMessage}`);
    this.name = "UnsupportedOperationError";
  }
}

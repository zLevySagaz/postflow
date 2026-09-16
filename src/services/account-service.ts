import { MOCK_ACCOUNTS } from "@/lib/mock-data";
import type { SocialAccount } from "@/lib/types";

export async function listAccounts(): Promise<SocialAccount[]> {
  await new Promise((r) => setTimeout(r, 150));
  return MOCK_ACCOUNTS;
}

export async function connectAccount(): Promise<never> {
  // Fase 1: sem OAuth real. Ver src/integrations/social-provider.ts.
  throw new Error(
    "Integração não configurada. A conexão real de contas chega na próxima fase (OAuth)."
  );
}

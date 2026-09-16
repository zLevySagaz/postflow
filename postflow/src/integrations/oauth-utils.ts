import { createHmac, randomBytes, createHash } from "crypto";

// State assinado (HMAC) para prevenir CSRF no callback OAuth. Carrega o
// workspaceId para sabermos a quem associar a conta conectada.
function getStateSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET não configurado.");
  return secret;
}

export function signState(payload: { workspaceId: string; nonce: string; pkceVerifier?: string }): string {
  const json = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", getStateSecret()).update(json).digest("base64url");
  return `${json}.${sig}`;
}

export function verifyState(state: string): { workspaceId: string; nonce: string; pkceVerifier?: string } {
  const [json, sig] = state.split(".");
  if (!json || !sig) throw new Error("State OAuth inválido.");
  const expected = createHmac("sha256", getStateSecret()).update(json).digest("base64url");
  if (sig !== expected) throw new Error("State OAuth não confere — possível CSRF.");
  return JSON.parse(Buffer.from(json, "base64url").toString("utf8"));
}

// PKCE (necessário para X/Twitter OAuth 2.0 e recomendado para outros).
export function generatePkcePair() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

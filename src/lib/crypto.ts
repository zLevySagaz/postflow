import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// Cifra tokens OAuth antes de persistir em SocialToken.accessTokenEnc /
// refreshTokenEnc. Nunca armazene tokens em texto puro.
//
// TOKEN_ENCRYPTION_KEY deve ser uma string hex de 32 bytes (64 chars),
// gerada com `openssl rand -hex 32` — ver .env.example.

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY não configurada. Defina-a em .env antes de conectar contas reais."
    );
  }
  // Aceita tanto uma chave hex de 64 chars quanto qualquer string (nesse
  // caso deriva uma chave de 32 bytes via scrypt, para não travar em dev).
  if (/^[0-9a-f]{64}$/i.test(raw)) return Buffer.from(raw, "hex");
  return scryptSync(raw, "postflow-token-salt", 32);
}

export function encryptToken(plainText: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Formato: iv.authTag.ciphertext, tudo em base64, separado por pontos.
  return [iv, authTag, encrypted].map((b) => b.toString("base64")).join(".");
}

export function decryptToken(payload: string): string {
  const key = getKey();
  const [ivB64, authTagB64, dataB64] = payload.split(".");
  if (!ivB64 || !authTagB64 || !dataB64) {
    throw new Error("Payload de token cifrado em formato inválido.");
  }
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}

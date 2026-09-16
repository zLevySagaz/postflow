import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Funciona com qualquer storage S3-compatible (AWS S3, Cloudflare R2,
// Supabase Storage, MinIO) — basta apontar STORAGE_ENDPOINT.
const s3 = new S3Client({
  region: process.env.STORAGE_REGION || "auto",
  endpoint: process.env.STORAGE_ENDPOINT || undefined,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY ?? "",
  },
});

const BUCKET = process.env.STORAGE_BUCKET ?? "postflow-media";

export function isStorageConfigured(): boolean {
  return Boolean(process.env.STORAGE_ACCESS_KEY_ID && process.env.STORAGE_SECRET_ACCESS_KEY);
}

/**
 * Gera uma URL pré-assinada de upload direto do navegador para o
 * storage — o arquivo nunca passa pelo servidor Next.js, evitando
 * estourar limites de payload em uploads grandes de vídeo.
 */
export async function createUploadUrl(params: {
  key: string;
  contentType: string;
}): Promise<{ uploadUrl: string; publicUrl: string }> {
  if (!isStorageConfigured()) {
    throw new Error(
      "Integração não configurada: defina STORAGE_ACCESS_KEY_ID/SECRET/BUCKET/ENDPOINT em .env."
    );
  }
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: params.key,
    ContentType: params.contentType,
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  const publicUrl = process.env.STORAGE_ENDPOINT
    ? `${process.env.STORAGE_ENDPOINT}/${BUCKET}/${params.key}`
    : `https://${BUCKET}.s3.amazonaws.com/${params.key}`;
  return { uploadUrl, publicUrl };
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

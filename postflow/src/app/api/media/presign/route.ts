import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { createUploadUrl } from "@/lib/storage";

const bodySchema = z.object({
  workspaceId: z.string(),
  fileName: z.string(),
  contentType: z.string(),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const { workspaceId, fileName, contentType } = parsed.data;
  const extension = fileName.split(".").pop();
  const key = `workspaces/${workspaceId}/media/${randomUUID()}.${extension}`;

  try {
    const { uploadUrl, publicUrl } = await createUploadUrl({ key, contentType });
    return NextResponse.json({ uploadUrl, publicUrl, key });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao gerar URL de upload.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

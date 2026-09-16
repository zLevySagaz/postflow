import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId é obrigatório" }, { status: 400 });
  }
  const media = await prisma.media.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(media);
}

const createSchema = z.object({
  workspaceId: z.string(),
  type: z.enum(["IMAGE", "VIDEO"]),
  url: z.string().url(),
  fileName: z.string(),
  sizeBytes: z.number().int().positive(),
  folder: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

// Chamado depois que o navegador já fez o upload direto para o storage
// via URL pré-assinada (/api/media/presign) — aqui só registramos o
// metadado no banco.
export async function POST(req: Request) {
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const media = await prisma.media.create({ data: parsed.data });
  return NextResponse.json(media, { status: 201 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const media = await prisma.media.findUnique({ where: { id: params.id } });
  if (!media) return NextResponse.json({ error: "Mídia não encontrada" }, { status: 404 });

  await prisma.media.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

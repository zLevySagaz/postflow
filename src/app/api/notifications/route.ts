import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId é obrigatório" }, { status: 400 });
  }
  const notifications = await prisma.notification.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(notifications);
}

export async function PATCH(req: Request) {
  const { id } = await req.json().catch(() => ({ id: null }));
  if (!id) return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
  const updated = await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  return NextResponse.json(updated);
}

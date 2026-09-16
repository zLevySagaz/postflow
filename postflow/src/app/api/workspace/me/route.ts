import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: { workspace: { include: { subscription: { include: { plan: true } } } } },
  });
  if (!membership) return NextResponse.json({ error: "Nenhum workspace encontrado" }, { status: 404 });

  return NextResponse.json({
    workspace: membership.workspace,
    role: membership.role,
  });
}

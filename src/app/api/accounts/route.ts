import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId é obrigatório" }, { status: 400 });
  }
  const accounts = await prisma.socialAccount.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(accounts);
}

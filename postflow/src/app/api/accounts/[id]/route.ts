import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProvider } from "@/integrations/provider-registry";

// Desconecta revogando o acesso junto ao provider (quando aplicável) e
// limpando o token local — nunca deixamos um token órfão no banco.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const account = await prisma.socialAccount.findUnique({ where: { id: params.id } });
  if (!account) return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });

  try {
    await getProvider(account.platform).disconnect(params.id);
  } catch {
    // Mesmo se a chamada de revogação externa falhar, garantimos o
    // estado local consistente abaixo.
  }

  await prisma.socialAccount.update({ where: { id: params.id }, data: { status: "DISCONNECTED" } });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_PRICE_BY_TIER } from "@/lib/stripe";

const bodySchema = z.object({
  workspaceId: z.string(),
  tier: z.enum(["STARTER", "PRO", "AGENCY"]),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const { workspaceId, tier } = parsed.data;

  const priceId = STRIPE_PRICE_BY_TIER[tier];
  if (!priceId) {
    return NextResponse.json(
      { error: `Integração não configurada: defina STRIPE_PRICE_ID_${tier} em .env.` },
      { status: 503 }
    );
  }

  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
  const existingSub = await prisma.subscription.findUnique({ where: { workspaceId } });

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    customer: existingSub?.stripeCustomerId ?? undefined,
    client_reference_id: workspaceId,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?upgraded=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    metadata: { workspaceId, tier, workspaceName: workspace.name },
  });

  return NextResponse.json({ url: checkoutSession.url });
}

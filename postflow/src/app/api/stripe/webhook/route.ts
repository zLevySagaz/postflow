import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// Stripe exige o body cru (não parseado) para validar a assinatura HMAC
// do webhook — por isso o App Router precisa ler req.text() em vez de
// req.json() aqui.
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Integração não configurada: defina STRIPE_WEBHOOK_SECRET em .env." },
      { status: 503 }
    );
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Assinatura inválida";
    return NextResponse.json({ error: `Webhook inválido: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspaceId;
      const tier = session.metadata?.tier as "STARTER" | "PRO" | "AGENCY" | undefined;
      if (!workspaceId || !tier) break;

      const plan = await prisma.plan.findUnique({ where: { tier } });
      if (!plan) break;

      await prisma.subscription.upsert({
        where: { workspaceId },
        update: {
          planId: plan.id,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
        },
        create: {
          workspaceId,
          planId: plan.id,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
        },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const freePlan = await prisma.plan.findUnique({ where: { tier: "FREE" } });
      if (!freePlan) break;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { planId: freePlan.id },
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const sub = await prisma.subscription.findFirst({
        where: { stripeCustomerId: invoice.customer as string },
      });
      if (sub) {
        await prisma.notification.create({
          data: {
            workspaceId: sub.workspaceId,
            type: "API_LIMIT_REACHED", // reaproveitado como alerta de cobrança até termos um tipo dedicado
            message: "Falha na cobrança da assinatura. Atualize o método de pagamento.",
          },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

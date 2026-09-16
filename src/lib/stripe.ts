import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV === "production") {
  console.warn("STRIPE_SECRET_KEY não configurada — cobrança recorrente indisponível.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2024-06-20",
});

export const STRIPE_PRICE_BY_TIER: Record<"STARTER" | "PRO" | "AGENCY", string | undefined> = {
  STARTER: process.env.STRIPE_PRICE_ID_STARTER,
  PRO: process.env.STRIPE_PRICE_ID_PRO,
  AGENCY: process.env.STRIPE_PRICE_ID_AGENCY,
};

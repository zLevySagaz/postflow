// Seed mínimo: popula os planos de assinatura. Rode com `npm run db:seed`
// depois de `npm run db:push`.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.plan.createMany({
    data: [
      {
        tier: "FREE",
        name: "Free",
        priceMonthlyCents: 0,
        maxSocialAccounts: 1,
        maxScheduledPosts: 10,
        maxUsers: 1,
        storageMb: 250,
        analyticsHistoryDays: 7,
      },
      {
        tier: "STARTER",
        name: "Starter",
        priceMonthlyCents: 4900,
        maxSocialAccounts: 3,
        maxScheduledPosts: 60,
        maxUsers: 2,
        storageMb: 2000,
        analyticsHistoryDays: 30,
      },
      {
        tier: "PRO",
        name: "Pro",
        priceMonthlyCents: 12900,
        maxSocialAccounts: 6,
        maxScheduledPosts: -1,
        maxUsers: 5,
        storageMb: 10000,
        analyticsHistoryDays: 90,
      },
      {
        tier: "AGENCY",
        name: "Agency",
        priceMonthlyCents: 34900,
        maxSocialAccounts: 6,
        maxScheduledPosts: -1,
        maxUsers: -1,
        storageMb: 50000,
        analyticsHistoryDays: 365,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed concluído: planos criados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

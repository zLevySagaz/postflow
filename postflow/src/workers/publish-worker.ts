// Processo separado: rode com `npm run worker` (ou `npm run worker:dev`
// em desenvolvimento). Não roda dentro do processo do Next.js.

import "dotenv/config";
import { Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "@/lib/prisma";
import { getProvider } from "@/integrations/provider-registry";
import { UnsupportedOperationError } from "@/integrations/social-provider";
import { PUBLISH_QUEUE_NAME, type PublishJobData } from "@/lib/queue";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

async function notify(
  workspaceId: string,
  type:
    | "POST_PUBLISHED"
    | "POST_FAILED"
    | "TOKEN_EXPIRED"
    | "ACCOUNT_DISCONNECTED"
    | "API_LIMIT_REACHED",
  message: string
) {
  await prisma.notification.create({ data: { workspaceId, type, message } });
}

async function processPost(job: Job<PublishJobData>) {
  const { postId } = job.data;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      platforms: { include: { socialAccount: true } },
      media: { include: { media: true } },
      workspace: true,
    },
  });

  if (!post) return;
  if (post.status === "CANCELLED") return;

  await prisma.post.update({ where: { id: post.id }, data: { status: "PROCESSING" } });

  const mediaUrls = post.media.map((pm) => pm.media.url);
  let anyFailed = false;

  // Publica em cada plataforma de forma independente — a falha em uma
  // rede não deve impedir a publicação nas demais.
  for (const platformEntry of post.platforms) {
    const provider = getProvider(platformEntry.platform);

    try {
      const result = await provider.publishPost({
        accountId: platformEntry.socialAccountId,
        content: platformEntry.content ?? post.content,
        mediaUrls,
        // Idempotency key estável por post+conta evita publicação duplicada
        // em caso de retry do job.
        idempotencyKey: `${post.idempotencyKey}:${platformEntry.socialAccountId}`,
      });

      await prisma.postPlatform.update({
        where: { id: platformEntry.id },
        data: {
          status: result.status,
          publishedAt: result.status === "PUBLISHED" ? new Date() : null,
          errorMessage: result.errorMessage ?? null,
        },
      });

      if (result.status === "FAILED") anyFailed = true;
    } catch (err) {
      anyFailed = true;
      const friendly =
        err instanceof UnsupportedOperationError
          ? err.friendlyMessage
          : err instanceof Error
          ? err.message
          : "Erro desconhecido ao publicar.";

      await prisma.postPlatform.update({
        where: { id: platformEntry.id },
        data: {
          status: "FAILED",
          errorMessage: friendly,
          retryCount: { increment: 1 },
        },
      });

      await notify(
        post.workspaceId,
        "POST_FAILED",
        `Falha ao publicar em ${platformEntry.platform}: ${friendly}`
      );
    }
  }

  await prisma.post.update({
    where: { id: post.id },
    data: { status: anyFailed ? "FAILED" : "PUBLISHED" },
  });

  if (!anyFailed) {
    await notify(post.workspaceId, "POST_PUBLISHED", "Post publicado com sucesso.");
  }
}

const worker = new Worker<PublishJobData>(PUBLISH_QUEUE_NAME, processPost, {
  connection,
  concurrency: 5,
});

worker.on("completed", (job) => {
  console.log(`[worker] job ${job.id} concluído (post ${job.data.postId})`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] job ${job?.id} falhou definitivamente:`, err.message);
});

console.log("[worker] PostFlow publish-worker rodando. Aguardando jobs...");

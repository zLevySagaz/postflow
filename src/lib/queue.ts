import { Queue } from "bullmq";
import IORedis from "ioredis";

// Conexão compartilhada com Redis. maxRetriesPerRequest: null é exigido
// pelo BullMQ para conexões usadas em filas/workers.
const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const PUBLISH_QUEUE_NAME = "post-publish";

export const publishQueue = new Queue(PUBLISH_QUEUE_NAME, { connection });

export interface PublishJobData {
  postId: string;
}

function jobIdFor(postId: string) {
  return `publish:${postId}`;
}

export async function enqueuePublishJob(postId: string, runAt: Date) {
  const delay = Math.max(0, runAt.getTime() - Date.now());
  await publishQueue.add(
    "publish-post",
    { postId } satisfies PublishJobData,
    {
      jobId: jobIdFor(postId),
      delay,
      attempts: 3,
      backoff: { type: "exponential", delay: 30_000 },
      removeOnComplete: 500,
      removeOnFail: 1000,
    }
  );
}

export async function rescheduleJob(postId: string, runAt: Date) {
  await cancelJob(postId);
  await enqueuePublishJob(postId, runAt);
}

export async function cancelJob(postId: string) {
  const job = await publishQueue.getJob(jobIdFor(postId));
  if (job) await job.remove();
}

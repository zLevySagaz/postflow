import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { PostStatus } from "@prisma/client";

const createPostSchema = z.object({
  workspaceId: z.string(),
  authorId: z.string(),
  content: z.string().min(1),
  mediaIds: z.array(z.string()).default([]),
  accountIds: z.array(z.string()).min(0),
  status: z.enum(["DRAFT", "SCHEDULED"]),
  scheduledAt: z.string().datetime().nullable(),
  timezone: z.string().default("America/Sao_Paulo"),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  const status = searchParams.get("status") as PostStatus | null;

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId é obrigatório" }, { status: 400 });
  }

  const posts = await prisma.post.findMany({
    where: { workspaceId, ...(status ? { status } : {}) },
    include: { platforms: true, media: { include: { media: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = createPostSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }
  const input = parsed.data;

  if (input.status === "SCHEDULED" && (!input.scheduledAt || input.accountIds.length === 0)) {
    return NextResponse.json(
      { error: "Posts agendados precisam de data e ao menos uma rede selecionada" },
      { status: 400 }
    );
  }

  const accounts = input.accountIds.length
    ? await prisma.socialAccount.findMany({ where: { id: { in: input.accountIds } } })
    : [];

  const post = await prisma.$transaction(async (tx) => {
    const created = await tx.post.create({
      data: {
        workspaceId: input.workspaceId,
        authorId: input.authorId,
        content: input.content,
        status: input.status,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        timezone: input.timezone,
        media: {
          create: input.mediaIds.map((mediaId, order) => ({ mediaId, order })),
        },
        platforms: {
          create: accounts.map((acc) => ({
            socialAccountId: acc.id,
            platform: acc.platform,
            status: input.status === "DRAFT" ? "DRAFT" : "SCHEDULED",
          })),
        },
      },
      include: { platforms: true, media: true },
    });

    if (input.status === "SCHEDULED" && input.scheduledAt) {
      await tx.schedule.create({
        data: {
          postId: created.id,
          runAt: new Date(input.scheduledAt),
          timezone: input.timezone,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.authorId,
        action: input.status === "DRAFT" ? "post.draft_created" : "post.scheduled",
        metadata: { postId: created.id },
      },
    });

    return created;
  });

  // Enfileira o job de publicação real. Ver src/lib/queue.ts e
  // src/workers/publish-worker.ts — o worker roda em processo separado
  // (`npm run worker`) e é quem de fato chama os providers.
  if (input.status === "SCHEDULED" && input.scheduledAt) {
    const { enqueuePublishJob } = await import("@/lib/queue");
    await enqueuePublishJob(post.id, new Date(input.scheduledAt));
  }

  return NextResponse.json(post, { status: 201 });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  content: z.string().min(1).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "CANCELLED"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const existing = await prisma.post.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
  }
  if (existing.status === "PUBLISHED" || existing.status === "PROCESSING") {
    return NextResponse.json(
      { error: "Não é possível editar um post já publicado ou em processamento" },
      { status: 409 }
    );
  }

  const updated = await prisma.post.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.content !== undefined ? { content: parsed.data.content } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.scheduledAt !== undefined
        ? { scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null }
        : {}),
    },
  });

  // Reagendamento: atualiza o Schedule e o job na fila (remove o antigo,
  // cria um novo com o delay recalculado).
  if (parsed.data.scheduledAt && updated.status === "SCHEDULED") {
    const { rescheduleJob } = await import("@/lib/queue");
    await rescheduleJob(updated.id, new Date(parsed.data.scheduledAt));
    await prisma.schedule.upsert({
      where: { postId: updated.id },
      update: { runAt: new Date(parsed.data.scheduledAt) },
      create: {
        postId: updated.id,
        runAt: new Date(parsed.data.scheduledAt),
        timezone: updated.timezone,
      },
    });
  }

  if (parsed.data.status === "CANCELLED") {
    const { cancelJob } = await import("@/lib/queue");
    await cancelJob(updated.id);
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.post.delete({ where: { id: params.id } });
  const { cancelJob } = await import("@/lib/queue");
  await cancelJob(params.id);
  return NextResponse.json({ ok: true });
}

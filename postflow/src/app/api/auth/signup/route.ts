import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter ao menos 8 caracteres"),
  workspaceName: z.string().min(1).optional(),
});

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }
  const { name, email, password, workspaceName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const baseSlug = slugify(workspaceName || `${name}-workspace`) || "workspace";

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email, passwordHash },
    });

    // Garante slug único adicionando sufixo se necessário.
    let slug = baseSlug;
    let attempt = 0;
    while (await tx.workspace.findUnique({ where: { slug } })) {
      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
    }

    const workspace = await tx.workspace.create({
      data: {
        name: workspaceName || `Workspace de ${name}`,
        slug,
        members: {
          create: { userId: user.id, role: "OWNER", joinedAt: new Date() },
        },
      },
    });

    // Assina o plano Free por padrão.
    const freePlan = await tx.plan.findUnique({ where: { tier: "FREE" } });
    if (freePlan) {
      await tx.subscription.create({
        data: { workspaceId: workspace.id, planId: freePlan.id },
      });
    }

    await tx.auditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        action: "workspace.created",
      },
    });

    return { user, workspace };
  });

  return NextResponse.json(
    { userId: result.user.id, workspaceId: result.workspace.id },
    { status: 201 }
  );
}

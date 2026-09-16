// ATENÇÃO: dados fictícios para navegação da Fase 1 (MVP visual).
// Nenhum destes valores representa uma conta, publicação ou métrica real.
// Quando o backend real existir, este arquivo é substituído por chamadas
// aos services (src/services/*), que hoje leem a partir daqui.

import type { MediaAsset, Post, SocialAccount } from "./types";

export const MOCK_ACCOUNTS: SocialAccount[] = [
  {
    id: "acc_instagram_1",
    platform: "INSTAGRAM",
    displayName: "PostFlow Studio",
    handle: "@postflow.studio",
    avatarUrl: "",
    status: "CONNECTED",
    lastSyncedAt: "2026-09-13T18:20:00-03:00",
  },
  {
    id: "acc_linkedin_1",
    platform: "LINKEDIN",
    displayName: "PostFlow",
    handle: "company/postflow",
    avatarUrl: "",
    status: "CONNECTED",
    lastSyncedAt: "2026-09-13T09:00:00-03:00",
  },
  {
    id: "acc_x_1",
    platform: "X",
    displayName: "PostFlow",
    handle: "@postflowapp",
    avatarUrl: "",
    status: "RECONNECT_REQUIRED",
    lastSyncedAt: "2026-09-08T11:00:00-03:00",
  },
  {
    id: "acc_facebook_1",
    platform: "FACEBOOK",
    displayName: "PostFlow Página",
    handle: "postflow.page",
    avatarUrl: "",
    status: "NOT_CONFIGURED",
    lastSyncedAt: null,
  },
  {
    id: "acc_tiktok_1",
    platform: "TIKTOK",
    displayName: "—",
    handle: "—",
    avatarUrl: "",
    status: "NOT_CONFIGURED",
    lastSyncedAt: null,
  },
  {
    id: "acc_youtube_1",
    platform: "YOUTUBE",
    displayName: "—",
    handle: "—",
    avatarUrl: "",
    status: "NOT_CONFIGURED",
    lastSyncedAt: null,
  },
];

export const MOCK_MEDIA: MediaAsset[] = [
  {
    id: "media_1",
    type: "IMAGE",
    url: "",
    thumbnailUrl: "",
    fileName: "lancamento-produto.jpg",
    sizeBytes: 2_400_000,
    folder: "Campanhas",
    tags: ["lançamento", "produto"],
    createdAt: "2026-09-10T14:00:00-03:00",
  },
  {
    id: "media_2",
    type: "VIDEO",
    url: "",
    thumbnailUrl: "",
    fileName: "bastidores-equipe.mp4",
    sizeBytes: 18_900_000,
    folder: "Bastidores",
    tags: ["equipe", "cultura"],
    createdAt: "2026-09-08T10:30:00-03:00",
  },
  {
    id: "media_3",
    type: "IMAGE",
    url: "",
    thumbnailUrl: "",
    fileName: "citacao-cliente.jpg",
    sizeBytes: 1_100_000,
    folder: "Depoimentos",
    tags: ["cliente", "prova social"],
    createdAt: "2026-09-05T09:15:00-03:00",
  },
];

const now = new Date();
function daysFromNow(days: number, hour = 10) {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const MOCK_POSTS: Post[] = [
  {
    id: "post_1",
    content:
      "Nova funcionalidade no ar 🚀 Agora você agenda posts para 6 redes de uma vez só.",
    mediaIds: ["media_1"],
    accountIds: ["acc_instagram_1", "acc_linkedin_1"],
    status: "SCHEDULED",
    scheduledAt: daysFromNow(1, 9),
    timezone: "America/Sao_Paulo",
    createdAt: daysFromNow(-1),
    updatedAt: daysFromNow(-1),
    platformResults: [
      { accountId: "acc_instagram_1", platform: "INSTAGRAM", status: "SCHEDULED" },
      { accountId: "acc_linkedin_1", platform: "LINKEDIN", status: "SCHEDULED" },
    ],
  },
  {
    id: "post_2",
    content: "Bastidores de como montamos o time de produto. Confira o vídeo completo.",
    mediaIds: ["media_2"],
    accountIds: ["acc_linkedin_1"],
    status: "SCHEDULED",
    scheduledAt: daysFromNow(3, 15),
    timezone: "America/Sao_Paulo",
    createdAt: daysFromNow(-2),
    updatedAt: daysFromNow(-2),
    platformResults: [
      { accountId: "acc_linkedin_1", platform: "LINKEDIN", status: "SCHEDULED" },
    ],
  },
  {
    id: "post_3",
    content: "O que nossos clientes dizem sobre economizar 6h por semana com automação.",
    mediaIds: ["media_3"],
    accountIds: ["acc_instagram_1"],
    status: "PUBLISHED",
    scheduledAt: daysFromNow(-2, 11),
    timezone: "America/Sao_Paulo",
    createdAt: daysFromNow(-4),
    updatedAt: daysFromNow(-2),
    platformResults: [
      { accountId: "acc_instagram_1", platform: "INSTAGRAM", status: "PUBLISHED" },
    ],
  },
  {
    id: "post_4",
    content: "Rascunho: ideia de enquete sobre horário ideal de publicação.",
    mediaIds: [],
    accountIds: ["acc_x_1"],
    status: "DRAFT",
    scheduledAt: null,
    timezone: "America/Sao_Paulo",
    createdAt: daysFromNow(-1),
    updatedAt: daysFromNow(-1),
    platformResults: [],
  },
  {
    id: "post_5",
    content: "Post de teste que falhou por token expirado no X.",
    mediaIds: [],
    accountIds: ["acc_x_1"],
    status: "FAILED",
    scheduledAt: daysFromNow(-1, 8),
    timezone: "America/Sao_Paulo",
    createdAt: daysFromNow(-3),
    updatedAt: daysFromNow(-1),
    platformResults: [
      {
        accountId: "acc_x_1",
        platform: "X",
        status: "FAILED",
        errorMessage: "Token de acesso expirado. Reconecte a conta.",
      },
    ],
  },
];

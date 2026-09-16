// Tipos de domínio compartilhados entre UI, services e integrations.
// Espelham o schema.prisma — quando o Prisma Client for gerado contra um
// banco real, estes tipos podem ser trocados pelos tipos gerados
// (import type { Post, SocialAccount } from "@prisma/client").

export type SocialPlatform =
  | "INSTAGRAM"
  | "FACEBOOK"
  | "LINKEDIN"
  | "X"
  | "TIKTOK"
  | "YOUTUBE";

export const ALL_PLATFORMS: SocialPlatform[] = [
  "INSTAGRAM",
  "FACEBOOK",
  "LINKEDIN",
  "X",
  "TIKTOK",
  "YOUTUBE",
];

export type ConnectionStatus =
  | "CONNECTED"
  | "RECONNECT_REQUIRED"
  | "DISCONNECTED"
  | "NOT_CONFIGURED";

export type PostStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "PROCESSING"
  | "PUBLISHED"
  | "FAILED"
  | "CANCELLED";

export type MediaType = "IMAGE" | "VIDEO";

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  displayName: string;
  handle: string;
  avatarUrl: string;
  status: ConnectionStatus;
  lastSyncedAt: string | null;
}

export interface MediaAsset {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl: string;
  fileName: string;
  sizeBytes: number;
  folder: string;
  tags: string[];
  createdAt: string;
}

export interface PostPlatformResult {
  accountId: string;
  platform: SocialPlatform;
  status: PostStatus;
  errorMessage?: string;
}

export interface Post {
  id: string;
  content: string;
  mediaIds: string[];
  accountIds: string[];
  status: PostStatus;
  scheduledAt: string | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  platformResults: PostPlatformResult[];
}

export interface PlatformLimits {
  maxChars: number;
  supportsVideo: boolean;
  supportsImage: boolean;
  supportsMultiImage: boolean;
  supportsMentions: boolean;
  supportsLink: boolean;
  maxImages?: number;
}

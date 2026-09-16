import type { PlatformLimits, SocialPlatform } from "@/lib/types";

// Valores aproximados e conservadores, documentados publicamente pelas
// plataformas. Devem ser revisados quando cada provider real for
// implementado, pois políticas de API mudam com frequência.
export const PLATFORM_LIMITS: Record<SocialPlatform, PlatformLimits> = {
  INSTAGRAM: {
    maxChars: 2200,
    supportsVideo: true,
    supportsImage: true,
    supportsMultiImage: true,
    supportsMentions: true,
    supportsLink: false,
    maxImages: 10,
  },
  FACEBOOK: {
    maxChars: 63206,
    supportsVideo: true,
    supportsImage: true,
    supportsMultiImage: true,
    supportsMentions: true,
    supportsLink: true,
    maxImages: 10,
  },
  LINKEDIN: {
    maxChars: 3000,
    supportsVideo: true,
    supportsImage: true,
    supportsMultiImage: true,
    supportsMentions: true,
    supportsLink: true,
    maxImages: 9,
  },
  X: {
    maxChars: 280,
    supportsVideo: true,
    supportsImage: true,
    supportsMultiImage: true,
    supportsMentions: true,
    supportsLink: true,
    maxImages: 4,
  },
  TIKTOK: {
    maxChars: 2200,
    supportsVideo: true,
    supportsImage: false,
    supportsMultiImage: false,
    supportsMentions: true,
    supportsLink: false,
  },
  YOUTUBE: {
    maxChars: 5000,
    supportsVideo: true,
    supportsImage: false,
    supportsMultiImage: false,
    supportsMentions: false,
    supportsLink: true,
  },
};

export const PLATFORM_META: Record<
  SocialPlatform,
  { label: string; color: string }
> = {
  INSTAGRAM: { label: "Instagram", color: "#E1306C" },
  FACEBOOK: { label: "Facebook", color: "#1877F2" },
  LINKEDIN: { label: "LinkedIn", color: "#0A66C2" },
  X: { label: "X", color: "#F1F1F3" },
  TIKTOK: { label: "TikTok", color: "#25F4EE" },
  YOUTUBE: { label: "YouTube", color: "#FF0000" },
};

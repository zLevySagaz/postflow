import { Instagram, Facebook, Linkedin, Youtube, Music2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SocialPlatform } from "@/lib/types";

function XGlyph({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.9 2H22l-7.6 8.7L23 22h-6.9l-5.4-6.8L4.5 22H1.4l8.1-9.3L1 2h7.1l4.9 6.2L18.9 2Zm-1.2 18h1.9L7.4 4H5.3l12.4 16Z" />
    </svg>
  );
}

const ICONS: Record<SocialPlatform, LucideIcon | typeof XGlyph> = {
  INSTAGRAM: Instagram,
  FACEBOOK: Facebook,
  LINKEDIN: Linkedin,
  X: XGlyph,
  TIKTOK: Music2,
  YOUTUBE: Youtube,
};

export function PlatformIcon({
  platform,
  size = 16,
  className,
}: {
  platform: SocialPlatform;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[platform];
  return <Icon size={size} className={className} />;
}

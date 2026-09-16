import type { SocialPlatform } from "@/lib/types";
import type { SocialProvider } from "./social-provider";
import { InstagramProvider } from "./providers/instagram-provider";
import { FacebookProvider } from "./providers/facebook-provider";
import { LinkedInProvider } from "./providers/linkedin-provider";
import { XProvider } from "./providers/x-provider";
import { TikTokProvider } from "./providers/tiktok-provider";
import { YouTubeProvider } from "./providers/youtube-provider";

// Ponto único de acesso a um provider. O restante da aplicação nunca
// importa um provider concreto diretamente — sempre passa pelo registry,
// o que permite trocar a implementação mock pela real sem tocar em UI
// ou services.
const registry: Record<SocialPlatform, SocialProvider> = {
  INSTAGRAM: new InstagramProvider(),
  FACEBOOK: new FacebookProvider(),
  LINKEDIN: new LinkedInProvider(),
  X: new XProvider(),
  TIKTOK: new TikTokProvider(),
  YOUTUBE: new YouTubeProvider(),
};

export function getProvider(platform: SocialPlatform): SocialProvider {
  return registry[platform];
}

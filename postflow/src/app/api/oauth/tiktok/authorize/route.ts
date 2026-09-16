import { handleAuthorize } from "@/integrations/oauth-route-handlers";
import { TikTokProvider } from "@/integrations/providers/tiktok-provider";

const provider = new TikTokProvider();

export async function GET(req: Request) {
  return handleAuthorize(provider, req);
}

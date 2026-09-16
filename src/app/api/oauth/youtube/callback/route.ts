import { handleCallback } from "@/integrations/oauth-route-handlers";
import { YouTubeProvider } from "@/integrations/providers/youtube-provider";

const provider = new YouTubeProvider();

export async function GET(req: Request) {
  return handleCallback(provider, req);
}

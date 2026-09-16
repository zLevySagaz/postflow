import { handleAuthorize } from "@/integrations/oauth-route-handlers";
import { InstagramProvider } from "@/integrations/providers/instagram-provider";

const provider = new InstagramProvider();

export async function GET(req: Request) {
  return handleAuthorize(provider, req);
}

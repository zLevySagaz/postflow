import { handleAuthorize } from "@/integrations/oauth-route-handlers";
import { FacebookProvider } from "@/integrations/providers/facebook-provider";

const provider = new FacebookProvider();

export async function GET(req: Request) {
  return handleAuthorize(provider, req);
}

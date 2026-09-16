import { handleAuthorize } from "@/integrations/oauth-route-handlers";
import { LinkedInProvider } from "@/integrations/providers/linkedin-provider";

const provider = new LinkedInProvider();

export async function GET(req: Request) {
  return handleAuthorize(provider, req);
}

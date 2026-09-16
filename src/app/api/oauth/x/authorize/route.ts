import { handleAuthorize } from "@/integrations/oauth-route-handlers";
import { XProvider } from "@/integrations/providers/x-provider";

const provider = new XProvider();

export async function GET(req: Request) {
  return handleAuthorize(provider, req);
}

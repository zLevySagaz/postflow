import { handleCallback } from "@/integrations/oauth-route-handlers";
import { XProvider } from "@/integrations/providers/x-provider";

const provider = new XProvider();

export async function GET(req: Request) {
  return handleCallback(provider, req);
}

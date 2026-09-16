import { MOCK_MEDIA } from "@/lib/mock-data";
import type { MediaAsset } from "@/lib/types";

export async function listMedia(): Promise<MediaAsset[]> {
  await new Promise((r) => setTimeout(r, 150));
  return MOCK_MEDIA;
}

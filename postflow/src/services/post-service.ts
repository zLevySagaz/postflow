import { MOCK_POSTS } from "@/lib/mock-data";
import type { Post, PostStatus } from "@/lib/types";

// Camada de serviço: hoje lê/escreve em memória (ver PostsContext), mas a
// assinatura das funções já é assíncrona para virar uma chamada real de
// API/tRPC sem exigir mudança nos componentes que a consomem.

export async function listPosts(filter?: { status?: PostStatus }): Promise<Post[]> {
  await new Promise((r) => setTimeout(r, 150));
  if (!filter?.status) return MOCK_POSTS;
  return MOCK_POSTS.filter((p) => p.status === filter.status);
}

export function upcomingPosts(posts: Post[], limit = 5): Post[] {
  return posts
    .filter((p) => p.status === "SCHEDULED" && p.scheduledAt)
    .sort((a, b) => (a.scheduledAt! > b.scheduledAt! ? 1 : -1))
    .slice(0, limit);
}

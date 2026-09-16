"use client";

// Store mock compartilhado, em memória, entre as telas do dashboard.
// Faz o papel que uma chamada real a tRPC/REST + cache (ex. React Query)
// teria: os componentes só conhecem esta API, então trocar por dados reais
// depois é uma troca de implementação aqui dentro, não nas telas.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { MOCK_ACCOUNTS, MOCK_MEDIA, MOCK_POSTS } from "@/lib/mock-data";
import type { MediaAsset, Post, SocialAccount } from "@/lib/types";

interface AppStore {
  posts: Post[];
  accounts: SocialAccount[];
  media: MediaAsset[];
  createPost: (input: {
    content: string;
    accountIds: string[];
    mediaIds: string[];
    scheduledAt: string | null;
    timezone: string;
    status: "DRAFT" | "SCHEDULED";
  }) => Post;
  updatePost: (id: string, patch: Partial<Post>) => void;
  cancelPost: (id: string) => void;
  duplicatePost: (id: string) => void;
  reconnectAccount: (id: string) => void;
  disconnectAccount: (id: string) => void;
}

const AppStoreContext = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [accounts, setAccounts] = useState<SocialAccount[]>(MOCK_ACCOUNTS);
  const [media] = useState<MediaAsset[]>(MOCK_MEDIA);

  const createPost: AppStore["createPost"] = useCallback((input) => {
    const nowIso = new Date().toISOString();
    const newPost: Post = {
      id: `post_${Math.random().toString(36).slice(2, 9)}`,
      content: input.content,
      mediaIds: input.mediaIds,
      accountIds: input.accountIds,
      status: input.status,
      scheduledAt: input.scheduledAt,
      timezone: input.timezone,
      createdAt: nowIso,
      updatedAt: nowIso,
      platformResults: input.accountIds.map((accountId) => {
        const acc = MOCK_ACCOUNTS.find((a) => a.id === accountId);
        return {
          accountId,
          platform: acc?.platform ?? "INSTAGRAM",
          status: input.status === "DRAFT" ? "DRAFT" : "SCHEDULED",
        };
      }),
    };
    setPosts((prev) => [newPost, ...prev]);
    return newPost;
  }, []);

  const updatePost: AppStore["updatePost"] = useCallback((id, patch) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p
      )
    );
  }, []);

  const cancelPost: AppStore["cancelPost"] = useCallback((id) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "CANCELLED" } : p))
    );
  }, []);

  const duplicatePost: AppStore["duplicatePost"] = useCallback((id) => {
    setPosts((prev) => {
      const original = prev.find((p) => p.id === id);
      if (!original) return prev;
      const copy: Post = {
        ...original,
        id: `post_${Math.random().toString(36).slice(2, 9)}`,
        status: "DRAFT",
        scheduledAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return [copy, ...prev];
    });
  }, []);

  const reconnectAccount: AppStore["reconnectAccount"] = useCallback((id) => {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: "CONNECTED", lastSyncedAt: new Date().toISOString() }
          : a
      )
    );
  }, []);

  const disconnectAccount: AppStore["disconnectAccount"] = useCallback((id) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "DISCONNECTED" } : a))
    );
  }, []);

  const value = useMemo(
    () => ({
      posts,
      accounts,
      media,
      createPost,
      updatePost,
      cancelPost,
      duplicatePost,
      reconnectAccount,
      disconnectAccount,
    }),
    [posts, accounts, media, createPost, updatePost, cancelPost, duplicatePost, reconnectAccount, disconnectAccount]
  );

  return (
    <AppStoreContext.Provider value={value}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore(): AppStore {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore precisa estar dentro de AppStoreProvider");
  return ctx;
}

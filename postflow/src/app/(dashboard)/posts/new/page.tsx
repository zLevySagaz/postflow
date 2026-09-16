"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Hash, AtSign, Link as LinkIcon, Send, CalendarClock, Save } from "lucide-react";
import { useAppStore } from "@/context/app-store";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PlatformSelector } from "@/components/post-editor/platform-selector";
import { PlatformPreview } from "@/components/post-editor/platform-preview";
import { MediaPicker } from "@/components/post-editor/media-picker";
import { PLATFORM_LIMITS } from "@/integrations/platform-limits";

const TIMEZONES = [
  "America/Sao_Paulo",
  "America/Manaus",
  "America/New_York",
  "Europe/Lisbon",
  "UTC",
];

export default function NewPostPage() {
  const router = useRouter();
  const { accounts, media, createPost } = useAppStore();
  const { show } = useToast();

  const [content, setContent] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [submitting, setSubmitting] = useState<string | null>(null);

  const selectedAccountObjs = useMemo(
    () => accounts.filter((a) => selectedAccounts.includes(a.id)),
    [accounts, selectedAccounts]
  );

  const strictestLimit = useMemo(() => {
    if (selectedAccountObjs.length === 0) return null;
    return Math.min(...selectedAccountObjs.map((a) => PLATFORM_LIMITS[a.platform].maxChars));
  }, [selectedAccountObjs]);

  const incompatibleWarnings = useMemo(() => {
    if (selectedMedia.length === 0) return [];
    const hasVideo = selectedMedia.some(
      (id) => media.find((m) => m.id === id)?.type === "VIDEO"
    );
    const warnings: string[] = [];
    for (const acc of selectedAccountObjs) {
      const limits = PLATFORM_LIMITS[acc.platform];
      if (!limits.supportsImage && !hasVideo) {
        warnings.push(
          `${acc.platform === "TIKTOK" ? "TikTok" : "YouTube"} exige vídeo — não aceita apenas imagem.`
        );
      }
    }
    return warnings;
  }, [selectedMedia, selectedAccountObjs, media]);

  function toggleAccount(id: string) {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  function toggleMedia(id: string) {
    setSelectedMedia((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  function buildScheduledAt(): string | null {
    if (!date) return null;
    return new Date(`${date}T${time}:00`).toISOString();
  }

  function handleSave(status: "DRAFT" | "SCHEDULED") {
    if (!content.trim() && selectedMedia.length === 0) {
      show("Escreva um texto ou adicione mídia antes de salvar.", "error");
      return;
    }
    if (status === "SCHEDULED" && selectedAccounts.length === 0) {
      show("Selecione ao menos uma rede para agendar.", "error");
      return;
    }
    if (status === "SCHEDULED" && !date) {
      show("Escolha uma data para agendar a publicação.", "error");
      return;
    }

    setSubmitting(status);
    setTimeout(() => {
      createPost({
        content,
        accountIds: selectedAccounts,
        mediaIds: selectedMedia,
        scheduledAt: status === "SCHEDULED" ? buildScheduledAt() : null,
        timezone,
        status,
      });
      setSubmitting(null);
      show(
        status === "DRAFT" ? "Rascunho salvo." : "Post agendado com sucesso.",
        "success"
      );
      router.push(status === "SCHEDULED" ? "/calendar" : "/posts");
    }, 400);
  }

  function handlePublishNow() {
    if (selectedAccounts.length === 0) {
      show("Selecione ao menos uma rede para publicar.", "error");
      return;
    }
    // Fase 1: publicação real ainda não existe — ver src/integrations.
    show(
      "Publicação real ainda não está configurada nesta fase. Use Agendar ou Salvar rascunho.",
      "info"
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Criar post</h1>
        <p className="text-sm text-ink-muted">
          Escreva o conteúdo, escolha as redes e agende a publicação.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conteúdo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                rows={6}
                placeholder="O que você quer publicar?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-faint">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Hash size={12} /> hashtags
                  </span>
                  <span className="flex items-center gap-1">
                    <AtSign size={12} /> menções
                  </span>
                  <span className="flex items-center gap-1">
                    <LinkIcon size={12} /> link
                  </span>
                </div>
                <span className={strictestLimit && content.length > strictestLimit ? "text-state-danger" : ""}>
                  {content.length}
                  {strictestLimit ? ` / ${strictestLimit}` : ""} caracteres
                  {strictestLimit && ` (limite: ${selectedAccountObjs.find((a) => PLATFORM_LIMITS[a.platform].maxChars === strictestLimit)?.platform})`}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mídia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <MediaPicker media={media} selected={selectedMedia} onToggle={toggleMedia} />
              {incompatibleWarnings.map((w) => (
                <p key={w} className="text-xs text-state-warning">{w}</p>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Redes</CardTitle>
            </CardHeader>
            <CardContent>
              <PlatformSelector
                accounts={accounts}
                selected={selectedAccounts}
                onToggle={toggleAccount}
              />
              {accounts.some((a) => a.status !== "CONNECTED") && (
                <p className="mt-3 text-xs text-ink-faint">
                  Redes esmaecidas ainda não estão conectadas —{" "}
                  <a href="/accounts" className="text-accent-soft hover:underline">
                    conectar agora
                  </a>
                  .
                </p>
              )}
            </CardContent>
          </Card>

          {selectedAccountObjs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Prévia por rede</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
                  {selectedAccountObjs.map((acc) => (
                    <PlatformPreview
                      key={acc.id}
                      account={acc}
                      content={content}
                      hasMedia={selectedMedia.length > 0}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agendamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink-muted">Data</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink-muted">Horário</label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink-muted">Fuso horário</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="h-10 w-full rounded-md border border-surface-border bg-surface-raised px-3 text-sm text-ink outline-none focus:border-accent"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={handlePublishNow}
              variant="secondary"
              disabled={submitting !== null}
            >
              <Send size={15} />
              Publicar agora
            </Button>
            <Button
              className="w-full"
              onClick={() => handleSave("SCHEDULED")}
              disabled={submitting !== null}
            >
              <CalendarClock size={15} />
              {submitting === "SCHEDULED" ? "Agendando..." : "Agendar"}
            </Button>
            <Button
              className="w-full"
              variant="ghost"
              onClick={() => handleSave("DRAFT")}
              disabled={submitting !== null}
            >
              <Save size={15} />
              {submitting === "DRAFT" ? "Salvando..." : "Salvar rascunho"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

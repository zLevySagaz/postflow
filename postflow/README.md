# PostFlow

Plataforma de automação de redes sociais — conecte contas, crie conteúdo,
agende publicações, organize um calendário editorial e acompanhe métricas
em um único painel.

## Status deste código

- **Fase 1 (MVP visual)** — completa. Produto navegável de ponta a ponta
  com dados mockados no frontend.
- **Fase 2 (backend real)** — completa nesta entrega. OAuth real por
  rede, worker de publicação, autenticação, Stripe e storage de mídia
  implementados e prontos para credenciais reais.

### O que funciona de verdade agora

- **Autenticação real** via Auth.js (Credentials + Prisma Adapter),
  cadastro com hash de senha (bcrypt) em `/api/auth/signup`.
- **OAuth real** para as 6 redes (Instagram, Facebook, LinkedIn, X,
  TikTok, YouTube): `/api/oauth/[platform]/authorize` e `/callback`,
  troca de code por token, refresh, e tokens sempre cifrados
  (AES-256-GCM) antes de ir ao banco — ver `src/lib/crypto.ts`.
- **Publicação real** por plataforma em `src/integrations/providers/*`,
  chamando as APIs oficiais (Graph API, UGC Posts API, Tweets API,
  Content Posting API, YouTube Data API).
- **Worker de publicação** (`npm run worker`) via BullMQ + Redis,
  processando `Schedule`, com retry exponencial e idempotency key por
  post+conta.
- **Stripe real**: `/api/stripe/checkout` cria a sessão de assinatura,
  `/api/stripe/webhook` ativa o plano ao receber `checkout.session.completed`.
- **Upload de mídia real**: `/api/media/presign` gera URL pré-assinada
  S3-compatible; upload vai direto do navegador para o storage.
- API REST completa para posts, contas e mídia, com Prisma (`/api/posts`,
  `/api/accounts`, `/api/media`).

### O que ainda é intencionalmente simplificado

- **O frontend (`AppStoreProvider`) ainda lê de `src/lib/mock-data.ts`**,
  não das novas rotas `/api/*`. As telas e a API real já existem lado a
  lado; falta o passo de trocar o Context por chamadas fetch/SWR às
  rotas — mudança isolada, sem impacto na UI.
- **Upload de vídeo/imagem no LinkedIn**: o `ugcPosts` está implementado
  só com `shareMediaCategory: NONE/IMAGE`; falta o passo de
  `registerUpload` da Assets API para anexar o binário.
- **YouTube** usa upload multipart simples (arquivos pequenos); vídeos
  grandes precisam de upload resumable (`Content-Range`).
- **TikTok** publica em `privacy_level: SELF_ONLY` — apps não auditados
  pela TikTok não podem postar público; isso muda após a revisão do app.
- **Analytics real** tem os endpoints corretos para Instagram, Facebook
  e YouTube; LinkedIn e X exigem tiers de API pagos/aprovação de
  parceiro para métricas — os métodos lançam erro explicando isso.
- Nenhuma dessas integrações foi testada contra credenciais reais nesta
  sessão (sem acesso à internet no ambiente de geração) — revise contra
  a documentação oficial de cada plataforma antes de ir para produção,
  pois políticas de API mudam com frequência.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (componentes de UI próprios, no estilo shadcn/ui)
- Prisma + PostgreSQL
- Auth.js (NextAuth) + Prisma Adapter
- BullMQ + Redis (worker de publicação)
- Stripe (assinaturas)
- S3-compatible storage (upload pré-assinado)

## Estrutura de pastas

```
src/
  app/
    (auth)/login, signup
    (dashboard)/            dashboard, posts/new, calendar, accounts, media, settings
    api/
      auth/[...nextauth], auth/signup
      oauth/[instagram|facebook|linkedin|x|tiktok|youtube]/{authorize,callback}
      posts, posts/[id]
      accounts, accounts/[id]
      media, media/[id], media/presign
      stripe/checkout, stripe/webhook
      notifications
      workspace/me
  components/                UI, layout, dashboard, post-editor, calendar, accounts, media, settings
  context/                   AppStoreProvider — estado mock do frontend (ver observação acima)
  services/                  camada de serviço original (lê mock-data.ts)
  integrations/
    social-provider.ts       contrato SocialProvider
    platform-limits.ts       limites e metadados por rede
    provider-registry.ts     ponto único de acesso a um provider
    oauth-utils.ts           state assinado (HMAC) + PKCE
    oauth-route-handlers.ts  handlers genéricos de authorize/callback
    providers/                implementação real por rede
  lib/
    prisma.ts crypto.ts auth.ts stripe.ts storage.ts queue.ts
    types.ts mock-data.ts utils.ts
  workers/
    publish-worker.ts        processo separado (BullMQ)
prisma/
  schema.prisma              modelo de dados completo
  seed.ts                    popula os planos (Free/Starter/Pro/Agency)
```

## Rodando localmente

```bash
npm install
cp .env.example .env
# preencha DATABASE_URL, NEXTAUTH_SECRET, TOKEN_ENCRYPTION_KEY no mínimo

npm run db:push     # cria as tabelas a partir do schema.prisma
npm run db:seed     # popula os planos

npm run dev          # app em http://localhost:3000
npm run worker       # em outro terminal — processa publicações agendadas (precisa de Redis)
```

> O frontend continua navegável mesmo sem nenhuma credencial de rede
> social configurada — cada integração detecta a ausência da variável
> de ambiente e retorna "Integração não configurada" em vez de quebrar.

## Deploy

- **Frontend/App**: Vercel, com as variáveis de `.env.example`
  configuradas no projeto (Settings → Environment Variables).
- **Worker**: processo Node de longa duração separado do Next.js — não
  roda em Vercel serverless. Use Railway, Render, Fly.io ou um
  container próprio.
- **Banco**: Neon ou Supabase (Postgres gerenciado).
- **Redis**: Upstash Redis (compatível com BullMQ).
- **Storage de mídia**: qualquer S3-compatible (S3, Cloudflare R2,
  Supabase Storage).
- **Stripe**: configure o endpoint do webhook em
  `https://seu-dominio.com/api/stripe/webhook` no dashboard do Stripe.

## Próximos passos sugeridos

1. Trocar `AppStoreProvider` para consumir `/api/posts`, `/api/accounts`
   e `/api/media` em vez de `mock-data.ts` (dados passam a ser reais
   assim que o banco estiver populado via essas rotas).
2. Completar upload de mídia real no LinkedIn (Assets API) e upload
   resumable no YouTube.
3. Testes automatizados (unitários nos providers com mocks de fetch,
   e2e no fluxo de agendamento).
4. Observabilidade: logs estruturados no worker, error tracking (Sentry
   ou similar), painel de histórico de jobs do BullMQ (Bull Board).
5. RBAC de fato aplicado nas rotas de API (hoje as rotas confiam no
   `workspaceId` do body/query — falta checar se o usuário autenticado
   pertence àquele workspace e tem o papel necessário em cada endpoint).

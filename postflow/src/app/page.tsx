import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Image as ImageIcon,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  BarChart3,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Conecte suas redes",
    desc: "Instagram, Facebook, LinkedIn, X, TikTok e YouTube em um único lugar, com OAuth oficial de cada plataforma.",
  },
  {
    n: "02",
    title: "Crie uma vez, adapte para cada rede",
    desc: "Escreva o conteúdo, adicione mídia e veja a prévia exata de como fica em cada plataforma antes de publicar.",
  },
  {
    n: "03",
    title: "Agende e acompanhe",
    desc: "Escolha data, horário e fuso. Acompanhe tudo num calendário editorial e veja o resultado nas métricas.",
  },
];

const FEATURES = [
  {
    icon: CalendarDays,
    title: "Calendário editorial",
    desc: "Visualize por mês, semana ou dia. Arraste um post para outro horário e o agendamento se atualiza.",
  },
  {
    icon: ImageIcon,
    title: "Biblioteca de mídia",
    desc: "Organize imagens e vídeos por pasta e tag, com busca rápida na hora de montar um post.",
  },
  {
    icon: BarChart3,
    title: "Métricas por rede",
    desc: "Impressões, alcance, curtidas, comentários e crescimento de seguidores, filtrados por período.",
  },
];

const PLANS = [
  { name: "Free", price: "R$ 0", accounts: "1 rede", posts: "10 posts/mês", users: "1 usuário" },
  { name: "Starter", price: "R$ 49", accounts: "3 redes", posts: "60 posts/mês", users: "2 usuários" },
  { name: "Pro", price: "R$ 129", accounts: "6 redes", posts: "Ilimitado", users: "5 usuários", highlight: true },
  { name: "Agency", price: "R$ 349", accounts: "6 redes", posts: "Ilimitado", users: "Ilimitado" },
];

const FAQ = [
  {
    q: "Preciso instalar algo para publicar nas redes?",
    a: "Não. A conexão é feita por login oficial (OAuth) de cada plataforma — o PostFlow nunca pede ou guarda sua senha.",
  },
  {
    q: "O que acontece se uma rede não aceitar um tipo de post?",
    a: "Avisamos antes de você agendar e sugerimos um formato compatível com aquela plataforma.",
  },
  {
    q: "Dá para cancelar quando quiser?",
    a: "Sim, o plano é mensal e sem fidelidade — você cancela direto nas configurações.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-base text-ink">
      <SiteNav />
      <Hero />
      <LogosStrip />
      <HowItWorks />
      <Features />
      <CalendarShowcase />
      <Analytics />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
    </div>
  );
}

function SiteNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-surface-border/60 bg-base/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-accent" />
          <span className="text-[15px] font-semibold tracking-tight">PostFlow</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-ink-muted md:flex">
          <a href="#como-funciona" className="hover:text-ink">Como funciona</a>
          <a href="#recursos" className="hover:text-ink">Recursos</a>
          <a href="#precos" className="hover:text-ink">Preços</a>
          <a href="#faq" className="hover:text-ink">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-ink-muted hover:text-ink">
            Entrar
          </Link>
          <Link href="/signup">
            <Button size="sm">Criar conta</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl gap-14 px-5 pb-20 pt-16 md:grid-cols-2 md:items-center md:pt-24">
      <div>
        <h1 className="font-display text-[2.6rem] leading-[1.08] tracking-tight text-ink sm:text-5xl">
          Automatize suas redes sociais. Publique mais. Trabalhe menos.
        </h1>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-muted">
          Conecte suas contas, crie conteúdo, agende publicações e organize
          seu calendário editorial em um único painel — sem trocar de aba
          seis vezes por post.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto">
              Começar de graça
              <ArrowRight size={16} />
            </Button>
          </Link>
          <a href="#como-funciona">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Ver como funciona
            </Button>
          </a>
        </div>
        <p className="mt-4 text-xs text-ink-faint">
          Sem cartão de crédito. Cancele quando quiser.
        </p>
      </div>

      <ComposerMock />
    </section>
  );
}

function ComposerMock() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[28px] bg-gradient-to-br from-accent/15 via-transparent to-transparent blur-2xl" />
      <div className="rounded-xl border border-surface-border bg-surface p-4 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <span className="text-xs font-medium text-ink-muted">Novo post</span>
          <div className="flex gap-1.5">
            <Instagram size={14} className="text-ink-muted" />
            <Linkedin size={14} className="text-ink-muted" />
            <Facebook size={14} className="text-ink-faint" />
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink">
          Nova funcionalidade no ar 🚀 Agora você agenda posts para 6 redes
          de uma vez só.
        </p>
        <div className="mt-3 h-28 rounded-md bg-surface-raised" />
        <div className="mt-4 flex items-center justify-between text-xs text-ink-faint">
          <span>Qui, 17 set · 09:00 · America/Sao_Paulo</span>
          <span className="rounded bg-accent/10 px-2 py-1 font-medium text-accent-soft">
            Agendado
          </span>
        </div>
      </div>
    </div>
  );
}

function LogosStrip() {
  const items = [Instagram, Facebook, Linkedin, Youtube];
  return (
    <section className="border-y border-surface-border/60 py-6">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-10 px-5 text-ink-faint sm:gap-16">
        {items.map((Icon, i) => (
          <Icon key={i} size={20} strokeWidth={1.5} />
        ))}
        <span className="hidden text-xs sm:inline">X · TikTok também</span>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl px-5 py-24">
      <h2 className="font-display text-3xl text-ink">Como funciona</h2>
      <div className="mt-10 grid gap-8 sm:grid-cols-3">
        {HOW_IT_WORKS.map((step) => (
          <div key={step.n}>
            <span className="text-sm text-accent-soft">{step.n}</span>
            <h3 className="mt-3 text-[15px] font-medium text-ink">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="recursos" className="border-t border-surface-border/60 bg-surface/40 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="font-display text-3xl text-ink">Tudo o que você precisa para publicar</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-lg border border-surface-border bg-surface p-6">
              <f.icon size={20} className="text-accent-soft" strokeWidth={1.75} />
              <h3 className="mt-4 text-[15px] font-medium text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CalendarShowcase() {
  const days = Array.from({ length: 28 });
  const filled = new Set([2, 6, 11, 14, 18, 23, 25]);
  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl text-ink">
            Seu calendário editorial, de verdade
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-muted">
            Veja mês, semana ou dia. Arraste um post para outro horário e o
            agendamento é atualizado automaticamente — sem precisar reabrir
            o editor.
          </p>
        </div>
        <div className="rounded-lg border border-surface-border bg-surface p-5">
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((_, i) => (
              <div
                key={i}
                className={`aspect-square rounded ${
                  filled.has(i) ? "bg-accent/70" : "bg-surface-raised"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Analytics() {
  const bars = [40, 65, 50, 80, 55, 90, 70];
  return (
    <section className="border-t border-surface-border/60 bg-surface/40 py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 md:grid-cols-2">
        <div className="order-2 rounded-lg border border-surface-border bg-surface p-6 md:order-1">
          <div className="flex h-40 items-end gap-2">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-accent/60" style={{ height: `${h}%` }} />
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-faint">Alcance nos últimos 7 dias</p>
        </div>
        <div className="order-1 md:order-2">
          <h2 className="font-display text-3xl text-ink">Métricas sem planilha</h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-muted">
            Impressões, alcance, curtidas, comentários, compartilhamentos e
            crescimento de seguidores — por rede e por período, num só lugar.
          </p>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="precos" className="mx-auto max-w-6xl px-5 py-24">
      <h2 className="font-display text-3xl text-ink">Preços</h2>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-lg border p-6 ${
              plan.highlight
                ? "border-accent bg-accent/5"
                : "border-surface-border bg-surface"
            }`}
          >
            <p className="text-sm font-medium text-ink">{plan.name}</p>
            <p className="mt-3 text-2xl font-semibold text-ink">
              {plan.price}
              <span className="text-sm font-normal text-ink-faint">/mês</span>
            </p>
            <ul className="mt-5 space-y-2 text-sm text-ink-muted">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-accent-soft" /> {plan.accounts}
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-accent-soft" /> {plan.posts}
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-accent-soft" /> {plan.users}
              </li>
            </ul>
            <Link href="/signup" className="mt-6 block">
              <Button
                variant={plan.highlight ? "primary" : "secondary"}
                className="w-full"
                size="sm"
              >
                Escolher {plan.name}
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="border-t border-surface-border/60 py-24">
      <div className="mx-auto max-w-3xl px-5">
        <h2 className="font-display text-3xl text-ink">Perguntas frequentes</h2>
        <div className="mt-8 divide-y divide-surface-border">
          {FAQ.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-medium text-ink">
                {item.q}
                <span className="text-ink-faint transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="border-t border-surface-border/60 py-24">
      <div className="mx-auto max-w-2xl px-5 text-center">
        <h2 className="font-display text-3xl text-ink">
          Pronto para publicar sem fricção?
        </h2>
        <p className="mt-3 text-[15px] text-ink-muted">
          Crie sua conta e conecte a primeira rede em poucos minutos.
        </p>
        <Link href="/signup" className="mt-7 inline-block">
          <Button size="lg">
            Começar de graça
            <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-surface-border/60 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 text-xs text-ink-faint sm:flex-row">
        <span>© 2026 PostFlow. Todos os direitos reservados.</span>
        <div className="flex gap-5">
          <a href="#" className="hover:text-ink-muted">Privacidade</a>
          <a href="#" className="hover:text-ink-muted">Termos</a>
          <a href="#" className="hover:text-ink-muted">Contato</a>
        </div>
      </div>
    </footer>
  );
}

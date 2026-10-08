import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser, gateFor } from "@/lib/session";
import { Logo } from "@/components/logo";
import { ArrowRight, IdentificationCard, ChatsCircle, HandArrowDown } from "@phosphor-icons/react/dist/ssr";

// Placeholder photography until the team supplies real campus shots.
const HERO_IMG = "https://picsum.photos/seed/pass2u-dorm-desk/960/1200";
const SIDE_IMG = "https://picsum.photos/seed/pass2u-textbooks/800/600";

const steps = [
  {
    icon: IdentificationCard,
    title: "Sign up, then show your card",
    body: "Any email works. Upload a photo of your physical FPT student card and an admin checks it. The photo is deleted after review.",
  },
  {
    icon: ChatsCircle,
    title: "Message the seller",
    body: "Ask about the item, agree on a price or a swap, and reserve it so nobody else grabs it.",
  },
  {
    icon: HandArrowDown,
    title: "Meet on campus",
    body: "Hand it over in person at the library or the canteen. Nothing is paid through PASS2U.",
  },
];

export default async function Landing() {
  const u = await getUser();
  if (u) redirect(gateFor(u) ?? (u.role === "admin" ? "/admin" : "/market"));

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-1">
          <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link href="/signup" className="btn btn-primary btn-sm">Join PASS2U</Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-8 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-14 md:pb-24 md:pt-14">
          <div className="rise">
            <p className="text-sm font-semibold text-accent-ink">For verified FPT University students</p>
            <h1 className="mt-4 max-w-[13ch] text-[clamp(2.5rem,6.2vw,4.75rem)] font-bold leading-[1.02] tracking-[-0.035em]">
              Your seniors&rsquo; stuff, at student prices.
            </h1>
            <p className="mt-6 max-w-[40ch] text-lg leading-relaxed text-ink-2">
              Buy, swap, or pick up free textbooks, fans and dorm gear from students on your own campus.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="btn btn-primary group !min-h-12 !px-6 text-base">
                Create your account
                <ArrowRight size={18} weight="bold" className="transition-transform duration-200 ease-[var(--ease-out)] [@media(hover:hover)]:group-hover:translate-x-0.5" />
              </Link>
              <Link href="/login" className="btn btn-ghost !min-h-12 text-base">I already have one</Link>
            </div>
          </div>

          <div className="rise relative" style={{ animationDelay: "90ms" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HERO_IMG}
              alt="A student desk with books and a lamp"
              width={960}
              height={1200}
              className="aspect-[4/5] w-full rounded-lg bg-sunken object-cover md:aspect-[4/4.6]"
            />
            <div className="absolute -bottom-6 left-4 right-4 flex items-center justify-between gap-4 rounded-md border border-line bg-raised px-4 py-3 shadow-[0_8px_24px_-12px_oklch(0.3_0.02_42/0.35)] sm:left-auto sm:right-6 sm:w-72">
              <div>
                <p className="text-sm font-semibold">Free to a good home</p>
                <p className="text-sm text-ink-3">Seniors give away what they no longer need</p>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="how" className="border-t border-line bg-sunken/60">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[0.8fr_1.2fr] md:gap-16 md:py-24">
            <div>
              <h2 id="how" className="text-[clamp(1.75rem,3.4vw,2.5rem)] font-bold">How it works</h2>
              <p className="mt-3 max-w-[34ch] text-ink-2">Three steps from signing up to holding the item.</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={SIDE_IMG}
                alt="A stack of used textbooks"
                width={800}
                height={600}
                loading="lazy"
                className="mt-8 hidden aspect-[4/3] w-full rounded-lg bg-sunken object-cover md:block"
              />
            </div>
            <ol className="space-y-10">
              {steps.map(({ icon: Icon, title, body }) => (
                <li key={title} className="grid grid-cols-[auto_1fr] gap-x-5">
                  <span className="grid size-12 place-items-center rounded-md bg-raised text-accent-ink ring-1 ring-line">
                    <Icon size={24} />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="mt-1.5 max-w-[52ch] leading-relaxed text-ink-2">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <h2 className="max-w-[18ch] text-[clamp(1.75rem,3.4vw,2.5rem)] font-bold">
              Starting at FPT this year? Your first semester just got cheaper.
            </h2>
            <Link href="/signup" className="btn btn-primary !min-h-12 !px-6 text-base">Join PASS2U</Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-6 text-sm text-ink-3 sm:px-6">
          <span>PASS2U, a student project at FPT University</span>
          <span>Not affiliated with FPT Education</span>
        </div>
      </footer>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser, gateFor } from "@/lib/session";
import { Logo } from "@/components/logo";

export default async function Landing() {
  const u = await getUser();
  if (u) redirect(gateFor(u) ?? (u.role === "admin" ? "/admin" : "/market"));

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link href="/signup" className="btn btn-primary btn-sm">Join PASS2U</Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">
        <section className="grid gap-10 pb-16 pt-12 md:grid-cols-[1.1fr_0.9fr] md:items-end md:pt-20">
          <div className="rise">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent-ink">
              Only for verified FPT University students
            </p>
            <h1 className="max-w-[14ch] text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.035em]">
              Your seniors&rsquo; stuff, at student prices.
            </h1>
            <p className="mt-6 max-w-[44ch] text-lg text-ink-2">
              Buy, swap, or pick up free textbooks, fans, and dorm gear from students on your own campus.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-primary !min-h-12 !px-6 text-base">Create your account</Link>
              <Link href="/login" className="btn btn-secondary !min-h-12 !px-6 text-base">I already have one</Link>
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line text-center md:mb-2">
            {[
              ["Sell", "Name your price in đồng"],
              ["Swap", "Trade what you have"],
              ["Give", "Pass it on for free"],
            ].map(([t, d]) => (
              <div key={t} className="bg-bg px-3 py-6">
                <dt className="text-2xl font-bold tracking-tight">{t}</dt>
                <dd className="mt-1 text-sm text-ink-3">{d}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="border-t border-line py-14" aria-labelledby="how">
          <h2 id="how" className="text-2xl font-bold">How it works</h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3 md:gap-10">
            {[
              ["Sign up with any email", "New students often don't have an FPT email yet, so a personal one works."],
              ["Show your student ID", "Upload a photo of your physical card. An admin checks it, usually within a day, and the photo is deleted afterwards."],
              ["Meet on campus", "Chat with the seller, reserve the item, and hand it over in person. No payments go through PASS2U."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-line-strong text-sm font-semibold tabular-nums">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{t}</h3>
                  <p className="mt-1.5 text-ink-2">{d}</p>
                </div>
              </li>
            ))}
          </ol>
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

import { Logo } from "@/components/logo";

export function AuthFrame({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
        <Logo />
      </header>
      <main className="flex flex-1 justify-center px-4 pb-16 pt-8 sm:pt-16">
        <div className="rise w-full max-w-[400px]">
          <h1 className="font-serif text-[2.25rem] font-normal leading-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-ink-2">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}

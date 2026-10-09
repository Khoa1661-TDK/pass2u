import { Logo } from "@/components/logo";
import { logout } from "@/app/actions/auth";

export default function GateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <form action={logout}>
          <button className="btn btn-ghost btn-sm">Đăng xuất</button>
        </form>
      </header>
      <main className="flex flex-1 justify-center px-4 pb-16 pt-8 sm:pt-14">
        <div className="rise w-full max-w-[460px]">{children}</div>
      </main>
    </div>
  );
}

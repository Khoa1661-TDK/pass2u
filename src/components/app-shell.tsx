import Link from "next/link";
import type { User } from "@/lib/schema";
import { logout } from "@/app/actions/auth";
import { Logo } from "./logo";
import { Avatar } from "./avatar";
import { ChatIcon, GridIcon, PlusIcon, SearchIcon, UserIcon, ShieldIcon } from "./icons";
import { NavLink } from "./nav-link";

export function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Logo href="/market" />
          <form action="/market" className="relative ml-2 hidden flex-1 md:block md:max-w-md">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <label htmlFor="global-q" className="sr-only">Search listings</label>
            <input id="global-q" name="q" placeholder="Search textbooks, fans, laptops…" className="input !min-h-10 !rounded-full pl-10" />
          </form>
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {user.role === "admin" && (
              <Link href="/admin" className="btn btn-ghost btn-sm"><ShieldIcon width={18} />Admin</Link>
            )}
            <Link href="/inbox" className="btn btn-ghost btn-sm"><ChatIcon width={18} />Inbox</Link>
            <Link href="/listings/new" className="btn btn-primary btn-sm"><PlusIcon width={18} />Post an item</Link>
            <details className="relative ml-1">
              <summary className="flex cursor-pointer list-none rounded-full" aria-label="Account menu">
                <Avatar name={user.displayName} />
              </summary>
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg border border-line bg-raised p-1.5 shadow-[0_12px_32px_-12px_oklch(0.3_0.02_50/0.25)]">
                <p className="truncate px-3 pb-2 pt-1.5 text-sm text-ink-3">{user.email}</p>
                <Link href="/me" className="block rounded-md px-3 py-2 text-sm hover:bg-sunken">My listings</Link>
                <Link href={`/u/${user.id}`} className="block rounded-md px-3 py-2 text-sm hover:bg-sunken">Public profile</Link>
                <Link href="/me/settings" className="block rounded-md px-3 py-2 text-sm hover:bg-sunken">Settings</Link>
                <form action={logout}>
                  <button className="w-full rounded-md px-3 py-2 text-left text-sm text-danger hover:bg-danger-soft">Sign out</button>
                </form>
              </div>
            </details>
          </nav>
          <Link href="/market?focus=search" className="btn btn-ghost btn-sm ml-auto md:hidden" aria-label="Search">
            <SearchIcon />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6 md:pb-16">{children}</main>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <NavLink href="/market" icon={<GridIcon />} label="Browse" />
        <NavLink href="/listings/new" icon={<PlusIcon />} label="Post" />
        <NavLink href="/inbox" icon={<ChatIcon />} label="Inbox" />
        <NavLink href={user.role === "admin" ? "/admin" : "/me"} icon={user.role === "admin" ? <ShieldIcon /> : <UserIcon />} label={user.role === "admin" ? "Admin" : "Me"} />
      </nav>
    </div>
  );
}

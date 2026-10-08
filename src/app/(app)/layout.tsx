import { requireApproved } from "@/lib/session";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireApproved();
  return <AppShell user={user}>{children}</AppShell>;
}

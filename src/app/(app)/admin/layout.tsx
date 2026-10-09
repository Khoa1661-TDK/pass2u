import { requireAdmin } from "@/lib/session";
import { AdminTabs } from "./tabs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div>
      <h1 className="text-[28px] font-bold">Quản trị</h1>
      <AdminTabs />
      <div className="mt-6">{children}</div>
    </div>
  );
}

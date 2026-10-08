import Link from "next/link";
import { desc, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { requireAdmin } from "@/lib/session";
import { setBanned } from "@/app/actions/admin";
import { SubmitButton } from "@/components/ui";

export const dynamic = "force-dynamic";

const statusTag: Record<string, string> = {
  approved: "bg-ok-soft text-ok",
  pending: "bg-warn-soft text-warn",
  rejected: "bg-danger-soft text-danger",
  none: "bg-sunken text-ink-2",
};

export default async function Students({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const me = await requireAdmin();
  const { q } = await searchParams;
  const term = q ? `%${q}%` : null;
  const rows = await db
    .select()
    .from(users)
    .where(term ? or(ilike(users.displayName, term), ilike(users.email, term), ilike(users.studentCode, term)) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(100);
  return (
    <div>
      <form className="max-w-sm">
        <label htmlFor="uq" className="sr-only">Search students</label>
        <input id="uq" name="q" defaultValue={q} placeholder="Search name, email, or student code" className="input" />
      </form>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-ink-3">
            <tr><th className="py-2 pr-4 font-medium">Name</th><th className="py-2 pr-4 font-medium">Code</th><th className="py-2 pr-4 font-medium">Email</th><th className="py-2 pr-4 font-medium">Status</th><th className="py-2" /></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="py-3 pr-4"><Link href={`/u/${u.id}`} className="font-medium hover:underline">{u.displayName}</Link>{u.role === "admin" && <span className="tag ml-2 bg-ink text-bg">Admin</span>}</td>
                <td className="py-3 pr-4 font-mono">{u.studentCode ?? "None"}</td>
                <td className="py-3 pr-4 text-ink-2">{u.email}{!u.emailVerifiedAt && <span className="text-ink-3"> (unconfirmed)</span>}</td>
                <td className="py-3 pr-4">
                  {u.bannedAt ? <span className="tag bg-danger text-white">Suspended</span> : <span className={`tag ${statusTag[u.verificationStatus]}`}>{u.verificationStatus}</span>}
                </td>
                <td className="py-3 text-right">
                  {u.id !== me.id && u.role !== "admin" && (
                    <form action={setBanned.bind(null, u.id, !u.bannedAt)}>
                      <SubmitButton className={u.bannedAt ? "btn btn-secondary btn-sm" : "btn btn-danger btn-sm"}>{u.bannedAt ? "Restore" : "Suspend"}</SubmitButton>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

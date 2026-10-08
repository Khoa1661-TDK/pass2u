import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { requireApproved } from "@/lib/session";
import { listingsBySeller } from "@/lib/queries";
import { ListingGrid } from "@/components/listing-card";
import { Avatar } from "@/components/avatar";
import { CheckBadge } from "@/components/icons";

export default async function Profile({ params }: { params: Promise<{ id: string }> }) {
  await requireApproved();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [u] = await db.select().from(users).where(eq(users.id, id));
  if (!u || u.bannedAt) notFound();
  const [active, done] = await Promise.all([listingsBySeller(id, ["available", "reserved"]), listingsBySeller(id, ["completed"])]);
  return (
    <div>
      <header className="flex items-center gap-4">
        <Avatar name={u.displayName} size={64} />
        <div>
          <h1 className="flex items-center gap-2 text-[26px] font-bold">
            {u.displayName}
            {u.verificationStatus === "approved" && <CheckBadge width={22} height={22} className="text-accent" aria-label="Verified FPT student" />}
          </h1>
          <p className="text-ink-3">
            {u.verificationStatus === "approved" ? "Verified FPT student" : u.role === "admin" ? "PASS2U admin" : "Student"}
            {u.campus ? ` · ${u.campus}` : ""} · {done.length} completed
          </p>
        </div>
      </header>
      {u.bio && <p className="mt-5 max-w-prose text-ink-2">{u.bio}</p>}
      <h2 className="mt-10 text-lg font-semibold">Active listings</h2>
      <div className="mt-4">{active.length ? <ListingGrid items={active} /> : <p className="text-ink-3">Nothing listed right now.</p>}</div>
      {done.length > 0 && (
        <>
          <h2 className="mt-12 text-lg font-semibold">Completed</h2>
          <div className="mt-4"><ListingGrid items={done} /></div>
        </>
      )}
    </div>
  );
}

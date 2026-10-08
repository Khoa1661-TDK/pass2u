import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { listings, listingImages } from "@/lib/schema";
import { requireApproved } from "@/lib/session";
import { updateListing } from "@/app/actions/listings";
import { ListingForm } from "@/components/listing-form";

export const metadata = { title: "Edit listing" };

export default async function EditListing({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireApproved();
  const { id } = await params;
  const [l] = await db.select().from(listings).where(and(eq(listings.id, id), eq(listings.sellerId, u.id)));
  if (!l || l.status === "removed") notFound();
  const imgs = await db.select({ id: listingImages.id, url: listingImages.url }).from(listingImages).where(eq(listingImages.listingId, id)).orderBy(asc(listingImages.position));
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-[28px] font-bold">Edit listing</h1>
      <div className="mt-8">
        <ListingForm
          action={updateListing.bind(null, id)}
          existing={imgs}
          submitLabel="Save changes"
          defaults={{
            title: l.title,
            description: l.description,
            category: l.category,
            condition: l.condition,
            type: l.type,
            price: l.price ? String(l.price) : "",
            exchangeFor: l.exchangeFor ?? "",
          }}
        />
      </div>
    </div>
  );
}

import { requireApproved } from "@/lib/session";
import { createListing } from "@/app/actions/listings";
import { ListingForm } from "@/components/listing-form";

export const metadata = { title: "Post an item" };

export default async function NewListing() {
  await requireApproved();
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-[28px] font-bold">Post an item</h1>
      <p className="mt-1 text-ink-2">Sell it, swap it, or give it to someone who needs it.</p>
      <div className="mt-8">
        <ListingForm action={createListing} submitLabel="Publish listing" />
      </div>
    </div>
  );
}

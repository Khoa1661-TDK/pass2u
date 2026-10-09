import { requireApproved } from "@/lib/session";
import { createListing } from "@/app/actions/listings";
import { ListingForm } from "@/components/listing-form";

export const metadata = { title: "Đăng món" };

export default async function NewListing() {
  await requireApproved();
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-[28px] font-bold">Đăng món</h1>
      <p className="mt-1 text-ink-2">Bán, trao đổi hoặc tặng miễn phí cho người cần.</p>
      <div className="mt-8">
        <ListingForm action={createListing} submitLabel="Đăng tin" />
      </div>
    </div>
  );
}

"use server";

import { requireApproved } from "@/lib/session";
import { listingPage, type ListingFilters } from "@/lib/queries";

export async function moreListings(f: ListingFilters, offset: number) {
  await requireApproved();
  return listingPage(f, Math.max(0, Math.floor(offset) || 0));
}

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[60dvh] place-items-center px-4 text-center">
      <div>
        <h1 className="text-[28px] font-bold">This page isn&rsquo;t here</h1>
        <p className="mt-2 text-ink-2">The listing may have been deleted or the link is wrong.</p>
        <Link href="/market" className="btn btn-primary mt-6">Back to browsing</Link>
      </div>
    </main>
  );
}

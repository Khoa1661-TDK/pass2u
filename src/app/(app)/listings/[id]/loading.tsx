export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Đang tải tin đăng" className="grid animate-pulse gap-6 motion-reduce:animate-none md:grid-cols-[1.1fr_0.9fr] md:gap-10">
      <div className="aspect-[4/5] rounded-lg bg-sunken" />
      <div>
        <div className="h-8 w-32 rounded-md bg-sunken" />
        <div className="mt-3 h-6 w-3/4 rounded bg-sunken" />
        <div className="mt-6 h-12 rounded-md bg-sunken" />
        <div className="mt-8 space-y-2">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-4 rounded bg-sunken" />)}
        </div>
      </div>
    </div>
  );
}

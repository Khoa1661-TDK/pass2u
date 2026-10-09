export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Đang tải tin đăng">
      <div className="h-7 w-28 rounded-md bg-sunken" />
      <div className="mt-4 h-11 rounded-full bg-sunken md:w-24" />
      <div className="mt-3 flex gap-2">
        {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-9 w-20 shrink-0 rounded-full bg-sunken" />)}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <div className="aspect-[4/5] animate-pulse rounded-lg bg-sunken motion-reduce:animate-none" />
            <div className="mt-2.5 h-4 w-20 rounded bg-sunken" />
            <div className="mt-2 h-4 w-32 rounded bg-sunken" />
          </div>
        ))}
      </div>
    </div>
  );
}

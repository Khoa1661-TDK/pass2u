// Generic skeleton for app screens without their own loading state.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse motion-reduce:animate-none">
      <div className="h-7 w-40 rounded-md bg-sunken" />
      <div className="mt-3 h-4 w-64 max-w-full rounded bg-sunken" />
      <div className="mt-8 space-y-3">
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-16 rounded-lg bg-sunken" />)}
      </div>
    </div>
  );
}

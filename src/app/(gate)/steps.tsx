const steps = ["Account", "Email", "Student ID", "Approved"];

export function Steps({ current }: { current: number }) {
  return (
    <ol className="mb-8 flex items-center gap-2 text-xs font-medium text-ink-3" aria-label="Sign-up progress">
      {steps.map((s, i) => (
        <li key={s} className="flex flex-1 flex-col gap-2" aria-current={i === current ? "step" : undefined}>
          <span className={`h-1 rounded-full ${i < current ? "bg-accent" : i === current ? "bg-accent/45" : "bg-line"}`} />
          <span className={i === current ? "text-ink" : undefined}>{s}</span>
        </li>
      ))}
    </ol>
  );
}

const tones = ["oklch(0.9 0.05 42)", "oklch(0.9 0.05 155)", "oklch(0.9 0.05 250)", "oklch(0.9 0.06 85)", "oklch(0.9 0.05 330)"];

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  const tone = tones[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % tones.length];
  return (
    <span
      aria-hidden
      className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-ink"
      style={{ width: size, height: size, background: tone, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

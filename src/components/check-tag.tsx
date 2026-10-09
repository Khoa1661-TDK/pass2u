// Green when the check passed, red when it failed, grey when it couldn't run.
export function CheckTag({ ok, label }: { ok: boolean | null; label: string }) {
  const tone = ok === true ? "bg-ok-soft text-ok" : ok === false ? "bg-danger-soft text-danger" : "bg-sunken text-ink-3";
  return <li className={`tag ${tone}`}>{label}</li>;
}

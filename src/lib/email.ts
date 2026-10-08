import "server-only";

export async function sendEmail(to: string, subject: string, html: string, fallbackText: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email] to=${to} subject="${subject}"\n${fallbackText}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "PASS2U <onboarding@resend.dev>", to, subject, html }),
  });
  if (!res.ok) console.error("[email] send failed", res.status, await res.text());
}

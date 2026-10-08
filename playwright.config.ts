import { defineConfig, devices } from "@playwright/test";

// Run against a server started with `npm run build && npm start > next.log`.
// Confirmation links are read from that log (no RESEND_API_KEY in test).
export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  // Card OCR is CPU-heavy on one local server; keep parallel load modest.
  workers: 2,
  use: {
    launchOptions: {
      ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}),
      // Fake camera so the ID scanner can be tested.
      args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
    },
    baseURL: process.env.BASE_URL ?? "http://localhost:3000", trace: "retain-on-failure" },
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"] } }],
});

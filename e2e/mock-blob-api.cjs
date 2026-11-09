// Mock of the Vercel Blob API for e2e/blob-private-error.spec.ts. Answers every
// request with the exact JSON body behind the production incident: the SDK
// turns it into "Vercel Blob: Cannot use public access on a private store…".
// Run it, then start the app pointing the SDK at it:
//   node e2e/mock-blob-api.cjs &
//   VERCEL_BLOB_API_URL=http://127.0.0.1:4555 BLOB_READ_WRITE_TOKEN=blobur_us1_0_st001_mock npm run dev
const http = require("http");

http
  .createServer((req, res) => {
    req.on("data", () => {}); // drain the upload body so the client doesn't stall
    req.on("end", () => {
      console.log(new Date().toISOString(), req.method, req.url, "-> 400 private-store mismatch");
      res.writeHead(400, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          error: {
            code: "bad_request",
            message:
              "Cannot use public access on a private store. The store is configured with private access.",
          },
        }),
      );
    });
  })
  .listen(4555, "127.0.0.1", () => console.log("[mock-blob] listening on 127.0.0.1:4555"));

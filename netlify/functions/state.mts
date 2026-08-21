import { getStore, getDeployStore } from "@netlify/blobs";

// Non-production deploys (branch/preview) use a deploy-scoped store so
// test data never lands in the same store as real production data.
function getBlobStore() {
  const isProd = Netlify?.context?.deploy?.context === "production";
  const opts = { name: "ascension-codex-state", consistency: "strong" };
  return isProd ? getStore(opts) : getDeployStore(opts);
}

export default async (req) => {
  const store = getBlobStore();

  if (req.method === "GET") {
    const data = await store.get("state", { type: "json" });
    return new Response(JSON.stringify(data || null), {
      headers: { "Content-Type": "application/json" }
    });
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    await store.setJSON("state", body);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config = {
  path: "/api/state"
};

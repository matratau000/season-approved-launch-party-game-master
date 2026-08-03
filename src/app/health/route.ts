import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET() {
  const { env } = await getCloudflareContext({ async: true });
  await Promise.all([env.DB.prepare("SELECT 1").first(), env.SUBMISSIONS.list({ limit: 1 })]);
  return Response.json({
    status: "ok",
    buildSha: process.env.BUILD_SHA,
    bindings: { d1: true, r2: true },
  }, { headers: { "cache-control": "no-store" } });
}

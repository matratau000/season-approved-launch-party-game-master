import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { env } = await getCloudflareContext({ async: true });
  const row = await env.DB.prepare("SELECT object_key, content_type FROM submissions WHERE id = ?")
    .bind(id)
    .first<{ object_key: string; content_type: string }>();
  if (!row) return new Response("Not found", { status: 404 });

  const object = await env.SUBMISSIONS.get(row.object_key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": row.content_type,
      "cache-control": "private, max-age=60",
      etag: object.httpEtag,
    },
  });
}

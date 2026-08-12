import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isGameMaster } from "@/lib/game-master";
import { seasons, type Season } from "@/lib/roster";

export async function GET(_: Request, { params }: { params: Promise<{ season: string }> }) {
  const value = (await params).season as Season;
  if (!seasons.includes(value)) return new Response("Not found", { status: 404 });

  if (!(await isGameMaster())) return new Response("Not found", { status: 404 });

  const { env } = await getCloudflareContext({ async: true });
  const row = await env.DB.prepare("SELECT object_key, content_type FROM team_photos WHERE season = ?")
    .bind(value).first<{ object_key: string; content_type: string }>();
  if (!row) return new Response("Not found", { status: 404 });
  const object = await env.SUBMISSIONS.get(row.object_key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, { headers: { "content-type": row.content_type, "cache-control": "private, no-store", etag: object.httpEtag } });
}

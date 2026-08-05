import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies } from "next/headers";
import { gamesAreOver, standings } from "@/lib/data";
import { isGameMaster } from "@/lib/game-master";
import { isParticipant, seasonFor, seasons, type Season } from "@/lib/roster";
import { uniqueLeader } from "@/lib/scoring";

export async function GET(_: Request, { params }: { params: Promise<{ season: string }> }) {
  const value = (await params).season as Season;
  if (!seasons.includes(value)) return new Response("Not found", { status: 404 });

  const participant = (await cookies()).get("participant")?.value ?? "";
  let allowed = (isParticipant(participant) && seasonFor(participant) === value) || await isGameMaster();
  if (!allowed && await gamesAreOver()) allowed = uniqueLeader(await standings())?.season === value;
  if (!allowed) return new Response("Not found", { status: 404 });

  const { env } = await getCloudflareContext({ async: true });
  const row = await env.DB.prepare("SELECT object_key, content_type FROM team_photos WHERE season = ?")
    .bind(value).first<{ object_key: string; content_type: string }>();
  if (!row) return new Response("Not found", { status: 404 });
  const object = await env.SUBMISSIONS.get(row.object_key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, { headers: { "content-type": row.content_type, "cache-control": "private, no-store", etag: object.httpEtag } });
}

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { roster, seasons, type Season } from "./roster";

export type SeasonStanding = {
  season: Season;
  points: number;
  contributors: { name: string; points: number }[];
};

export type Submission = {
  id: string;
  participant: string;
  content_type: string;
  color_name: string;
  color_hex: string;
  status: "pending" | "approved" | "rejected";
  points: number;
  created_at: string;
};

async function database() {
  return (await getCloudflareContext({ async: true })).env.DB;
}

export async function standings(): Promise<SeasonStanding[]> {
  const db = await database();
  const { results } = await db
    .prepare("SELECT participant, SUM(points) AS points FROM score_events GROUP BY participant")
    .all<{ participant: string; points: number }>();
  const points = new Map(results.map((row) => [row.participant, Number(row.points)]));

  return seasons
    .map((season) => ({
      season,
      points: roster[season].reduce((total, name) => total + (points.get(name) ?? 0), 0),
      contributors: roster[season]
        .map((name) => ({ name, points: points.get(name) ?? 0 }))
        .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => b.points - a.points);
}

export async function submissions(): Promise<Submission[]> {
  const db = await database();
  const { results } = await db
    .prepare(
      "SELECT id, participant, content_type, color_name, color_hex, status, points, created_at FROM submissions ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, created_at DESC",
    )
    .all<Submission>();
  return results;
}

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { roster, seasons, type Season } from "./roster";
import type { GameId } from "./games";
import { finalResultsComplete, isFinalScore } from "./scoring";

export type SeasonStanding = {
  season: Season;
  points: number;
  contributors: { name: string; points: number }[];
};

export type GameState = {
  game_id: GameId;
  status: "locked" | "live" | "completed";
  started_at: string | null;
  duration_seconds: number;
  timer_phase: "idle" | "delegation" | "hunt";
  timer_running: number;
  timer_remaining_seconds: number;
  external_url: string;
};

export type GameScore = {
  game_id: GameId;
  slot: string;
  season: Season;
  participant: string | null;
  points: number;
  detail: string;
};

export type Submission = {
  id: string;
  participant: string;
  season: Season;
  content_type: string;
  color_name: string;
  color_hex: string;
  status: "pending" | "approved" | "rejected";
  points: number;
  created_at: string;
};

export type TeamPhoto = {
  season: Season;
};

async function database() {
  return (await getCloudflareContext({ async: true })).env.DB;
}

export async function standings(): Promise<SeasonStanding[]> {
  const db = await database();
  const { results } = await db
    .prepare("SELECT slot, season, participant, points FROM game_scores")
    .all<{ slot: string; season: Season; participant: string | null; points: number }>();
  const teamPoints = new Map<Season, number>();
  const participantPoints = new Map<string, number>();
  for (const row of results) {
    if (!isFinalScore(row.slot)) continue;
    teamPoints.set(row.season, (teamPoints.get(row.season) ?? 0) + Number(row.points));
    if (row.participant) participantPoints.set(row.participant, (participantPoints.get(row.participant) ?? 0) + Number(row.points));
  }

  return seasons
    .map((season) => ({
      season,
      points: teamPoints.get(season) ?? 0,
      contributors: roster[season]
        .map((name) => ({ name, points: participantPoints.get(name) ?? 0 }))
        .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => b.points - a.points || a.season.localeCompare(b.season));
}

export async function gameStates(): Promise<GameState[]> {
  const { results } = await (await database())
    .prepare("SELECT game_id, status, started_at, duration_seconds, timer_phase, timer_running, timer_remaining_seconds, external_url FROM game_state ORDER BY game_id")
    .all<GameState>();
  return results;
}

export async function gameState(gameId: GameId): Promise<GameState | null> {
  return (await database()).prepare("SELECT game_id, status, started_at, duration_seconds, timer_phase, timer_running, timer_remaining_seconds, external_url FROM game_state WHERE game_id = ?")
    .bind(gameId).first<GameState>();
}

export async function gameScores(): Promise<GameScore[]> {
  const { results } = await (await database())
    .prepare("SELECT game_id, slot, season, participant, points, detail FROM game_scores ORDER BY game_id, slot")
    .all<GameScore>();
  return results;
}

export async function teamPhotos(): Promise<TeamPhoto[]> {
  const { results } = await (await database())
    .prepare("SELECT season FROM team_photos ORDER BY season")
    .all<TeamPhoto>();
  return results;
}

export async function submissions(): Promise<Submission[]> {
  const { results } = await (await database())
    .prepare(
      "SELECT id, participant, season, content_type, color_name, color_hex, status, points, created_at FROM submissions ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, created_at DESC",
    )
    .all<Submission>();
  return results;
}

export async function gamesAreOver(): Promise<boolean> {
  const db = await database();
  const [row, { results }] = await Promise.all([
    db.prepare("SELECT COUNT(*) AS remaining FROM game_state WHERE status != 'completed'").first<{ remaining: number }>(),
    db.prepare("SELECT game_id, slot FROM game_scores WHERE slot LIKE 'place-%'").all<{ game_id: GameId; slot: string }>(),
  ]);
  return Number(row?.remaining) === 0 && finalResultsComplete(results);
}

export async function submittedColors(season: Season): Promise<string[]> {
  const { results } = await (await database())
    .prepare("SELECT DISTINCT color_hex FROM submissions WHERE season = ? AND status != 'rejected'")
    .bind(season)
    .all<{ color_hex: string }>();
  return results.map((row) => row.color_hex);
}

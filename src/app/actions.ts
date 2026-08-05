"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { clearGameMasterSession, gameMasterPinMatches, isGameMaster, setGameMasterSession } from "@/lib/game-master";
import { games, type GameId } from "@/lib/games";
import { isParticipant, roster, seasonFor, seasons, type Season } from "@/lib/roster";
import { allUnique, finalResultsComplete, kahootPoints, placePoints, songPoints, uniqueLeader } from "@/lib/scoring";
import { colorFor } from "@/lib/season-colors";
import { timerRemaining } from "@/lib/timer";

const maxUploadBytes = 12 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const teamPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

async function database() {
  return (await getCloudflareContext({ async: true })).env.DB;
}

async function requireGameMaster() {
  if (!(await isGameMaster())) redirect("/game-master?error=Enter+the+Game+Master+PIN");
}

function gameIdFrom(formData: FormData): GameId | undefined {
  const value = Number(formData.get("gameId"));
  return games.some((game) => game.id === value) ? value as GameId : undefined;
}

function revalidateLiveViews() {
  revalidatePath("/dashboard");
  revalidatePath("/game-master");
  revalidatePath("/scoreboard");
  revalidatePath("/scavenger-hunt");
}

export async function login(formData: FormData) {
  const participant = String(formData.get("participant") ?? "");
  if (!isParticipant(participant)) redirect("/?error=Choose+a+valid+name");
  (await cookies()).set("participant", participant, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 2,
    path: "/",
  });
  redirect("/dashboard?welcome=1");
}

export async function logout() {
  (await cookies()).delete("participant");
  redirect("/");
}

export async function gameMasterLogin(formData: FormData) {
  if (!(await gameMasterPinMatches(String(formData.get("pin") ?? "")))) {
    redirect("/game-master?error=Incorrect+Game+Master+PIN");
  }
  await setGameMasterSession();
  redirect("/game-master");
}

export async function gameMasterLogout() {
  await clearGameMasterSession();
  redirect("/game-master");
}

export async function setGameStatus(formData: FormData) {
  await requireGameMaster();
  const gameId = gameIdFrom(formData);
  const status = String(formData.get("status") ?? "");
  if (!gameId || !["locked", "live", "completed"].includes(status)) return;
  const db = await database();
  const statements = [];
  if (status === "live") statements.push(db.prepare("UPDATE game_state SET status = 'locked', started_at = CASE WHEN game_id = 4 THEN NULL ELSE started_at END, timer_phase = CASE WHEN game_id = 4 THEN 'idle' ELSE timer_phase END, timer_running = CASE WHEN game_id = 4 THEN 0 ELSE timer_running END, timer_remaining_seconds = CASE WHEN game_id = 4 THEN 0 ELSE timer_remaining_seconds END WHERE status = 'live' AND game_id != ?").bind(gameId));
  statements.push(gameId === 4 && status !== "live"
    ? db.prepare("UPDATE game_state SET status = ?, started_at = NULL, timer_phase = 'idle', timer_running = 0, timer_remaining_seconds = 0 WHERE game_id = 4").bind(status)
    : db.prepare("UPDATE game_state SET status = ? WHERE game_id = ?").bind(status, gameId));
  await db.batch(statements);
  revalidateLiveViews();
}

export async function controlScavengerTimer(formData: FormData) {
  await requireGameMaster();
  const operation = String(formData.get("operation") ?? "");
  const db = await database();
  const state = await db.prepare("SELECT status, started_at, duration_seconds, timer_phase, timer_running, timer_remaining_seconds FROM game_state WHERE game_id = 4").first<{
    status: string; started_at: string | null; duration_seconds: number; timer_phase: string; timer_running: number; timer_remaining_seconds: number;
  }>();
  if (!state || (state.status !== "live" && operation !== "reset")) return;

  if (operation === "start-delegation" || operation === "start-hunt") {
    const seconds = operation === "start-delegation" ? 120 : 600;
    const phase = operation === "start-delegation" ? "delegation" : "hunt";
    await db.prepare("UPDATE game_state SET timer_phase = ?, timer_running = 1, started_at = CURRENT_TIMESTAMP, duration_seconds = ?, timer_remaining_seconds = ? WHERE game_id = 4").bind(phase, seconds, seconds).run();
  } else if (operation === "pause" && state.timer_running) {
    const remaining = timerRemaining(state);
    await db.prepare("UPDATE game_state SET timer_running = 0, started_at = NULL, timer_remaining_seconds = ? WHERE game_id = 4").bind(remaining).run();
  } else if (operation === "resume" && !state.timer_running && state.timer_phase !== "idle" && state.timer_remaining_seconds > 0) {
    await db.prepare("UPDATE game_state SET timer_running = 1, started_at = CURRENT_TIMESTAMP, duration_seconds = timer_remaining_seconds WHERE game_id = 4").run();
  } else if (operation === "reset") {
    await db.prepare("UPDATE game_state SET timer_phase = 'idle', timer_running = 0, started_at = NULL, duration_seconds = 600, timer_remaining_seconds = 0 WHERE game_id = 4").run();
  } else return;
  revalidateLiveViews();
}

export async function setGameLink(formData: FormData) {
  await requireGameMaster();
  const gameId = gameIdFrom(formData);
  const url = String(formData.get("url") ?? "").trim();
  if (!gameId || (url && !/^https:\/\//i.test(url))) return;
  await (await database()).prepare("UPDATE game_state SET external_url = ? WHERE game_id = ?").bind(url, gameId).run();
  revalidatePath(`/games/${gameId}`);
  revalidatePath("/game-master");
}

export async function saveSongScore(formData: FormData) {
  await requireGameMaster();
  const song = Number(formData.get("song"));
  const season = String(formData.get("season") ?? "") as Season;
  const result = String(formData.get("result") ?? "");
  if (!Number.isInteger(song) || song < 1 || song > 22 || !seasons.includes(season)) return;
  const db = await database();
  const slot = `song-${String(song).padStart(2, "0")}`;
  if (result === "undo") await db.prepare("DELETE FROM game_scores WHERE game_id = 1 AND slot = ?").bind(slot).run();
  else {
    const points = songPoints(result);
    if (points === undefined) return;
    await db.prepare(
      "INSERT INTO game_scores (id, game_id, slot, season, points, detail) VALUES (?, 1, ?, ?, ?, ?) ON CONFLICT(game_id, slot) DO UPDATE SET season = excluded.season, points = excluded.points, detail = excluded.detail, participant = NULL, updated_at = CURRENT_TIMESTAMP",
    ).bind(crypto.randomUUID(), slot, season, points, result).run();
  }
  revalidateLiveViews();
  redirect(`/game-master#${slot}`);
}

export async function savePlacements(formData: FormData) {
  await requireGameMaster();
  const gameId = gameIdFrom(formData);
  if (gameId !== 1 && gameId !== 2 && gameId !== 4) return;
  const placements = placePoints.map((_, index) => String(formData.get(`place${index + 1}`) ?? ""));
  if (!allUnique(placements) || !placements.every((season) => seasons.includes(season as Season))) return;
  const db = await database();
  await db.batch([
    db.prepare("DELETE FROM game_scores WHERE game_id = ? AND slot LIKE 'place-%'").bind(gameId),
    ...placements.map((season, index) => db.prepare(
      "INSERT INTO game_scores (id, game_id, slot, season, points, detail) VALUES (?, ?, ?, ?, ?, ?)",
    ).bind(crypto.randomUUID(), gameId, `place-${index + 1}`, season, placePoints[index], `${index + 1}`)),
  ]);
  revalidateLiveViews();
  redirect(`/game-master#game-${gameId}`);
}

export async function saveKahootWinners(formData: FormData) {
  await requireGameMaster();
  const winners = kahootPoints.map((_, index) => String(formData.get(`place${index + 1}`) ?? ""));
  if (!allUnique(winners) || !winners.every(isParticipant)) return;
  const db = await database();
  await db.batch([
    db.prepare("DELETE FROM game_scores WHERE game_id = 3"),
    ...winners.map((participant, index) => db.prepare(
      "INSERT INTO game_scores (id, game_id, slot, season, participant, points, detail) VALUES (?, 3, ?, ?, ?, ?, ?)",
    ).bind(crypto.randomUUID(), `place-${index + 1}`, seasonFor(participant)!, participant, kahootPoints[index], `${index + 1}`)),
  ]);
  revalidateLiveViews();
  redirect("/game-master#game-3");
}

export async function saveTeamPhoto(formData: FormData) {
  await requireGameMaster();
  const season = String(formData.get("season") ?? "") as Season;
  const file = formData.get("photo");
  if (!seasons.includes(season)) return;
  if (!(file instanceof File) || file.size === 0) redirect("/game-master?error=Choose+a+team+photo#team-photos");
  if (!teamPhotoTypes.has(file.type) || file.size > maxUploadBytes) redirect("/game-master?error=Use+a+JPG,+PNG,+or+WebP+under+12MB#team-photos");

  const { env } = await getCloudflareContext({ async: true });
  const previous = await env.DB.prepare("SELECT object_key, previous_object_key FROM team_photos WHERE season = ?").bind(season).first<{ object_key: string; previous_object_key: string | null }>();
  if (previous?.previous_object_key) {
    await env.SUBMISSIONS.delete(previous.previous_object_key);
    await env.DB.prepare("UPDATE team_photos SET previous_object_key = NULL WHERE season = ?").bind(season).run();
  }
  const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
  const objectKey = `team-photos/${season.toLowerCase()}/${crypto.randomUUID()}.${extension}`;
  await env.SUBMISSIONS.put(objectKey, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  try {
    await env.DB.prepare(
      "INSERT INTO team_photos (season, object_key, content_type) VALUES (?, ?, ?) ON CONFLICT(season) DO UPDATE SET previous_object_key = team_photos.object_key, object_key = excluded.object_key, content_type = excluded.content_type, updated_at = CURRENT_TIMESTAMP",
    ).bind(season, objectKey, file.type).run();
  } catch (error) {
    await env.SUBMISSIONS.delete(objectKey);
    throw error;
  }
  if (previous?.object_key) {
    await env.SUBMISSIONS.delete(previous.object_key);
    await env.DB.prepare("UPDATE team_photos SET previous_object_key = NULL WHERE season = ? AND previous_object_key = ?").bind(season, previous.object_key).run();
  }
  revalidateLiveViews();
}

export async function clearTeamPhoto(formData: FormData) {
  await requireGameMaster();
  const season = String(formData.get("season") ?? "") as Season;
  if (!seasons.includes(season)) return;
  const { env } = await getCloudflareContext({ async: true });
  const previous = await env.DB.prepare("SELECT object_key, previous_object_key FROM team_photos WHERE season = ?").bind(season).first<{ object_key: string; previous_object_key: string | null }>();
  if (!previous) return;
  await env.SUBMISSIONS.delete([previous.object_key, previous.previous_object_key].filter((key): key is string => Boolean(key)));
  await env.DB.prepare("DELETE FROM team_photos WHERE season = ?").bind(season).run();
  revalidateLiveViews();
}

export async function submitScavengerHunt(formData: FormData) {
  const participant = (await cookies()).get("participant")?.value ?? "";
  if (!isParticipant(participant)) redirect("/");
  const season = seasonFor(participant)!;
  const finder = String(formData.get("finder") ?? "");
  if (!roster[season].includes(finder)) redirect("/scavenger-hunt?error=Choose+the+teammate+who+found+the+color");
  const file = formData.get("evidence");
  const color = colorFor(season, String(formData.get("color") ?? ""));
  if (!(file instanceof File) || file.size === 0) redirect("/scavenger-hunt?error=Choose+a+photo+or+screenshot");
  if (!color) redirect("/scavenger-hunt?error=Choose+one+of+your+Season+colors");
  if (!allowedTypes.has(file.type) || file.size > maxUploadBytes) redirect("/scavenger-hunt?error=Use+a+JPG,+PNG,+WebP,+or+HEIC+under+12MB");

  const db = await database();
  const state = await db.prepare("SELECT status, started_at, duration_seconds, timer_phase, timer_running, timer_remaining_seconds FROM game_state WHERE game_id = 4")
    .first<{ status: string; started_at: string | null; duration_seconds: number; timer_phase: string; timer_running: number; timer_remaining_seconds: number }>();
  if (!state || state.status !== "live" || state.timer_phase !== "hunt" || !state.timer_running || timerRemaining(state) <= 0) redirect("/dashboard?error=The+Scavenger+Hunt+is+closed");
  if (await db.prepare("SELECT id FROM submissions WHERE season = ? AND color_hex = ? AND status != 'rejected'").bind(season, color.hex).first()) {
    redirect("/scavenger-hunt?error=Your+team+already+submitted+that+color");
  }

  const id = crypto.randomUUID();
  const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
  const objectKey = `scavenger-hunt/${participant.toLowerCase()}/${id}.${extension}`;
  const { env } = await getCloudflareContext({ async: true });
  await env.SUBMISSIONS.put(objectKey, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  try {
    await db.prepare(
      "INSERT INTO submissions (id, participant, season, object_key, content_type, color_name, color_hex) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).bind(id, finder, season, objectKey, file.type, color.name, color.hex).run();
  } catch (error) {
    await env.SUBMISSIONS.delete(objectKey);
    if (String(error).includes("UNIQUE")) redirect("/scavenger-hunt?error=Your+team+already+submitted+that+color");
    throw error;
  }
  revalidatePath("/game-master");
  revalidatePath("/scavenger-hunt");
  redirect("/scavenger-hunt?submitted=1");
}

export async function reviewSubmission(formData: FormData) {
  await requireGameMaster();
  const submissionId = String(formData.get("submissionId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!submissionId || !["approve", "reject"].includes(decision)) return;
  await (await database()).prepare(
    "UPDATE submissions SET status = ?, points = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?",
  ).bind(decision === "approve" ? "approved" : "rejected", decision === "approve" ? 1 : 0, submissionId).run();
  revalidatePath("/game-master");
  revalidatePath("/scavenger-hunt");
}

export async function resetDashboard() {
  await requireGameMaster();
  await (await database()).prepare("DELETE FROM game_scores").run();
  revalidateLiveViews();
  redirect("/game-master");
}

export async function resetScavengerSubmissions() {
  await requireGameMaster();
  const { env } = await getCloudflareContext({ async: true });
  const { results } = await env.DB.prepare("SELECT object_key FROM submissions").all<{ object_key: string }>();
  const keys = results.map((row) => row.object_key);
  for (let index = 0; index < keys.length; index += 1000) await env.SUBMISSIONS.delete(keys.slice(index, index + 1000));
  await env.DB.prepare("DELETE FROM submissions").run();
  revalidateLiveViews();
}

export async function endGames() {
  await requireGameMaster();
  const db = await database();
  const { results: finalScores } = await db.prepare("SELECT game_id, slot FROM game_scores WHERE slot LIKE 'place-%'").all<{ game_id: GameId; slot: string }>();
  if (!finalResultsComplete(finalScores)) return;
  const { results } = await db.prepare(
    "SELECT season, SUM(points) AS points FROM game_scores WHERE slot LIKE 'place-%' GROUP BY season ORDER BY points DESC",
  ).all<{ season: Season; points: number }>();
  if (!uniqueLeader(results.map((row) => ({ ...row, points: Number(row.points) })))) return;
  await db.prepare("UPDATE game_state SET status = 'completed', started_at = NULL, timer_phase = CASE WHEN game_id = 4 THEN 'idle' ELSE timer_phase END, timer_running = 0, timer_remaining_seconds = CASE WHEN game_id = 4 THEN 0 ELSE timer_remaining_seconds END").run();
  revalidateLiveViews();
}

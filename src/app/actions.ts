"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { clearGameMasterSession, gameMasterPinMatches, isGameMaster, setGameMasterSession } from "@/lib/game-master";
import { games, type GameId } from "@/lib/games";
import { isParticipant, roster, seasonFor, seasons, type Season } from "@/lib/roster";
import { allUnique, kahootPoints, placePoints, songPoints } from "@/lib/scoring";
import { colorFor } from "@/lib/season-colors";

const maxUploadBytes = 12 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

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
  redirect("/dashboard");
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
  if (status === "live") statements.push(db.prepare("UPDATE game_state SET status = 'locked' WHERE status = 'live' AND game_id != ?").bind(gameId));
  statements.push(db.prepare(
    "UPDATE game_state SET status = ?, started_at = CASE WHEN ? = 'live' AND game_id = 4 THEN CURRENT_TIMESTAMP ELSE started_at END WHERE game_id = ?",
  ).bind(status, status, gameId));
  await db.batch(statements);
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
}

export async function savePlacements(formData: FormData) {
  await requireGameMaster();
  const gameId = gameIdFrom(formData);
  if (gameId !== 2 && gameId !== 4) return;
  const placements = placePoints.map((_, index) => String(formData.get(`place${index + 1}`) ?? ""));
  if (!allUnique(placements) || !placements.every((season) => seasons.includes(season as Season))) return;
  const db = await database();
  await db.batch([
    db.prepare("DELETE FROM game_scores WHERE game_id = ?").bind(gameId),
    ...placements.map((season, index) => db.prepare(
      "INSERT INTO game_scores (id, game_id, slot, season, points, detail) VALUES (?, ?, ?, ?, ?, ?)",
    ).bind(crypto.randomUUID(), gameId, `place-${index + 1}`, season, placePoints[index], `${index + 1}`)),
  ]);
  revalidateLiveViews();
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
  const state = await db.prepare("SELECT status, started_at, duration_seconds FROM game_state WHERE game_id = 4")
    .first<{ status: string; started_at: string | null; duration_seconds: number }>();
  const expires = state?.started_at ? new Date(`${state.started_at.replace(" ", "T")}Z`).getTime() + state.duration_seconds * 1000 : 0;
  if (state?.status !== "live" || !expires || Date.now() >= expires) redirect("/dashboard?error=The+Scavenger+Hunt+is+closed");
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
    "UPDATE submissions SET status = ?, points = 0, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?",
  ).bind(decision === "approve" ? "approved" : "rejected", submissionId).run();
  revalidatePath("/game-master");
  revalidatePath("/scavenger-hunt");
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { gameState } from "./data";
import { isGameMaster } from "./game-master";
import type { GameId } from "./games";
import { isParticipant } from "./roster";

export async function gameAccess(gameId: GameId, preview = false) {
  const state = await gameState(gameId);
  if (!state) redirect("/dashboard");
  if (preview && await isGameMaster()) return { state, participant: "", preview: true };
  const participant = (await cookies()).get("participant")?.value ?? "";
  if (!isParticipant(participant)) redirect("/");
  if (state.status !== "live") redirect("/dashboard?error=That+game+is+not+live");
  if (gameId === 4 && state.started_at) {
    const end = new Date(`${state.started_at.replace(" ", "T")}Z`).getTime() + state.duration_seconds * 1000;
    if (Date.now() >= end) redirect("/dashboard?error=The+Scavenger+Hunt+is+closed");
  }
  return { state, participant, preview: false };
}

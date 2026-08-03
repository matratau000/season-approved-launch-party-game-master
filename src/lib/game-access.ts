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
  if (state.status === "locked") redirect("/dashboard?error=That+game+is+locked");
  return { state, participant, preview: false };
}

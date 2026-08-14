import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { gameState, participant } from "./data";
import { isGameMaster } from "./game-master";
import type { GameId } from "./games";

export async function gameAccess(gameId: GameId, preview = false) {
  const state = await gameState(gameId);
  if (!state) redirect("/dashboard");
  if (preview && await isGameMaster()) return { state, participant: null, preview: true };
  const registered = await participant((await cookies()).get("participant")?.value ?? "");
  if (!registered) redirect("/");
  if (state.status === "locked") redirect("/dashboard?error=That+game+is+locked");
  return { state, participant: registered, preview: false };
}

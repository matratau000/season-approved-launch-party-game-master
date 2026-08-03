import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies } from "next/headers";

const cookieName = "game_master";

async function fingerprint(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function configuredPin() {
  const { env } = await getCloudflareContext({ async: true });
  return (env as CloudflareEnv & { GAME_MASTER_PIN?: string }).GAME_MASTER_PIN ?? "";
}

export async function gameMasterPinMatches(candidate: string) {
  const pin = await configuredPin();
  return Boolean(pin) && (await fingerprint(candidate)) === (await fingerprint(pin));
}

export async function gameMasterSessionValue() {
  const pin = await configuredPin();
  return pin ? fingerprint(pin) : "";
}

export async function isGameMaster() {
  const expected = await gameMasterSessionValue();
  return Boolean(expected) && (await cookies()).get(cookieName)?.value === expected;
}

export async function setGameMasterSession() {
  (await cookies()).set(cookieName, await gameMasterSessionValue(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/",
  });
}

export async function clearGameMasterSession() {
  (await cookies()).delete(cookieName);
}

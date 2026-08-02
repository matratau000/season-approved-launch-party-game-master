"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isParticipant, seasonFor } from "@/lib/roster";
import { colorFor } from "@/lib/season-colors";

const maxUploadBytes = 12 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

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

export async function submitScavengerHunt(formData: FormData) {
  const participant = (await cookies()).get("participant")?.value ?? "";
  if (!isParticipant(participant)) redirect("/");

  const file = formData.get("evidence");
  const color = colorFor(seasonFor(participant)!, String(formData.get("color") ?? ""));
  if (!(file instanceof File) || file.size === 0) {
    redirect("/scavenger-hunt?error=Choose+a+photo+or+screenshot");
  }
  if (!color) redirect("/scavenger-hunt?error=Choose+one+of+your+Season+colors");
  if (!allowedTypes.has(file.type) || file.size > maxUploadBytes) {
    redirect("/scavenger-hunt?error=Use+a+JPG,+PNG,+WebP,+or+HEIC+under+12MB");
  }

  const id = crypto.randomUUID();
  const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
  const objectKey = `scavenger-hunt/${participant.toLowerCase()}/${id}.${extension}`;
  const { env } = await getCloudflareContext({ async: true });

  await env.SUBMISSIONS.put(objectKey, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });
  try {
    await env.DB.prepare(
      "INSERT INTO submissions (id, participant, object_key, content_type, color_name, color_hex) VALUES (?, ?, ?, ?, ?, ?)",
    )
      .bind(id, participant, objectKey, file.type, color.name, color.hex)
      .run();
  } catch (error) {
    await env.SUBMISSIONS.delete(objectKey);
    throw error;
  }

  revalidatePath("/game-master");
  redirect("/scavenger-hunt?submitted=1");
}

export async function reviewSubmission(formData: FormData) {
  const submissionId = String(formData.get("submissionId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const points = Math.max(0, Math.min(1000, Number.parseInt(String(formData.get("points") ?? "0"), 10) || 0));
  const { env } = await getCloudflareContext({ async: true });
  const submission = await env.DB.prepare("SELECT participant FROM submissions WHERE id = ?")
    .bind(submissionId)
    .first<{ participant: string }>();
  if (!submission || !["approve", "reject"].includes(decision)) return;

  if (decision === "approve") {
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE submissions SET status = 'approved', points = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?",
      ).bind(points, submissionId),
      env.DB.prepare(
        "INSERT INTO score_events (id, submission_id, participant, points) VALUES (?, ?, ?, ?) ON CONFLICT(submission_id) DO UPDATE SET points = excluded.points",
      ).bind(crypto.randomUUID(), submissionId, submission.participant, points),
    ]);
  } else {
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE submissions SET status = 'rejected', points = 0, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?",
      ).bind(submissionId),
      env.DB.prepare("DELETE FROM score_events WHERE submission_id = ?").bind(submissionId),
    ]);
  }

  revalidatePath("/game-master");
  revalidatePath("/dashboard");
  revalidatePath("/scoreboard");
}

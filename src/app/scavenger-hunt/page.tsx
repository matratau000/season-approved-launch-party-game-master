import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isParticipant, seasonFor } from "@/lib/roster";
import { submitScavengerHunt } from "../actions";

export default async function ScavengerHuntPage({ searchParams }: { searchParams: Promise<{ error?: string; submitted?: string }> }) {
  const participant = (await cookies()).get("participant")?.value ?? "";
  if (!isParticipant(participant)) redirect("/");
  const season = seasonFor(participant)!;
  const params = await searchParams;

  return (
    <main className={`app-shell narrow theme-${season.toLowerCase()}`}>
      <Link className="back-link" href="/dashboard">← Team dashboard</Link>
      <section className="challenge-hero"><p className="eyebrow">Game 01 · Team {season}</p><h1>Scavenger Hunt</h1><p>Take a photo now or choose a screenshot from your phone. Your Game Master will review it and award points live.</p></section>
      <section className="panel upload-panel">
        {params.submitted && <div className="success">Submission received. Watch the scoreboard for your points!</div>}
        {params.error && <div className="error-box">{params.error}</div>}
        <form action={submitScavengerHunt} className="upload-form">
          <label className="file-picker">
            <span className="camera-icon">＋</span>
            <strong>Add photo or screenshot</strong>
            <small>Camera and photo library supported · 12MB max</small>
            <input type="file" name="evidence" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" required />
          </label>
          <label htmlFor="note">What did you find? <small>Optional</small></label>
          <textarea id="note" name="note" maxLength={240} rows={4} placeholder="Add a quick note for the Game Master…" />
          <button type="submit">Send to Game Master</button>
        </form>
      </section>
    </main>
  );
}

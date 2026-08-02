import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isParticipant, seasonFor } from "@/lib/roster";
import { seasonColors } from "@/lib/season-colors";
import { submitScavengerHunt } from "../actions";

export default async function ScavengerHuntPage({ searchParams }: { searchParams: Promise<{ error?: string; submitted?: string }> }) {
  const participant = (await cookies()).get("participant")?.value ?? "";
  if (!isParticipant(participant)) redirect("/");
  const season = seasonFor(participant)!;
  const params = await searchParams;

  return (
    <main className={`app-shell narrow theme-${season.toLowerCase()}`}>
      <Link className="back-link" href="/dashboard">← Team dashboard</Link>
      <section className="challenge-hero"><p className="eyebrow">Game 01 · Team {season}</p><h1>Scavenger Hunt</h1><p>Take or choose a photo, pick the matching {season} color, and send it to your Game Master.</p></section>
      <section className="panel upload-panel">
        {params.submitted && <div className="success">Submission received. Watch the scoreboard for your points!</div>}
        {params.error && <div className="error-box">{params.error}</div>}
        <form action={submitScavengerHunt} className="upload-form">
          <label className="file-picker">
            <span className="camera-icon">＋</span>
            <strong>Take or choose a photo</strong>
            <small>Camera and photo library supported · 12MB max</small>
            <input type="file" name="evidence" accept="image/*" required />
          </label>
          <fieldset className="color-picker"><legend>Which {season} color matches?</legend><div className="color-grid">{seasonColors[season].map((color) => <label key={color.hex}><input type="radio" name="color" value={color.hex} required /><span className="color-swatch" style={{ background: color.hex }} /><span>{color.name}</span></label>)}</div></fieldset>
          <button type="submit">Send to Game Master</button>
        </form>
      </section>
    </main>
  );
}

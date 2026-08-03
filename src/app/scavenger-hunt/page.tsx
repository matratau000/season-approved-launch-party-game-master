import Link from "next/link";
import { gameAccess } from "@/lib/game-access";
import { roster, seasonFor } from "@/lib/roster";
import { seasonColors } from "@/lib/season-colors";
import { submittedColors } from "@/lib/data";
import { submitScavengerHunt } from "../actions";
import { Countdown } from "@/components/countdown";
import { LiveRefresh } from "@/components/live-refresh";
import { PhotoPicker } from "@/components/photo-picker";
import { timerRemaining } from "@/lib/timer";

export const dynamic = "force-dynamic";

const rules = [
  "Take 2 minutes to choose your strategy and assign roles.",
  "When the timer begins, your team has 10 minutes to hunt for colors from your assigned season.",
  "Use your booklet or Color Detect in the SeasonApproved app to check colors.",
  "Take a clear photo, select the finder, and submit it. Do not submit the same color twice.",
];

export default async function ScavengerHuntPage({ searchParams }: { searchParams: Promise<{ error?: string; submitted?: string; preview?: string }> }) {
  const params = await searchParams;
  const access = await gameAccess(4, params.preview === "1");
  const season = access.participant ? seasonFor(access.participant)! : "Winter";
  const usedColors = access.preview ? [] : await submittedColors(season);
  const remaining = timerRemaining(access.state);
  const canSubmit = !access.preview && access.state.status === "live" && access.state.timer_phase === "hunt" && Boolean(access.state.timer_running) && remaining > 0;
  const timerLabel = access.state.timer_phase === "delegation" ? "Delegation and rules" : "Color hunt";
  return (
    <main className={`app-shell narrow theme-${season.toLowerCase()}`}>
      <LiveRefresh />
      <Link className="back-link" href={access.preview ? "/game-master" : "/dashboard"}>← {access.preview ? "Game Master" : "Team dashboard"}</Link>
      <section className="challenge-hero"><p className="eyebrow">Game 04 · Team {season}{access.preview ? ` · Preview · ${access.state.status}` : ` · ${access.state.status}`}</p><h1>Color Scavenger Hunt</h1><p>Take or choose a photo, pick the matching {season} color, and send it to your Game Master.</p>{access.state.timer_phase !== "idle" && <div className="active-timer"><span>{timerLabel} · {access.state.timer_running ? "playing" : "paused"}</span><Countdown startedAt={access.state.started_at} seconds={access.state.timer_running ? access.state.duration_seconds : remaining} running={Boolean(access.state.timer_running)} /></div>}{access.state.status === "completed" && <p className="closed-notice">This game is complete. Directions remain available, but submissions are closed.</p>}</section>
      <details className="panel directions" open={access.state.timer_phase === "delegation" || access.state.status === "completed"}><summary>Directions</summary><ol>{rules.map((rule) => <li key={rule}>{rule}</li>)}</ol></details>
      <section className="panel upload-panel">
        {params.submitted && <div className="success">Submission received. Your team can see that color marked below.</div>}
        {params.error && <div className="error-box">{params.error}</div>}
        {access.preview ? <p>Preview mode does not accept submissions.</p> : !canSubmit ? <p className="closed-notice">{access.state.status === "completed" ? "Submissions are closed." : access.state.timer_phase === "delegation" ? "Use this time to review the rules and delegate roles. Submissions open when the 10-minute hunt begins." : access.state.timer_phase === "hunt" && !access.state.timer_running && remaining > 0 ? "The hunt is paused. Submissions resume when the Game Master presses play." : "Submissions open when the Game Master starts the 10-minute hunt."}</p> : <form action={submitScavengerHunt} className="upload-form">
          <PhotoPicker />
          <label>Who found this color?<select name="finder" defaultValue={access.participant} required>{roster[season].map((name) => <option key={name}>{name}</option>)}</select></label>
          <fieldset className="color-picker"><legend>Which {season} color matches?</legend><div className="color-grid">{seasonColors[season].map((color) => {
            const used = usedColors.includes(color.hex);
            return <label className={used ? "used" : ""} key={color.hex}><input type="radio" name="color" value={color.hex} required disabled={used} /><span className="color-swatch" style={{ background: color.hex }} /><span>{color.name}{used ? " · submitted" : ""}</span></label>;
          })}</div></fieldset>
          <button type="submit">Send to Game Master</button>
        </form>}
      </section>
    </main>
  );
}

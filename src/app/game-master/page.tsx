import { controlScavengerTimer, gameMasterLogin, gameMasterLogout, reviewSubmission, saveKahootWinners, savePlacements, saveSongScore, setGameLink, setGameStatus } from "../actions";
import { gameScores, gameStates, submissions } from "@/lib/data";
import { games } from "@/lib/games";
import { isGameMaster } from "@/lib/game-master";
import { roster, seasons } from "@/lib/roster";
import { LiveRefresh } from "@/components/live-refresh";
import { Countdown } from "@/components/countdown";
import { ResetScoreboardForm } from "@/components/reset-scoreboard-form";
import { seasonColors } from "@/lib/season-colors";
import { timerRemaining } from "@/lib/timer";

export const dynamic = "force-dynamic";

function StatusControls({ game, state }: { game: (typeof games)[number]; state: Awaited<ReturnType<typeof gameStates>>[number] }) {
  const remaining = timerRemaining(state);
  return <article className="game-control"><div><p className="eyebrow">Game {String(game.id).padStart(2, "0")} · {state.status}</p><h2>{game.title}</h2></div><div className="control-actions">
    <a className="ghost button-link" href={game.id === 4 ? "/scavenger-hunt?preview=1" : `/games/${game.id}?preview=1`}>Preview</a>
    {(["locked", "live", "completed"] as const).map((status) => <form action={setGameStatus} key={status}><input type="hidden" name="gameId" value={game.id} /><button className={state.status === status ? "selected" : "ghost"} name="status" value={status}>{status}</button></form>)}
  </div>{game.id === 4 && <div className="timer-control"><p><strong>{state.timer_phase === "delegation" ? "Delegation timer" : state.timer_phase === "hunt" ? "Hunt timer" : "Timer ready"}</strong>{state.timer_phase !== "idle" && ` · ${state.timer_running ? "playing" : "paused"}`}</p>{state.timer_phase !== "idle" && <Countdown startedAt={state.started_at} seconds={state.timer_running ? state.duration_seconds : remaining} running={Boolean(state.timer_running)} />}<div className="control-actions">
    <form action={controlScavengerTimer}><button name="operation" value="start-delegation" disabled={state.status !== "live"}>Start 2 minutes</button></form>
    <form action={controlScavengerTimer}><button name="operation" value="start-hunt" disabled={state.status !== "live"}>Start 10 minutes</button></form>
    {state.timer_running ? <form action={controlScavengerTimer}><button className="ghost" name="operation" value="pause">Pause</button></form> : state.timer_phase !== "idle" && remaining > 0 ? <form action={controlScavengerTimer}><button className="ghost" name="operation" value="resume" disabled={state.status !== "live"}>Play</button></form> : null}
    <form action={controlScavengerTimer}><button className="ghost" name="operation" value="reset">Reset timer</button></form>
  </div></div>}</article>;
}

function PlacementForm({ gameId, scores }: { gameId: 2 | 4; scores: Awaited<ReturnType<typeof gameScores>> }) {
  const values = [1, 2, 3, 4].map((place) => scores.find((score) => score.game_id === gameId && score.slot === `place-${place}`)?.season ?? "");
  return <form action={savePlacements} className="score-form"><input type="hidden" name="gameId" value={gameId} />{values.map((value, index) => <label key={index}>Place {index + 1}<select name={`place${index + 1}`} defaultValue={value} required><option value="">Choose team</option>{seasons.map((season) => <option key={season}>{season}</option>)}</select></label>)}<button>Finalize placements</button></form>;
}

export default async function GameMasterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const error = (await searchParams).error;
  if (!(await isGameMaster())) return <main className="login-shell"><section className="login-card"><p className="eyebrow">SeasonApproved Analyst</p><h1>Game Master</h1><p className="lede">Enter the event PIN to control games and scoring.</p><form action={gameMasterLogin} className="login-form"><label htmlFor="pin">Game Master PIN</label><input id="pin" name="pin" type="password" inputMode="numeric" autoComplete="current-password" required />{error && <p className="error">{error}</p>}<button>Sign in</button></form></section></main>;

  const [allSubmissions, states, scores] = await Promise.all([submissions(), gameStates(), gameScores()]);
  const pending = allSubmissions.filter((item) => item.status === "pending").length;
  const activeCounts = new Map<string, number>();
  for (const item of allSubmissions.filter((item) => item.status !== "rejected")) {
    const key = `${item.season}:${item.color_hex}`;
    activeCounts.set(key, (activeCounts.get(key) ?? 0) + 1);
  }
  const participants = seasons.flatMap((season) => roster[season]);
  const kahootWinners = [1, 2, 3].map((place) => scores.find((score) => score.game_id === 3 && score.slot === `place-${place}`));
  return (
    <main className="admin-shell">
      <LiveRefresh every={4000} />
      <header className="admin-header"><div><p className="eyebrow">SeasonApproved Analyst</p><h1>Game Master</h1><p>{pending} submission{pending === 1 ? "" : "s"} waiting for review</p></div><div className="control-actions"><a href="/scoreboard" target="_blank">Open TV scoreboard ↗</a><ResetScoreboardForm /><form action={gameMasterLogout}><button className="ghost">Sign out</button></form></div></header>
      <section className="game-controls">{games.map((game) => <StatusControls game={game} state={states.find((state) => state.game_id === game.id)!} key={game.id} />)}</section>

      <section className="panel admin-section"><p className="eyebrow">Game 01</p><h2>Color Song Quiz scoring</h2><div className="song-grid">{Array.from({ length: 22 }, (_, index) => {
        const song = index + 1;
        const saved = scores.find((score) => score.game_id === 1 && score.slot === `song-${String(song).padStart(2, "0")}`);
        return <form action={saveSongScore} className="song-row" key={song}><strong>Song {String(song).padStart(2, "0")}</strong><input type="hidden" name="song" value={song} /><select name="season" defaultValue={saved?.season ?? ""} required><option value="">Team</option>{seasons.map((season) => <option key={season}>{season}</option>)}</select><select name="result" defaultValue={saved?.detail ?? "artist"}><option value="artist">Artist · 1</option><option value="title">Title · 1</option><option value="both">Both · 3</option><option value="incorrect">Incorrect · 0</option><option value="undo">Undo score</option></select><button>Save</button></form>;
      })}</div></section>

      <section className="panel admin-section"><p className="eyebrow">Game 02</p><h2>Outfit Color Match placements</h2><PlacementForm gameId={2} scores={scores} /></section>
      <section className="panel admin-section"><p className="eyebrow">Game 03</p><h2>Kahoot winners</h2><form action={setGameLink} className="link-form"><input type="hidden" name="gameId" value="3" /><label>Kahoot link<input name="url" type="url" defaultValue={states.find((state) => state.game_id === 3)?.external_url} required /></label><button>Save link</button></form><form action={saveKahootWinners} className="score-form">{[1, 2, 3].map((place) => {
        const value = scores.find((score) => score.game_id === 3 && score.slot === `place-${place}`)?.participant ?? "";
        return <label key={place}>Place {place}<select name={`place${place}`} defaultValue={value} required><option value="">Choose participant</option>{participants.map((name) => <option value={name} key={name}>{name} · {seasons.find((season) => roster[season].includes(name))}</option>)}</select></label>;
      })}<button>Finalize winners</button></form>{kahootWinners.every(Boolean) && <div className="saved-result"><strong>Submitted winners</strong><ol>{kahootWinners.map((winner, index) => <li key={winner!.slot}>{index + 1}. {winner!.participant} · Team {winner!.season} · {winner!.points} points</li>)}</ol><p>Edit the selections above and finalize again to update.</p></div>}</section>
      <section className="panel admin-section"><p className="eyebrow">Game 04</p><h2>Scavenger Hunt placements</h2><PlacementForm gameId={4} scores={scores} /></section>

      <section className="panel admin-section"><p className="eyebrow">Game 04</p><h2>Live color progress</h2><div className="hunt-progress">{seasons.map((season) => {
        const teamSubmissions = allSubmissions.filter((item) => item.season === season && item.status !== "rejected");
        const byColor = new Map(teamSubmissions.map((item) => [item.color_hex, item]));
        const approved = teamSubmissions.filter((item) => item.status === "approved");
        return <article className={`hunt-team ${season.toLowerCase()}`} key={season}><h3>{season}</h3><p><strong>{approved.length}/{seasonColors[season].length}</strong> approved · {teamSubmissions.length - approved.length} pending · {approved.reduce((sum, item) => sum + item.points, 0)} in-game points</p><div className="hunt-bar"><span style={{ width: `${approved.length / seasonColors[season].length * 100}%` }} /></div><div className="hunt-colors">{seasonColors[season].map((color) => {
          const submission = byColor.get(color.hex);
          return <span className={submission?.status ?? "missing"} aria-label={`${color.name}: ${submission?.status ?? "missing"}`} title={`${color.name}: ${submission?.status ?? "missing"}`} key={color.hex} style={{ background: color.hex }} />;
        })}</div><details className="hunt-checklist"><summary>View color checklist</summary><ul>{seasonColors[season].map((color) => {
          const status = byColor.get(color.hex)?.status ?? "missing";
          return <li key={color.hex}><i style={{ background: color.hex }} /><span>{color.name}</span><small>{status}</small></li>;
        })}</ul></details></article>;
      })}</div></section>

      <section className="admin-section"><div className="section-heading"><div><p className="eyebrow">Game 04</p><h2>Scavenger Hunt submissions</h2></div></div><section className="submission-grid">
        {allSubmissions.length === 0 && <div className="empty-state"><span>📷</span><h2>No submissions yet</h2><p>New evidence will appear here automatically.</p></div>}
        {allSubmissions.map((item) => {
          const duplicate = (activeCounts.get(`${item.season}:${item.color_hex}`) ?? 0) > 1;
          return <article className="submission-card" key={item.id}><a className="evidence" href={`/media/${item.id}`} target="_blank">
            {/* Private R2 media cannot use the Next image optimizer. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/media/${item.id}`} alt={`Submission from ${item.participant}`} />
          </a><div className="submission-copy"><div className="submission-meta"><div><p className="eyebrow">{item.status}{duplicate ? " · duplicate team color" : ""}</p><h2>{item.participant}</h2></div><time>{new Date(item.created_at + "Z").toLocaleString()}</time></div><p>{item.season} Team · {item.points} in-game point{item.points === 1 ? "" : "s"}</p><p className="submitted-color"><span style={{ background: item.color_hex }} />{item.color_name}</p><form action={reviewSubmission} className="review-form"><input type="hidden" name="submissionId" value={item.id} /><button name="decision" value="approve">Approve</button><button className="danger" name="decision" value="reject">Reject{duplicate ? " duplicate" : ""}</button></form></div></article>;
        })}
      </section></section>
    </main>
  );
}

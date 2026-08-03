import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logout } from "../actions";
import { gameStates, standings } from "@/lib/data";
import { games } from "@/lib/games";
import { isParticipant, roster, seasonFor } from "@/lib/roster";
import { LiveRefresh } from "@/components/live-refresh";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const participant = (await cookies()).get("participant")?.value ?? "";
  if (!isParticipant(participant)) redirect("/");
  const season = seasonFor(participant)!;
  const [currentStandings, states, params] = await Promise.all([standings(), gameStates(), searchParams]);
  const own = currentStandings.find((entry) => entry.season === season)!;
  const personalPoints = own.contributors.find((entry) => entry.name === participant)?.points ?? 0;

  return (
    <main className={`app-shell theme-${season.toLowerCase()}`}>
      <LiveRefresh />
      <header className="app-header">
        <div><p className="eyebrow">Welcome, {participant}</p><h1>Team {season}</h1></div>
        <form action={logout}><button className="ghost">Switch participant</button></form>
      </header>
      {params.error && <div className="error-box">{params.error}</div>}
      <section className="hero-grid">
        <article className="hero-stat"><span>Your contribution</span><strong>{personalPoints}</strong><small>points</small></article>
        <article className="hero-stat"><span>Team total</span><strong>{own.points}</strong><small>points</small></article>
      </section>
      <section className="panel">
        <div className="section-heading"><div><p className="eyebrow">Your people</p><h2>Team {season}</h2></div></div>
        <div className="team-grid">{roster[season].map((name) => <div className={name === participant ? "person you" : "person"} key={name}>{name}{name === participant && <small>You</small>}</div>)}</div>
      </section>
      <section className="action-grid games-grid">
        {games.map((game) => {
          const state = states.find((item) => item.game_id === game.id)?.status ?? "locked";
          const content = <><span>{game.icon}</span><div><p className="eyebrow">Game {String(game.id).padStart(2, "0")} · {state}</p><h2>{game.title}</h2><p>{state === "live" ? game.summary : state === "completed" ? "This game is complete." : "Waiting for the Game Master."}</p></div><b>{state === "live" ? "→" : ""}</b></>;
          return state === "live"
            ? <Link className="action-card primary-action" href={game.id === 4 ? "/scavenger-hunt" : `/games/${game.id}`} key={game.id}>{content}</Link>
            : <article className="action-card disabled" key={game.id}>{content}</article>;
        })}
      </section>
    </main>
  );
}

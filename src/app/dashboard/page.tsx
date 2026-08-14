import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logout } from "../actions";
import { gameStates, gamesAreOver, participant, standings } from "@/lib/data";
import { games } from "@/lib/games";
import { LiveRefresh } from "@/components/live-refresh";
import { WelcomeCelebration, WinnerCelebration } from "@/components/celebration";
import { uniqueLeader } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ error?: string; welcome?: string }> }) {
  const registered = await participant((await cookies()).get("participant")?.value ?? "");
  if (!registered) redirect("/");
  const { name, season } = registered;
  const [currentStandings, states, over, params] = await Promise.all([standings(), gameStates(), gamesAreOver(), searchParams]);
  const own = currentStandings.find((entry) => entry.season === season)!;
  const winner = uniqueLeader(currentStandings);
  const personalPoints = own.contributors.find((entry) => entry.name === name)?.points ?? 0;

  return (
    <main className={`app-shell theme-${season.toLowerCase()}`}>
      <LiveRefresh />
      {params.welcome === "1" && <WelcomeCelebration name={name} season={season} />}
      {params.welcome !== "1" && over && winner && <WinnerCelebration season={winner.season} />}
      <header className="app-header">
        <div><p className="eyebrow">Welcome, {name}</p><h1>Team {season}</h1></div>
        <form action={logout}><button className="ghost">Switch participant</button></form>
      </header>
      {params.error && <div className="error-box">{params.error}</div>}
      <section className="hero-grid">
        <article className="hero-stat"><span>Your contribution</span><strong>{personalPoints}</strong><small>points</small></article>
        <article className="hero-stat"><span>Team total</span><strong>{own.points}</strong><small>points</small></article>
      </section>
      <section className="panel">
        <div className="section-heading"><div><p className="eyebrow">Your people</p><h2>Team {season}</h2></div></div>
        <div className="team-grid">{own.contributors.map((person) => <div className={person.name === name ? "person you" : "person"} key={person.name}>{person.name}{person.name === name && <small>You</small>}</div>)}</div>
      </section>
      <section className="action-grid games-grid">
        {games.map((game) => {
          const state = states.find((item) => item.game_id === game.id)?.status ?? "locked";
          const content = <><span>{game.icon}</span><div><p className="eyebrow">Game {String(game.id).padStart(2, "0")} · {state}</p><h2>{game.title}</h2><p>{state === "live" ? game.summary : state === "completed" ? "Review the directions. Game actions are closed." : "Waiting for the Game Master."}</p></div><b>{state !== "locked" ? "→" : ""}</b></>;
          return state !== "locked"
            ? <Link className={`action-card ${state === "live" ? "primary-action" : "completed-action"}`} href={game.id === 4 ? "/scavenger-hunt" : `/games/${game.id}`} key={game.id}>{content}</Link>
            : <article className="action-card disabled" key={game.id}>{content}</article>;
        })}
      </section>
    </main>
  );
}

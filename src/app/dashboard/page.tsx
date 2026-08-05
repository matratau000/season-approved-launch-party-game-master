import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logout } from "../actions";
import { gameStates, gamesAreOver, standings, teamPhotos } from "@/lib/data";
import { games } from "@/lib/games";
import { isParticipant, roster, seasonFor } from "@/lib/roster";
import { LiveRefresh } from "@/components/live-refresh";
import { WelcomeCelebration, WinnerCelebration } from "@/components/celebration";
import { uniqueLeader } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ error?: string; welcome?: string }> }) {
  const participant = (await cookies()).get("participant")?.value ?? "";
  if (!isParticipant(participant)) redirect("/");
  const season = seasonFor(participant)!;
  const [currentStandings, states, over, photos, params] = await Promise.all([standings(), gameStates(), gamesAreOver(), teamPhotos(), searchParams]);
  const own = currentStandings.find((entry) => entry.season === season)!;
  const winner = uniqueLeader(currentStandings);
  const photo = photos.find((item) => item.season === season);
  const personalPoints = own.contributors.find((entry) => entry.name === participant)?.points ?? 0;

  return (
    <main className={`app-shell theme-${season.toLowerCase()}`}>
      <LiveRefresh />
      {params.welcome === "1" && <WelcomeCelebration name={participant} season={season} />}
      {params.welcome !== "1" && over && winner && <WinnerCelebration season={winner.season} hasPhoto={photos.some((item) => item.season === winner.season)} />}
      <header className="app-header">
        <div><p className="eyebrow">Welcome, {participant}</p><h1>Team {season}</h1></div>
        <form action={logout}><button className="ghost">Switch participant</button></form>
      </header>
      {params.error && <div className="error-box">{params.error}</div>}
      <section className="hero-grid">
        <article className="hero-stat"><span>Your contribution</span><strong>{personalPoints}</strong><small>points</small></article>
        <article className="hero-stat"><span>Team total</span><strong>{own.points}</strong><small>points</small></article>
      </section>
      {photo && <section className="panel team-photo"><p className="eyebrow">Your team photo</p><h2>Team {season}</h2>
        {/* Private R2 media cannot use the Next image optimizer. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/team-photo/${season}`} alt={`Team ${season}`} />
      </section>}
      <section className="panel">
        <div className="section-heading"><div><p className="eyebrow">Your people</p><h2>Team {season}</h2></div></div>
        <div className="team-grid">{roster[season].map((name) => <div className={name === participant ? "person you" : "person"} key={name}>{name}{name === participant && <small>You</small>}</div>)}</div>
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

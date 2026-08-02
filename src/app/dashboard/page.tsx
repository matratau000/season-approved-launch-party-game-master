import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logout } from "../actions";
import { standings } from "@/lib/data";
import { isParticipant, roster, seasonFor } from "@/lib/roster";
import { Standings } from "@/components/standings";
import { LiveRefresh } from "@/components/live-refresh";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const participant = (await cookies()).get("participant")?.value ?? "";
  if (!isParticipant(participant)) redirect("/");
  const season = seasonFor(participant)!;
  const currentStandings = await standings();
  const own = currentStandings.find((entry) => entry.season === season)!;
  const personalPoints = own.contributors.find((entry) => entry.name === participant)?.points ?? 0;

  return (
    <main className={`app-shell theme-${season.toLowerCase()}`}>
      <LiveRefresh />
      <header className="app-header">
        <div><p className="eyebrow">Welcome, {participant}</p><h1>Team {season}</h1></div>
        <form action={logout}><button className="ghost">Switch player</button></form>
      </header>
      <section className="hero-grid">
        <article className="hero-stat"><span>Your contribution</span><strong>{personalPoints}</strong><small>points</small></article>
        <article className="hero-stat"><span>Team total</span><strong>{own.points}</strong><small>points</small></article>
      </section>
      <section className="panel">
        <div className="section-heading"><div><p className="eyebrow">Your people</p><h2>Team {season}</h2></div></div>
        <div className="team-grid">{roster[season].map((name) => <div className={name === participant ? "person you" : "person"} key={name}>{name}{name === participant && <small>You</small>}</div>)}</div>
      </section>
      <section className="action-grid">
        <Link className="action-card primary-action" href="/scavenger-hunt"><span>📸</span><div><p className="eyebrow">Game 01</p><h2>Scavenger Hunt</h2><p>Capture or upload your evidence.</p></div><b>→</b></Link>
        <Link className="action-card" href="/scoreboard"><span>🏆</span><div><p className="eyebrow">Live</p><h2>Scoreboard</h2><p>See who is leading right now.</p></div><b>→</b></Link>
      </section>
      <section className="panel"><div className="section-heading"><div><p className="eyebrow">Live standings</p><h2>Every point counts</h2></div><span className="live-pill">Live</span></div><Standings standings={currentStandings} /></section>
    </main>
  );
}
